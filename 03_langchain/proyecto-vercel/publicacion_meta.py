"""Publicación en Facebook e Instagram vía Meta Graph API (reemplaza a Zernio en estas dos redes).

Se llama solo desde /api/publicar, después de la aprobación humana (igual que publicacion.py). Es una
llamada determinística del servidor, no del agente.

Para TUS propias cuentas basta una app de Meta en modo desarrollo (no necesitas App Review). Requisitos:
- Facebook: una Página y un Page Access Token de larga duración.
- Instagram: cuenta Business/Creator vinculada a esa Página. IG exige imagen o video (no admite solo texto).

Secretos (solo en variables de entorno de Vercel, nunca en el repo):
    META_PAGE_ID            id de la Página de Facebook.
    META_PAGE_ACCESS_TOKEN  token de la Página (permisos pages_manage_posts; para IG, instagram_content_publish).
    META_IG_USER_ID         id de la cuenta de Instagram Business vinculada a la Página.
    META_PUBLICAR           "ahora" publica en vivo; por defecto la publicación de Facebook queda sin publicar (revisión).
    META_GRAPH_VERSION      versión de la Graph API (por defecto v21.0).
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from contrato import ErrorContrato, limpiar_texto

TIMEOUT_S = 30
REDES_VALIDAS = ("facebook", "instagram")
MAX_CONTENIDO = 2200


def _graph() -> str:
    version = os.getenv("META_GRAPH_VERSION", "").strip() or "v21.0"
    return f"https://graph.facebook.com/{version}"


def _token() -> str:
    token = os.getenv("META_PAGE_ACCESS_TOKEN", "").strip()
    if not token:
        raise ErrorContrato("sin_configurar", "Falta META_PAGE_ACCESS_TOKEN en Vercel.", 503,
                            "define el token de la Página y vuelve a desplegar")
    return token


def configurado() -> bool:
    return bool(os.getenv("META_PAGE_ACCESS_TOKEN", "").strip() and os.getenv("META_PAGE_ID", "").strip())


def _pedir(ruta: str, datos: dict) -> tuple[int, Any]:
    cuerpo = urllib.parse.urlencode(datos).encode("utf-8")
    req = urllib.request.Request(
        _graph() + ruta, data=cuerpo, method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            return r.status, json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8"))
        except ValueError:
            return e.code, {}
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErrorContrato("backend", "No se pudo conectar con Meta.", 502, type(e).__name__, True) from None


def _traducir(status: int, cuerpo: Any) -> ErrorContrato:
    err = cuerpo.get("error", {}) if isinstance(cuerpo, dict) else {}
    detalle = limpiar_texto(err.get("message"), 160) or f"Meta respondió {status}"
    codigo_meta = err.get("code")
    if "publish_actions" in detalle.lower():
        return ErrorContrato(
            "backend_acceso",
            "Meta recibió una solicitud con un permiso antiguo (publish_actions).",
            502,
            "el despliegue activo no coincide con este código o el token/app pertenece a un flujo antiguo; "
            "publica con un Page Access Token y pages_manage_posts",
        )
    if codigo_meta == 190 or status in (401, 403) or err.get("type") == "OAuthException":
        return ErrorContrato("backend_acceso", "Meta rechazó el token o el permiso.", 502, detalle)
    if codigo_meta in (4, 17, 32, 613):  # límites de uso de la Graph API
        return ErrorContrato("limite", "Meta limitó las solicitudes. Espera un momento.", 429, detalle, True)
    return ErrorContrato("backend", "Meta respondió con un error al publicar.", 502, detalle, status >= 500)


def publicar_facebook(contenido: str, imagen_url: str | None = None) -> dict[str, Any]:
    page_id = os.getenv("META_PAGE_ID", "").strip()
    if not page_id:
        raise ErrorContrato("sin_configurar", "Falta META_PAGE_ID en Vercel.", 503, "define el id de la Página")
    ahora = os.getenv("META_PUBLICAR", "").strip().lower() == "ahora"
    token = _token()
    if imagen_url:  # con imagen: se publica como foto con pie de foto
        datos = {"url": imagen_url, "caption": contenido, "access_token": token}
        if not ahora:
            datos["published"] = "false"
        status, r = _pedir(f"/{page_id}/photos", datos)
        id_post = (r.get("post_id") or r.get("id")) if isinstance(r, dict) else None
    else:
        datos = {"message": contenido, "access_token": token}
        if not ahora:  # published=false deja la publicación sin publicar para revisarla en Meta Business Suite
            datos["published"] = "false"
        status, r = _pedir(f"/{page_id}/feed", datos)
        id_post = r.get("id") if isinstance(r, dict) else None
    if status not in (200, 201) or not id_post:
        raise _traducir(status, r)
    return {"red": "facebook", "id": limpiar_texto(id_post, 80),
            "estado": "publicado" if ahora else "no_publicado", "borrador": not ahora}


def publicar_instagram(contenido: str, imagen_url: str | None = None) -> dict[str, Any]:
    ig_id = os.getenv("META_IG_USER_ID", "").strip()
    if not ig_id:
        raise ErrorContrato("sin_configurar", "Falta META_IG_USER_ID en Vercel.", 503, "define el id de Instagram Business")
    if not imagen_url:
        import imagen  # se importa aquí para no exigir OPENAI_API_KEY cuando se publica solo en Facebook
        imagen_url = imagen.generar_imagen(contenido)

    token = _token()
    # Paso 1: crear el contenedor de medios con la imagen y la caption.
    status, cont = _pedir(f"/{ig_id}/media", {"image_url": imagen_url, "caption": contenido, "access_token": token})
    if status not in (200, 201) or not isinstance(cont, dict) or not cont.get("id"):
        raise _traducir(status, cont)
    # Paso 2: publicar el contenedor.
    status, pub = _pedir(f"/{ig_id}/media_publish", {"creation_id": cont["id"], "access_token": token})
    if status not in (200, 201) or not isinstance(pub, dict) or not pub.get("id"):
        raise _traducir(status, pub)
    return {"red": "instagram", "id": limpiar_texto(pub.get("id"), 80), "estado": "publicado", "borrador": False}


def publicar(red: str, contenido: str, imagen_url: str | None = None) -> dict[str, Any]:
    """Publica un contenido ya aprobado en Facebook o Instagram. Devuelve {red, id, estado, borrador}."""
    red = (red or "").strip().lower()
    contenido = limpiar_texto(contenido, MAX_CONTENIDO)
    if len(contenido) < 3:
        raise ErrorContrato("validacion", "El contenido a publicar está vacío.", 400, "contenido muy corto")
    if red == "facebook":
        return publicar_facebook(contenido, imagen_url)
    if red == "instagram":
        return publicar_instagram(contenido, imagen_url)
    raise ErrorContrato("validacion", "Red no soportada por Meta.", 400, "usa facebook o instagram")
