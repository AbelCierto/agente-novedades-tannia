"""Agente de contenido de Novedades Tannia con LangChain (ruta C del curso).

Un modelo de lenguaje con dos herramientas. En cada consulta el MODELO decide qué herramienta usar y cuándo
responder; el código solo define las herramientas, pone límites y traduce el resultado al contrato de la pantalla.

    buscar_perfil_marca(consulta)              perfil de marca y reglas por red social (búsqueda por palabras: busqueda.py)
    consultar_catalogo(categoria, disponibles) prendas del catálogo con precio_oferta y campos_faltantes (PRODUCTOS de datos.py)

app.py llama a ejecutar_agente(mensaje) y recibe un diccionario con la propuesta de contenido y los pasos que siguió
el agente. Validar el mensaje, limitar visitas y dar forma final a la respuesta lo hace el proxy.
"""
from __future__ import annotations

import json
import os
import re
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
from datos import DESC_BUSCAR_PERFIL, DESC_CONSULTAR_CATALOGO, MODEL_ID, PRODUCTOS, PROMPT_AGENTE

# ----------------------------------------------------------------------------- EDITA AQUÍ
OPENROUTER_URL = os.getenv("OPENROUTER_BASE_URL", "").strip() or "https://openrouter.ai/api/v1"   # otro proveedor compatible con OpenAI, si quieres
MODELO = os.getenv("MODEL_ID", "").strip() or MODEL_ID   # puedes cambiar de modelo desde las variables de Vercel
MAX_LLAMADAS_MODELO = 10   # veces que el agente puede llamar al modelo por consulta (generar 3 redes usa ~8)
MAX_LLAMADAS_HERRAMIENTAS = 6
ESPERA_MODELO_S = 60       # cuánto espera cada llamada al modelo antes de rendirse
# -----------------------------------------------------------------------------------------


# ----------------------------------------------------------------------------- herramientas
@tool("buscar_perfil_marca", description=DESC_BUSCAR_PERFIL)
def buscar_perfil_marca(consulta: str) -> str:
    hallazgos = buscar(consulta)
    if not hallazgos:
        return "Ninguna regla de marca coincide con la consulta."
    return "\n\n".join(f"{p['id']} · {p['titulo']}\n{p['texto']}" for p in hallazgos)


def _campos_faltantes(p: dict) -> list[str]:
    faltan = []
    if p.get("precio_soles") is None:
        faltan.append("precio")
    if not p.get("imagen_autorizada"):
        faltan.append("imagen")
    if not p.get("stock"):
        faltan.append("stock")
    return faltan


def _precio_oferta(p: dict) -> float | None:
    """Calcula en código el precio con descuento: el modelo no debe calcular precios (regla PM-05)."""
    precio = p.get("precio_soles")
    promo = p.get("promocion") or ""
    if precio is None:
        return None
    m = re.match(r"\s*(\d{1,3})\s*%", promo)
    if not m:
        return None
    descuento = int(m.group(1))
    if not 0 < descuento < 100:
        return None
    return round(precio * (100 - descuento) / 100, 2)


@tool("consultar_catalogo", description=DESC_CONSULTAR_CATALOGO)
def consultar_catalogo(categoria: str = "", solo_disponibles: bool = True) -> str:
    # En un caso real, aquí iría una consulta a tu base de datos o a la API de tu tienda.
    resultado = []
    for p in PRODUCTOS:
        if categoria and p["categoria"].lower() != categoria.strip().lower():
            continue
        if solo_disponibles and not p.get("stock"):
            continue
        resultado.append({**p, "precio_oferta": _precio_oferta(p), "campos_faltantes": _campos_faltantes(p)})
    if not resultado:
        return json.dumps({"encontrado": False, "categoria": categoria, "mensaje": "No hay prendas que coincidan."}, ensure_ascii=False)
    return json.dumps({"encontrado": True, "prendas": resultado}, ensure_ascii=False)


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
            tools=[buscar_perfil_marca, consultar_catalogo],
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
    """Convierte los mensajes de la ejecución en {respuesta, pasos, modelo, llamadas_modelo}."""
    ultimo_usuario = max(i for i, m in enumerate(mensajes) if m.type == "human")
    nuevos = mensajes[ultimo_usuario + 1:]
    resultados = {m.tool_call_id: m for m in nuevos if isinstance(m, ToolMessage)}
    respuestas_ia = [m for m in nuevos if isinstance(m, AIMessage)]

    pasos = []
    for m in respuestas_ia:
        for llamada in m.tool_calls:
            observacion = _texto(resultados[llamada["id"]].content) if llamada["id"] in resultados else ""
            nombre, args = llamada["name"], llamada["args"]
            if nombre == "consultar_catalogo":
                datos = _json_o_none(observacion)
                prendas = datos.get("prendas", []) if isinstance(datos, dict) else []
                cat = args.get("categoria") or "todas"
                nombres = ", ".join(str(p.get("nombre", "?")) for p in prendas[:3])
                detalle = f"categoria = {cat} → {len(prendas)} prenda(s)" + (f": {nombres}" if nombres else "")
            elif nombre == "buscar_perfil_marca":
                codigos = sorted(set(_codigos_marca(observacion)))
                detalle = f"«{args.get('consulta', '')}» → {', '.join(codigos) or 'sin coincidencias'}"
            else:
                detalle = observacion[:120]
            pasos.append({"tipo": "herramienta", "nombre": nombre, "detalle": detalle})

    final = next((m for m in reversed(respuestas_ia) if not m.tool_calls), None)
    texto = _texto(final.content) if final else ""
    if not texto:
        raise ErrorContrato("backend", "El agente no logró terminar su respuesta.", 502, "el modelo no devolvió texto final", True)
    return {"respuesta": texto, "pedido": None, "pasos": pasos, "modelo": MODELO, "llamadas_modelo": len(respuestas_ia),
            "alerta": _revisar_producto_id(texto)}


def _revisar_producto_id(texto: str) -> str:
    """Verifica en código que la propuesta indique un producto_id que exista en el catálogo (pasaporte: salida)."""
    if "fuera de alcance" in texto.lower():
        return ""
    citados = set(re.findall(r"SKU-\d{3}", texto))
    inexistentes = sorted(citados - {p["id"] for p in PRODUCTOS})
    if inexistentes:
        return f"La propuesta menciona un producto_id que no existe en el catálogo: {', '.join(inexistentes)}. No la publiques."
    if not citados:
        return "La propuesta no indica el producto_id (SKU) de la prenda: verifica cuál es antes de publicar."
    return ""


def _json_o_none(texto: str) -> Any:
    try:
        return json.loads(texto)
    except ValueError:
        return None


def _codigos_marca(texto: str) -> list[str]:
    return re.findall(r"PM-\d\d", texto)


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
