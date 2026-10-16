"""Búsqueda léxica (BM25) sobre las políticas de Tienda Nimbo.

Por qué no hay embeddings aquí: en el PoC (LC-C) el índice vectorial usa un modelo de embeddings local de unos
450 MB. Una función de Vercel no está pensada para cargar ese modelo en cada arranque. Con solo seis políticas,
una búsqueda por palabras clave (BM25) es más simple, más rápida y suficientemente buena. Si tu corpus crece,
el siguiente paso es un índice persistente (pgvector, Qdrant) con embeddings por API.

El mismo algoritmo está escrito en JavaScript en el workflow de n8n, para que ambos entreguen lo mismo.
"""
from __future__ import annotations

import math
import re
import unicodedata

from datos import POLITICAS

K1, B = 1.5, 0.75
LARGO_RAIZ = 5  # raíz tosca: las primeras 5 letras (devolver, devolución, devoluciones → "devol")

PARADA = {
    "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "a", "en", "por", "para", "con", "sin",
    "que", "se", "su", "sus", "al", "del", "lo", "le", "les", "es", "son", "mi", "me", "te", "tu", "como", "mas",
    "si", "no", "ya", "hay", "ser", "este", "esta", "esto", "ese", "esa", "puedo", "puede", "pueden", "quiero",
    "cual", "cuales", "cuando", "donde", "cuanto", "cuantos", "tiene", "tienen", "haber", "hace", "hacer",
    # palabras del dominio que aparecen en casi todas las políticas y no ayudan a distinguirlas
    "pedido", "pedidos", "producto", "productos", "tienda", "nimbo", "cliente",
}

# Ampliación de consulta: palabras que el cliente usa y las políticas no dicen literalmente.
SINONIMOS = {
    "roto": ["danado"], "rota": ["danado"], "rotos": ["danado"], "rotas": ["danado"],
    "quebrado": ["danado"], "quebrada": ["danado"], "estropeado": ["danado"], "defectuoso": ["falla"],
    "tarda": ["plazo", "dias"], "demora": ["plazo", "dias"], "demoran": ["plazo", "dias"],
    "llega": ["despacho"], "llegar": ["despacho"], "envio": ["despacho"], "enviar": ["despacho"],
    "plata": ["reembolso"], "dinero": ["reembolso"], "reintegro": ["reembolso"],
    "arreglar": ["garantia"], "reparar": ["garantia"], "reparacion": ["garantia"],
    "devuelvo": ["devolver"], "devuelven": ["devolver"], "devolvieron": ["devolver"],
    "cambiar": ["cambio"], "talla": ["cambio"], "color": ["cambio"],
    "equivocado": ["incorrecto"], "equivocada": ["incorrecto"], "distinto": ["incorrecto"], "erroneo": ["incorrecto"],
    "atrasada": ["atrasado"], "atraso": ["atrasado"], "retraso": ["atrasado"], "retrasado": ["atrasado"],
}


def normalizar(texto: str) -> str:
    sin_tildes = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in sin_tildes if unicodedata.category(c) != "Mn")


def palabras(texto: str) -> list[str]:
    return [p for p in re.findall(r"[a-z0-9]+", normalizar(texto)) if p not in PARADA and len(p) > 1]


def raices(lista: list[str]) -> list[str]:
    return [p[:LARGO_RAIZ] for p in lista]


def _documentos() -> list[dict]:
    docs = []
    for p in POLITICAS:
        terminos = raices(palabras(f"{p['id']} {p['titulo']} {p['titulo']} {p['texto']}"))
        docs.append({"politica": p, "terminos": terminos})
    return docs


_DOCS = _documentos()
_LARGO_MEDIO = sum(len(d["terminos"]) for d in _DOCS) / len(_DOCS)
_FRECUENCIA_DOC: dict[str, int] = {}
for _d in _DOCS:
    for _t in set(_d["terminos"]):
        _FRECUENCIA_DOC[_t] = _FRECUENCIA_DOC.get(_t, 0) + 1


def _consulta(texto: str) -> list[str]:
    base = palabras(texto)
    ampliada = list(base)
    for p in base:
        ampliada += SINONIMOS.get(p, [])
    return raices(ampliada)


def puntaje(terminos_consulta: list[str], doc: dict) -> float:
    n = len(_DOCS)
    total = 0.0
    largo = len(doc["terminos"])
    for t in set(terminos_consulta):
        f = doc["terminos"].count(t)
        if not f:
            continue
        df = _FRECUENCIA_DOC[t]
        idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
        total += idf * f * (K1 + 1) / (f + K1 * (1 - B + B * largo / _LARGO_MEDIO))
    return round(total, 9)


def buscar(consulta: str, k: int = 3) -> list[dict]:
    """Devuelve hasta k políticas ordenadas por relevancia (solo las que comparten alguna palabra)."""
    terminos = _consulta(consulta)
    puntuadas = [(puntaje(terminos, d), d["politica"]) for d in _DOCS]
    puntuadas = [(s, p) for s, p in puntuadas if s > 0]
    puntuadas.sort(key=lambda x: (-x[0], x[1]["id"]))
    return [p for _, p in puntuadas[:k]]
