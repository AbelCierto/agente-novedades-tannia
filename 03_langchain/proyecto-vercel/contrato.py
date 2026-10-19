"""Contrato de interfaz v1 del MVP «Mesa de ayuda Nimbo».

Este módulo es la frontera entre el navegador y el backend (n8n, Make o LangChain).
Hace dos cosas, y solo dos:

1. ``validar_entrada``: decide si lo que llega del navegador es aceptable.
2. ``normalizar_salida``: convierte lo que devuelve el backend en una respuesta con forma fija,
   descartando todo campo que el contrato no conoce. El navegador solo ve esa forma fija.

Regla de diseño: tolerante con lo que recibe del backend (acepta varias formas) y estricto con lo
que entrega al navegador (siempre la misma forma). No contiene lógica de negocio: las reglas de
Tienda Nimbo viven en el backend.
"""
from __future__ import annotations

import re
from typing import Any

VERSION = "1.0"
MIN_CARACTERES = 3
MAX_CARACTERES = 1000

COLAS = ("devoluciones", "despachos", "postventa", "revision_humana", "fuera_de_alcance")
MOTIVOS = ("devolucion", "cambio", "despacho", "producto_danado", "garantia", "reembolso", "otro")
URGENCIAS = ("baja", "media", "alta")
ESTADOS = ("respondida", "sin_informacion", "fuera_de_alcance", "requiere_humano")
RUTAS = ("A", "B", "R", "C", "D")

# Las frases de abstención del PoC se vuelven estados que el código puede leer.
FRASE_FUERA = "Fuera de alcance"
FRASE_SIN_INFO = "pendiente de información"
FRASE_SIN_PEDIDO = "No encontré el pedido"

_CODIGO_POLITICA = re.compile(r"\bPM-\d{2}\b")
_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class ErrorContrato(Exception):
    """Error con forma conocida: se convierte tal cual en la respuesta de error del contrato."""

    def __init__(self, codigo: str, mensaje: str, status: int = 400, detalle: str = "", reintentable: bool = False):
        super().__init__(mensaje)
        self.codigo = codigo
        self.mensaje = mensaje
        self.status = status
        self.detalle = detalle
        self.reintentable = reintentable


def limpiar_texto(valor: Any, maximo: int) -> str:
    """Convierte a texto, quita caracteres de control y recorta. Nunca devuelve None."""
    if valor is None:
        return ""
    texto = valor if isinstance(valor, str) else str(valor)
    texto = _CONTROL.sub("", texto).replace("\r\n", "\n").strip()
    return texto[:maximo]


def validar_entrada(cuerpo: Any) -> str:
    """Devuelve el mensaje limpio o lanza ErrorContrato('validacion')."""
    if not isinstance(cuerpo, dict) or not isinstance(cuerpo.get("mensaje"), str):
        raise ErrorContrato("validacion", "Escribe el mensaje del cliente.", 400, "falta el campo mensaje")
    bruto = cuerpo["mensaje"]
    if len(bruto) > MAX_CARACTERES * 4:  # corta antes de limpiar mensajes absurdamente largos
        raise ErrorContrato("validacion", f"El mensaje supera los {MAX_CARACTERES} caracteres.", 400, "mensaje demasiado largo")
    mensaje = limpiar_texto(bruto, MAX_CARACTERES * 4)
    if len(mensaje) < MIN_CARACTERES:
        raise ErrorContrato("validacion", f"Escribe al menos {MIN_CARACTERES} caracteres.", 400, "mensaje muy corto")
    if len(mensaje) > MAX_CARACTERES:
        raise ErrorContrato("validacion", f"El mensaje supera los {MAX_CARACTERES} caracteres.", 400, "mensaje demasiado largo")
    return mensaje


def _entero(valor: Any) -> int | None:
    if isinstance(valor, bool):
        return None
    if isinstance(valor, int):
        return valor
    if isinstance(valor, float) and valor.is_integer():
        return int(valor)
    if isinstance(valor, str) and re.fullmatch(r"\s*-?\d{1,9}\s*", valor):
        return int(valor)
    return None


def _booleano(valor: Any) -> bool | None:
    if isinstance(valor, bool):
        return valor
    if isinstance(valor, str) and valor.strip().lower() in ("true", "false"):
        return valor.strip().lower() == "true"
    return None


def _pedido(crudo: Any) -> dict | None:
    if not isinstance(crudo, dict):
        return None
    n = _entero(crudo.get("n_pedido"))
    if n is None:
        return None
    return {
        "n_pedido": n,
        "estado": limpiar_texto(crudo.get("estado"), 40),
        "producto": limpiar_texto(crudo.get("producto"), 120),
        "fecha_entrega": limpiar_texto(crudo.get("fecha_entrega"), 10) or None,
        "dias_desde_entrega": _entero(crudo.get("dias_desde_entrega")),
    }


def _solicitud(crudo: Any) -> dict | None:
    if not isinstance(crudo, dict):
        return None
    motivo = crudo.get("motivo")
    urgencia = crudo.get("urgencia")
    return {
        "es_consulta_tienda": _booleano(crudo.get("es_consulta_tienda")),
        "n_pedido": _entero(crudo.get("n_pedido")),
        "motivo": motivo if motivo in MOTIVOS else None,
        "urgencia": urgencia if urgencia in URGENCIAS else None,
        "resumen": limpiar_texto(crudo.get("resumen"), 200),
    }


