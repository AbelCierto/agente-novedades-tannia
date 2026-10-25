"""Login con Firebase Authentication (correo y contraseña) y roles: el editor crea y edita propuestas; el admin hace todo,
incluido generar la imagen y publicar.

Las cuentas se crean a mano en la consola de Firebase (sin registro abierto). El rol se asigna por correo en variables
de entorno, así no hace falta el Admin SDK ni una cuenta de servicio:

    FIREBASE_PROJECT_ID    id del proyecto de Firebase.
    FIREBASE_WEB_API_KEY   clave web del proyecto (es pública por diseño: identifica el proyecto, no da permisos).
    AUTH_EDITORES          correos separados por coma que pueden crear y editar propuestas.
    AUTH_ADMINS            correos separados por coma que pueden hacer todo: crear, generar la imagen y publicar.

El backend verifica cada ID token de Firebase: firma RS256 con los certificados públicos de Google, audiencia,
emisor y vencimiento.
"""
from __future__ import annotations

import json
import os
import re
import threading
import time
import urllib.request

import jwt
from cryptography.x509 import load_pem_x509_certificate
from fastapi import Request

from contrato import ErrorContrato

CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
NIVEL = {"editor": 1, "admin": 2}

_certs: dict[str, str] = {}
_vencen = 0.0
_candado = threading.Lock()


def proyecto() -> str:
    return os.getenv("FIREBASE_PROJECT_ID", "").strip()


def api_key_web() -> str:
    return os.getenv("FIREBASE_WEB_API_KEY", "").strip()


def configurado() -> bool:
    return bool(proyecto() and api_key_web())


def _correos(variable: str) -> set[str]:
    return {c.strip().lower() for c in os.getenv(variable, "").split(",") if c.strip()}


def rol_de(email: str) -> str | None:
    correo = (email or "").strip().lower()
    if correo in _correos("AUTH_ADMINS"):
        return "admin"
    if correo in _correos("AUTH_EDITORES"):
        return "editor"
    return None


def _certificados() -> dict[str, str]:
    global _certs, _vencen
    with _candado:
        if _certs and time.time() < _vencen:
            return _certs
        try:
            with urllib.request.urlopen(CERTS_URL, timeout=10) as r:
                datos = json.loads(r.read().decode("utf-8"))
                cache = r.headers.get("Cache-Control", "")
        except (OSError, ValueError) as e:
            raise ErrorContrato("backend", "No se pudo verificar la sesión con Google.", 502, type(e).__name__, True) from None
        edad = re.search(r"max-age=(\d+)", cache)
        _certs, _vencen = datos, time.time() + (int(edad.group(1)) if edad else 3600)
        return _certs


def verificar_token(token: str) -> dict:
    """Devuelve las claims del ID token de Firebase o lanza ErrorContrato('acceso', 401)."""
    invalido = ErrorContrato("acceso", "Tu sesión expiró o no es válida. Vuelve a iniciar sesión.", 401, "token de Firebase inválido")
    try:
        kid = jwt.get_unverified_header(token).get("kid")
    except jwt.PyJWTError:
        raise invalido from None
    pem = _certificados().get(kid or "")
    if not pem:
        raise invalido
    clave = load_pem_x509_certificate(pem.encode("utf-8")).public_key()
    try:
        return jwt.decode(token, clave, algorithms=["RS256"], audience=proyecto(),
                          issuer=f"https://securetoken.google.com/{proyecto()}", leeway=30,
                          options={"require": ["exp", "iat", "sub"]})
    except jwt.PyJWTError:
        raise invalido from None


def exigir(request: Request, rol_minimo: str) -> dict:
    """Verifica el token del encabezado Authorization y que el usuario tenga al menos rol_minimo."""
    cabecera = request.headers.get("authorization", "")
    if not cabecera.lower().startswith("bearer "):
        raise ErrorContrato("acceso", "Inicia sesión para continuar.", 401, "falta Authorization: Bearer")
    claims = verificar_token(cabecera[7:].strip())
    email = str(claims.get("email") or "")
    rol = rol_de(email)
    if rol is None:
        raise ErrorContrato("acceso", "Tu usuario no tiene un rol asignado. Pide acceso al administrador.", 403, "correo sin rol")
    if NIVEL[rol] < NIVEL[rol_minimo]:
        raise ErrorContrato("acceso", "Solo un admin puede generar la imagen y publicar.", 403, f"rol {rol}, se requiere {rol_minimo}")
    return {"email": email, "rol": rol}
