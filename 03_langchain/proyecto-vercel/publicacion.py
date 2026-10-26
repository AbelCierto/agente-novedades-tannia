"""Publicación en redes sociales vía la API REST de Zernio (https://zernio.com).

Esta pieza es la Fase 2 del MVP: NO forma parte del bucle del agente. Solo se llama desde
/api/publicar, después de que una persona aprobó el contenido en la pantalla (reglas PM-01/PM-05/PM-06:
nada se publica sin aprobación humana). Es una llamada determinística del servidor, no del modelo.

Secretos (nunca en el repo, solo en variables de entorno de Vercel):
    ZERNIO_API_KEY      obligatoria · clave de https://zernio.com/dashboard/api-keys (Authorization: Bearer).
    ZERNIO_PROFILE_ID   opcional    · perfil donde están conectadas las cuentas; si falta, se usa el perfil por defecto.
    ZERNIO_PUBLICAR     opcional    · "ahora" publica de inmediato; cualquier otro valor (por defecto) crea un BORRADOR en Zernio.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from contrato import ErrorContrato, limpiar_texto

ZERNIO_API = "https://zernio.com/api/v1"
TIMEOUT_S = 30

# Zernio maneja TikTok y Facebook; Instagram sigue usando Meta Graph API.
REDES_VALIDAS = ("tiktok", "facebook")
MAX_CONTENIDO = 2200


def _clave() -> str:
    clave = os.getenv("ZERNIO_API_KEY", "").strip()
    if not clave:
        raise ErrorContrato("sin_configurar", "Falta la variable ZERNIO_API_KEY en Vercel.", 503,
                            "define ZERNIO_API_KEY y vuelve a desplegar")
    return clave


def configurado() -> bool:
    return bool(os.getenv("ZERNIO_API_KEY", "").strip())


def _pedir(metodo: str, ruta: str, cuerpo: dict | None = None) -> tuple[int, Any]:
    datos = json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None
    req = urllib.request.Request(
        ZERNIO_API + ruta, data=datos, method=metodo,
        headers={"Authorization": f"Bearer {_clave()}", "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            return r.status, json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            cuerpo_err = json.loads(e.read().decode("utf-8"))
        except ValueError:
            cuerpo_err = {}
        return e.code, cuerpo_err
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErrorContrato("backend", "No se pudo conectar con Zernio.", 502,
                            f"{type(e).__name__}", True) from None


def _traducir_http(status: int, cuerpo: Any) -> ErrorContrato:
    detalle = ""
    if isinstance(cuerpo, dict):
        detalle = limpiar_texto(cuerpo.get("error") or cuerpo.get("message"), 160)
    if status in (401, 403):
        return ErrorContrato("backend_acceso", "Zernio rechazó la clave o el permiso.", 502,
                             detalle or f"Zernio respondió {status}")
    if status == 404:
        return ErrorContrato("backend_url", "Zernio no encontró el recurso (perfil o cuenta).", 502,
                             detalle or "revisa ZERNIO_PROFILE_ID y las cuentas conectadas")
    if status == 429:
        return ErrorContrato("limite", "Zernio limitó las solicitudes. Espera un momento.", 429,
                             detalle or "429 de Zernio", True)
    return ErrorContrato("backend", "Zernio respondió con un error al publicar.", 502,
                         detalle or f"Zernio respondió {status}", status >= 500)


def _perfil_id() -> str:
    perfil = os.getenv("ZERNIO_PROFILE_ID", "").strip()
    if perfil and perfil.lower() not in ("default", "auto"):  # "default" es un placeholder, no un id válido
        return perfil
    status, cuerpo = _pedir("GET", "/profiles")
    if status != 200:
        raise _traducir_http(status, cuerpo)
    perfiles = cuerpo.get("profiles", []) if isinstance(cuerpo, dict) else []
    elegido = next((p for p in perfiles if p.get("isDefault")), None) or (perfiles[0] if perfiles else None)
    if not elegido:
        raise ErrorContrato("sin_configurar", "No hay ningún perfil en Zernio.", 503,
                            "crea un perfil y conecta cuentas en el panel de Zernio")
    return elegido.get("_id") or elegido.get("id")


def _cuenta_id(perfil_id: str, red: str) -> str:
    status, cuerpo = _pedir("GET", f"/accounts?profileId={perfil_id}")
    if status != 200:
        raise _traducir_http(status, cuerpo)
    cuentas = cuerpo.get("accounts", []) if isinstance(cuerpo, dict) else []
    cuenta = next((c for c in cuentas if c.get("platform") == red and c.get("isActive", True)), None)
    if not cuenta:
        raise ErrorContrato("sin_configurar", f"No hay una cuenta de {red} conectada en Zernio.", 503,
                            f"conecta una cuenta de {red} en el perfil {perfil_id}")
    return cuenta.get("_id") or cuenta.get("id")


def publicar(red: str, contenido: str, imagen_url: str | None = None) -> dict[str, Any]:
    """Publica un contenido ya aprobado en TikTok o Facebook. Devuelve {red, id, estado, borrador}."""
    red = (red or "").strip().lower()
    if red not in REDES_VALIDAS:
        raise ErrorContrato("validacion", "Red no soportada.", 400, f"usa una de: {', '.join(REDES_VALIDAS)}")
    contenido = limpiar_texto(contenido, MAX_CONTENIDO)
    if len(contenido) < 3:
        raise ErrorContrato("validacion", "El contenido a publicar está vacío.", 400, "contenido muy corto")
    if red == "tiktok" and not imagen_url:
        raise ErrorContrato("validacion", "TikTok requiere una imagen o un video.", 400, "falta imagen para TikTok")

    perfil_id = _perfil_id()
    cuenta_id = _cuenta_id(perfil_id, red)
    ahora = os.getenv("ZERNIO_PUBLICAR", "").strip().lower() == "ahora"

    cuerpo: dict[str, Any] = {
        "content": contenido,
        "profileId": perfil_id,
        "platforms": [{"platform": red, "accountId": cuenta_id}],
        "publishNow" if ahora else "isDraft": True,
    }
    if imagen_url:
        cuerpo["mediaItems"] = [{"type": "image", "url": imagen_url}]
    if red == "tiktok":
        # TikTok exige estos ajustes; una foto admite cualquier privacidad (un video nuevo solo PUBLIC_TO_EVERYONE).
        cuerpo["tiktokSettings"] = {
            "privacy_level": "PUBLIC_TO_EVERYONE",
            "allow_comment": True, "allow_duet": True, "allow_stitch": True,
            "commercial_content_type": "none",
            "content_preview_confirmed": True, "express_consent_given": True,
            "media_type": "photo", "auto_add_music": True,
        }
    status, respuesta = _pedir("POST", "/posts", cuerpo)
    if status not in (200, 201):
        raise _traducir_http(status, respuesta)

    post = respuesta.get("post", respuesta) if isinstance(respuesta, dict) else {}
    return {
        "red": red,
        "id": limpiar_texto(post.get("_id") or post.get("id"), 60),
        "estado": limpiar_texto(post.get("status"), 40) or ("publicado" if ahora else "borrador"),
        "borrador": not ahora,
    }