def _pasos(crudo: Any) -> list[dict]:
    pasos: list[dict] = []
    if not isinstance(crudo, list):
        return pasos
    for p in crudo[:10]:
        if not isinstance(p, dict):
            continue
        nombre = limpiar_texto(p.get("nombre"), 60)
        if not nombre:
            continue
        tipo = p.get("tipo") if p.get("tipo") in ("herramienta", "paso") else "paso"
        pasos.append({"tipo": tipo, "nombre": nombre, "detalle": limpiar_texto(p.get("detalle"), 200)})
    return pasos


def _citas(crudo: Any, respuesta: str) -> list[str]:
    candidatas: list[str] = []
    if isinstance(crudo, list):
        candidatas += [c for c in crudo if isinstance(c, str)]
    candidatas += _CODIGO_POLITICA.findall(respuesta)
    vistas: list[str] = []
    for c in candidatas:
        c = c.strip().upper()
        if re.fullmatch(r"PM-\d{2}", c) and c not in vistas:
            vistas.append(c)
    return vistas[:6]


def derivar_estado(respuesta: str, cola: str | None) -> str:
    """Convierte las frases de abstención y la cola en uno de los cuatro estados del contrato."""
    if cola == "fuera_de_alcance" or FRASE_FUERA.lower() in respuesta.lower():
        return "fuera_de_alcance"
    if cola == "revision_humana" or FRASE_SIN_PEDIDO.lower() in respuesta.lower():
        return "requiere_humano"
    if FRASE_SIN_INFO.lower() in respuesta.lower():
        return "sin_informacion"
    return "respondida"


def _texto_de(crudo: dict) -> str:
    for clave in ("respuesta", "output", "text", "response", "message"):
        valor = crudo.get(clave)
        if isinstance(valor, str) and valor.strip():
            return limpiar_texto(valor, 2000)
    return ""


def normalizar_salida(crudo: Any, *, backend: str, ruta: str = "", modelo: str = "") -> dict:
    """Convierte la salida cruda del backend en la respuesta v1. Lanza ErrorContrato si no se puede."""
    if isinstance(crudo, list):
        crudo = crudo[0] if crudo and isinstance(crudo[0], dict) else None
    if not isinstance(crudo, dict):
        raise ErrorContrato("respuesta_invalida", "El backend devolvió algo que no es un objeto JSON.", 502, "tipo inesperado")

    if crudo.get("ok") is False:
        err = crudo.get("error") if isinstance(crudo.get("error"), dict) else {}
        codigo = err.get("codigo") if err.get("codigo") in CODIGOS_ERROR else "backend"
        raise ErrorContrato(codigo, limpiar_texto(err.get("mensaje"), 200) or "El backend informó un error.", 502,
                            limpiar_texto(err.get("detalle"), 200), bool(err.get("reintentable")))

    respuesta = _texto_de(crudo)
    solicitud = _solicitud(crudo.get("solicitud"))
    if not respuesta and solicitud is None:
        raise ErrorContrato("respuesta_invalida", "El backend no devolvió ni «respuesta» ni «solicitud».", 502,
                            "campos presentes: " + ", ".join(sorted(str(k) for k in crudo.keys()))[:150])

    cola = crudo.get("cola") if crudo.get("cola") in COLAS else None
    estado = crudo.get("estado") if crudo.get("estado") in ESTADOS else derivar_estado(respuesta, cola)
    ruta_final = (crudo.get("ruta") or ruta or "").upper()

    return {
        "ok": True,
        "estado": estado,
        "respuesta": respuesta,
        "citas": _citas(crudo.get("citas"), respuesta),
        "pedido": _pedido(crudo.get("pedido")),
        "solicitud": solicitud,
        "cola": cola,
        "razon": limpiar_texto(crudo.get("razon"), 200),
        "alerta": limpiar_texto(crudo.get("alerta"), 200),
        "pasos": _pasos(crudo.get("pasos")),
        "meta": {
            "version": VERSION,
            "backend": backend,
            "ruta": ruta_final if ruta_final in RUTAS else "",
            "modelo": limpiar_texto(crudo.get("modelo") or modelo, 80),
            "llamadas_modelo": _entero(crudo.get("llamadas_modelo")),
        },
    }


CODIGOS_ERROR = (
    "validacion", "acceso", "limite", "sin_configurar", "backend_acceso", "backend_url",
    "cuota_ia", "backend", "timeout", "respuesta_invalida",
)

MENSAJES_ERROR = {
    "validacion": "El mensaje no es válido.",
    "acceso": "El código de acceso no es correcto.",
    "limite": "Hay demasiadas solicitudes seguidas. Espera un momento y vuelve a intentar.",
    "sin_configurar": "El servicio todavía no está configurado.",
    "backend_acceso": "El backend rechazó las credenciales del servicio.",
    "backend_url": "No se encontró el backend en la URL configurada.",
    "cuota_ia": "El modelo gratuito alcanzó su límite de uso. Reintenta en un minuto o mañana.",
    "backend": "El backend no respondió correctamente.",
    "timeout": "El backend tardó demasiado en responder.",
    "respuesta_invalida": "El backend respondió con un formato que el contrato no reconoce.",
}


def respuesta_error(error: ErrorContrato, id_solicitud: str, backend: str = "") -> dict:
    codigo = error.codigo if error.codigo in CODIGOS_ERROR else "backend"
    return {
        "ok": False,
        "error": {
            "codigo": codigo,
            "mensaje": limpiar_texto(error.mensaje, 200) or MENSAJES_ERROR.get(codigo, "Error inesperado."),
            "detalle": limpiar_texto(error.detalle, 200),
            "reintentable": bool(error.reintentable),
        },
        "meta": {"version": VERSION, "backend": limpiar_texto(backend, 40), "id": limpiar_texto(id_solicitud, 40)},
    }
