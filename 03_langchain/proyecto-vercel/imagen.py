"""Generación de imagen para Instagram con el generador de imágenes de OpenAI.

Instagram exige una imagen (no admite solo texto), así que cuando se publica en IG sin una URL de imagen,
este módulo crea una a partir del contenido aprobado y devuelve una URL pública que Meta pueda descargar.

Secretos (solo en variables de entorno, nunca en el repo):
    OPENAI_API_KEY   clave de la API de OpenAI.
    IMAGE_MODEL      modelo de imagen; por defecto "gpt-image-1-mini" (el más económico de la familia gpt-image).

Los modelos gpt-image-* entregan la imagen en base64; como Instagram necesita una URL pública, esos bytes se
suben al almacenamiento de Zernio (/media/presign) y se usa esa URL. Un modelo que devuelva URL (dall-e) se usa tal cual.
"""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request

from contrato import ErrorContrato

OPENAI_IMAGES = "https://api.openai.com/v1/images/generations"
TIMEOUT_S = 90


def configurado() -> bool:
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


def generar_imagen(descripcion: str, tamano: str = "1024x1024") -> str:
    """Devuelve la URL de una imagen generada a partir del contenido. Lanza ErrorContrato si falla."""
    clave = os.getenv("OPENAI_API_KEY", "").strip()
    if not clave:
        raise ErrorContrato("sin_configurar", "Falta OPENAI_API_KEY para generar la imagen de Instagram.", 503,
                            "define OPENAI_API_KEY y vuelve a desplegar")
    modelo = os.getenv("IMAGE_MODEL", "").strip() or "gpt-image-1-mini"
    prompt = ("Fotografía publicitaria de producto de moda para redes sociales, luz de estudio, "
              "fondo limpio, sin texto superpuesto. " + descripcion)[:900]
    # Los modelos gpt-image-* devuelven base64 (no admiten response_format=url); dall-e sí da URL.
    pide_url = not (modelo.startswith("gpt-image") or modelo.startswith("chatgpt-image"))
    peticion = {"model": modelo, "prompt": prompt, "n": 1, "size": tamano}
    if pide_url:
        peticion["response_format"] = "url"
    req = urllib.request.Request(
        OPENAI_IMAGES, data=json.dumps(peticion).encode("utf-8"), method="POST",
        headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            datos = json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            detalle = json.loads(e.read().decode("utf-8")).get("error", {}).get("message", "")
        except ValueError:
            detalle = ""
        if e.code in (401, 403):
            raise ErrorContrato("backend_acceso", "OpenAI rechazó la clave de imágenes.", 502, detalle[:160] or f"HTTP {e.code}") from None
        if e.code == 429:
            raise ErrorContrato("cuota_ia", "OpenAI alcanzó su límite de uso.", 502, detalle[:160] or "429", True) from None
        raise ErrorContrato("backend", "OpenAI falló al generar la imagen.", 502, detalle[:160] or f"HTTP {e.code}") from None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErrorContrato("backend", "No se pudo conectar con OpenAI para la imagen.", 502, type(e).__name__, True) from None

    imagenes = datos.get("data", []) if isinstance(datos, dict) else []
    primera = imagenes[0] if imagenes and isinstance(imagenes[0], dict) else {}
    if primera.get("url"):
        return primera["url"]
    if primera.get("b64_json"):
        return _subir_a_zernio(base64.b64decode(primera["b64_json"]))
    raise ErrorContrato("backend", "OpenAI no devolvió una imagen utilizable.", 502, "ni url ni b64_json en la respuesta")


def _subir_a_zernio(datos_imagen: bytes, content_type: str = "image/png") -> str:
    """Sube los bytes de la imagen a Zernio y devuelve una URL pública (Instagram necesita una URL, no base64)."""
    clave = os.getenv("ZERNIO_API_KEY", "").strip()
    if not clave:
        raise ErrorContrato("sin_configurar", "Para publicar imágenes en Instagram falta ZERNIO_API_KEY (hospeda la imagen generada).", 503,
                            "define ZERNIO_API_KEY o envía imagen_url en la publicación")
    cuerpo = json.dumps({"filename": "ig.png", "contentType": content_type}).encode("utf-8")
    req = urllib.request.Request(
        "https://zernio.com/api/v1/media/presign", data=cuerpo, method="POST",
        headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            pres = json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        raise ErrorContrato("backend", "Zernio rechazó la subida de la imagen.", 502, f"HTTP {e.code}") from None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErrorContrato("backend", "No se pudo subir la imagen a Zernio.", 502, type(e).__name__, True) from None
    subida, publica = pres.get("uploadUrl"), pres.get("publicUrl")
    if not subida or not publica:
        raise ErrorContrato("backend", "Zernio no devolvió URL de subida.", 502, "respuesta de presign incompleta")
    put = urllib.request.Request(subida, data=datos_imagen, method="PUT", headers={"Content-Type": content_type})
    try:
        urllib.request.urlopen(put, timeout=TIMEOUT_S)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
        raise ErrorContrato("backend", "Falló la subida de la imagen a Zernio.", 502, type(e).__name__, True) from None
    return publica
