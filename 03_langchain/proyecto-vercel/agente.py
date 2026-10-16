"""Agente de la Mesa de ayuda Nimbo con LangChain (ruta C del curso).

Un modelo de lenguaje con dos herramientas. En cada consulta el MODELO decide qué herramienta usar y cuándo
responder; el código solo define las herramientas, pone límites y traduce el resultado al contrato de la pantalla.

    buscar_politicas(consulta)   busca en las políticas de la tienda (búsqueda por palabras: busqueda.py)
    consultar_pedido(n_pedido)   entrega estado y fechas de un pedido (la tabla PEDIDOS de datos.py)

app.py llama a ejecutar_agente(mensaje) y recibe un diccionario con la respuesta, el pedido consultado y los pasos
que siguió el agente. Validar el mensaje, limitar visitas y dar forma final a la respuesta lo hace el proxy.
"""
from __future__ import annotations

import json
import os
from datetime import date
from typing import Any

import openai
from langchain.agents import create_agent
from langchain.agents.middleware import ModelCallLimitMiddleware, ToolCallLimitMiddleware
from langchain.agents.middleware.model_call_limit import ModelCallLimitExceededError
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.errors import GraphRecursionError

from busqueda import buscar
from contrato import ErrorContrato
from datos import DESC_BUSCAR_POLITICAS, DESC_CONSULTAR_PEDIDO, FECHA_REFERENCIA, MODEL_ID, PEDIDOS, PROMPT_AGENTE

# ----------------------------------------------------------------------------- EDITA AQUÍ
OPENROUTER_URL = os.getenv("OPENROUTER_BASE_URL", "").strip() or "https://openrouter.ai/api/v1"   # otro proveedor compatible con OpenAI, si quieres
MODELO = os.getenv("MODEL_ID", "").strip() or MODEL_ID   # puedes cambiar de modelo desde las variables de Vercel
MAX_LLAMADAS_MODELO = 6    # veces que el agente puede llamar al modelo por consulta (la cuota gratuita es pequeña)
MAX_LLAMADAS_HERRAMIENTAS = 4
ESPERA_MODELO_S = 60       # cuánto espera cada llamada al modelo antes de rendirse
# -----------------------------------------------------------------------------------------


# ----------------------------------------------------------------------------- herramientas
@tool("buscar_politicas", description=DESC_BUSCAR_POLITICAS)
def buscar_politicas(consulta: str) -> str:
    hallazgos = buscar(consulta)
    if not hallazgos:
        return "Ninguna política coincide con la consulta."
    return "\n\n".join(f"{p['id']} · {p['titulo']}\n{p['texto']}" for p in hallazgos)


@tool("consultar_pedido", description=DESC_CONSULTAR_PEDIDO)
def consultar_pedido(n_pedido: int) -> str:
    # En un caso real, aquí iría una consulta a tu base de datos o a la API de tu tienda.
    pedido = next((p for p in PEDIDOS if p["n_pedido"] == n_pedido), None)
    if pedido is None:
        return json.dumps({"encontrado": False, "n_pedido": n_pedido, "mensaje": "No existe un pedido con ese número."}, ensure_ascii=False)
    hoy = date.fromisoformat(FECHA_REFERENCIA)
    datos = {"encontrado": True, **pedido, "dias_desde_compra": (hoy - date.fromisoformat(pedido["fecha_compra"])).days}
    if pedido["fecha_entrega"]:
        datos["dias_desde_entrega"] = (hoy - date.fromisoformat(pedido["fecha_entrega"])).days
    return json.dumps(datos, ensure_ascii=False)


# ----------------------------------------------------------------------------- el agente
_agente = None


def obtener_agente():
    """Crea el agente la primera vez y lo reutiliza mientras la instancia de Vercel siga viva."""
    global _agente
    if _agente is None:
        modelo = ChatOpenAI(
            model=MODELO,
            base_url=OPENROUTER_URL,
            api_key=os.environ["OPENROUTER_API_KEY"],
            temperature=0,
            timeout=ESPERA_MODELO_S,
            max_retries=1,
        )
        _agente = create_agent(
            model=modelo,
            tools=[buscar_politicas, consultar_pedido],
            system_prompt=PROMPT_AGENTE,
            middleware=[
                # Los límites protegen tu cuota: sin ellos, un modelo despistado puede llamar herramientas en bucle.
                ModelCallLimitMiddleware(run_limit=MAX_LLAMADAS_MODELO, exit_behavior="error"),
                ToolCallLimitMiddleware(run_limit=MAX_LLAMADAS_HERRAMIENTAS),
            ],
        )
    return _agente


async def ejecutar_agente(mensaje: str) -> dict[str, Any]:
    try:
        resultado = await obtener_agente().ainvoke(
            {"messages": [{"role": "user", "content": mensaje}]},
            config={"recursion_limit": 2 * MAX_LLAMADAS_MODELO + 2},
        )
    except Exception as e:  # noqa: BLE001
        raise traducir_error(e) from None
    return armar_salida(resultado["messages"])


# ----------------------------------------------------------------------------- del resultado de LangChain al contrato
def _texto(contenido: Any) -> str:
    if isinstance(contenido, str):
        return contenido.strip()
    if isinstance(contenido, list):  # algunos modelos devuelven bloques: se juntan los de texto
        return "".join(b if isinstance(b, str) else b.get("text", "") for b in contenido if isinstance(b, (str, dict))).strip()
    return ""


def armar_salida(mensajes: list) -> dict[str, Any]:
    """Convierte los mensajes de la ejecución en {respuesta, pedido, pasos, modelo, llamadas_modelo}."""
    ultimo_usuario = max(i for i, m in enumerate(mensajes) if m.type == "human")
    nuevos = mensajes[ultimo_usuario + 1:]
    resultados = {m.tool_call_id: m for m in nuevos if isinstance(m, ToolMessage)}
    respuestas_ia = [m for m in nuevos if isinstance(m, AIMessage)]

    pedido, pasos = None, []
    for m in respuestas_ia:
        for llamada in m.tool_calls:
            observacion = _texto(resultados[llamada["id"]].content) if llamada["id"] in resultados else ""
            nombre, args = llamada["name"], llamada["args"]
            if nombre == "consultar_pedido":
                datos = _json_o_none(observacion)
                n = args.get("n_pedido", "?")
                if isinstance(datos, dict) and datos.get("encontrado"):
                    # a la pantalla solo viaja lo que el contrato necesita
                    pedido = {k: datos.get(k) for k in ("n_pedido", "estado", "producto", "fecha_entrega", "dias_desde_entrega")}
                    dias = datos.get("dias_desde_entrega")
                    detalle = f"n_pedido = {n} → " + (f"{datos['estado']} hace {dias} días" if dias is not None else datos["estado"])
                else:
                    detalle = f"n_pedido = {n} → no existe"
            elif nombre == "buscar_politicas":
                codigos = sorted(set(_codigos_politica(observacion)))
                detalle = f"«{args.get('consulta', '')}» → {', '.join(codigos) or 'sin coincidencias'}"
            else:
                detalle = observacion[:120]
            pasos.append({"tipo": "herramienta", "nombre": nombre, "detalle": detalle})

    final = next((m for m in reversed(respuestas_ia) if not m.tool_calls), None)
    texto = _texto(final.content) if final else ""
    if not texto:
        raise ErrorContrato("backend", "El agente no logró terminar su respuesta.", 502, "el modelo no devolvió texto final", True)
    return {"respuesta": texto, "pedido": pedido, "pasos": pasos, "modelo": MODELO, "llamadas_modelo": len(respuestas_ia)}


def _json_o_none(texto: str) -> Any:
    try:
        return json.loads(texto)
    except ValueError:
        return None


def _codigos_politica(texto: str) -> list[str]:
    import re
    return re.findall(r"POL-\d\d", texto)


def traducir_error(e: Exception) -> ErrorContrato:
    """Convierte las excepciones de OpenRouter / LangChain en errores del contrato (la pantalla sabe explicarlos)."""
    if isinstance(e, ErrorContrato):
        return e
    if isinstance(e, openai.RateLimitError):
        return ErrorContrato("cuota_ia", "El modelo gratuito alcanzó su límite de uso.", 502, "OpenRouter respondió 429", True)
    if isinstance(e, (openai.AuthenticationError, openai.PermissionDeniedError)):
        return ErrorContrato("backend", "OpenRouter rechazó la clave: revisa OPENROUTER_API_KEY en Vercel.", 502,
                             f"OpenRouter respondió {e.status_code}")
    if isinstance(e, openai.APITimeoutError):
        return ErrorContrato("timeout", "El modelo tardó demasiado en responder.", 504, f"sin respuesta en {ESPERA_MODELO_S} s", True)
    if isinstance(e, openai.APIConnectionError):
        return ErrorContrato("backend", "No se pudo conectar con OpenRouter.", 502, type(e).__name__, True)
    if isinstance(e, (ModelCallLimitExceededError, GraphRecursionError)):
        return ErrorContrato("backend", "El agente no logró terminar con las herramientas disponibles.", 502,
                             f"límite de {MAX_LLAMADAS_MODELO} {'llamada' if MAX_LLAMADAS_MODELO == 1 else 'llamadas'} al modelo", True)
    if isinstance(e, openai.APIStatusError):
        pista = (str(e.message) if getattr(e, "message", None) else "")[:100]
        return ErrorContrato("backend", "El modelo respondió con un error.", 502, f"OpenRouter respondió {e.status_code} · {pista}".strip(" ·"),
                             e.status_code >= 500)
    return ErrorContrato("backend", "El agente falló.", 500, type(e).__name__)
