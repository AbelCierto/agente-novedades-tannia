#!/usr/bin/env python3
"""Prueba un endpoint del MVP «Mesa de ayuda Nimbo» sin abrir el navegador.

Sirve para dos cosas, y conviene hacerlas en este orden:

  1. Probar tu BACKEND solo (el webhook de n8n o de Make), antes de conectarlo a Vercel:
       python3 probar_endpoint.py https://TU-INSTANCIA.app.n8n.cloud/webhook/mesa-ayuda-nimbo --token TU_SECRETO
       python3 probar_endpoint.py https://hook.us2.make.com/TU_CODIGO --cabecera x-make-apikey --token TU_CLAVE

  2. Probar tu DESPLIEGUE en Vercel (la dirección pública de tu proyecto):
       python3 probar_endpoint.py https://tu-proyecto.vercel.app
       python3 probar_endpoint.py https://tu-proyecto.vercel.app --codigo-acceso EL_CODIGO     # si definiste ACCESS_CODE

Envía los cuatro mensajes de ejemplo (o el tuyo con --mensaje) e informa, para cada uno, qué respondió el sistema y si
cumple el contrato. Solo usa la biblioteca estándar de Python 3.9 o superior: no hay que instalar nada.

Cuidado con las claves: escríbelas en tu terminal, no en archivos que compartas. Si prefieres que no queden en el
historial del terminal, usa la variable de entorno TOKEN_BACKEND en vez de --token.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

EJEMPLOS = [{'id': 'devolucion',
  'etiqueta': 'Devolución',
  'mensaje': 'Hola, mi pedido 1012 llegó hace unos días. ¿Todavía lo puedo devolver?',
  'esperado': {'estado': 'respondida', 'citas': ['POL-01'], 'n_pedido': 1012, 'frase': ''}},
 {'id': 'danado',
  'etiqueta': 'Producto dañado',
  'mensaje': 'Compré una parka (pedido 1011) y llegó con el cierre roto hace dos semanas. ¿Qué puedo hacer?',
  'esperado': {'estado': 'respondida', 'citas': ['POL-04', 'POL-05'], 'n_pedido': 1011, 'frase': ''}},
 {'id': 'inexistente',
  'etiqueta': 'Pedido inexistente',
  'mensaje': '¿En qué estado está mi pedido 1099?',
  'esperado': {'estado': 'requiere_humano',
               'citas': [],
               'n_pedido': None,
               'frase': 'No encontré el pedido 1099'}},
 {'id': 'fuera',
  'etiqueta': 'Fuera de alcance',
  'mensaje': 'Escríbeme un poema sobre el mar.',
  'esperado': {'estado': 'fuera_de_alcance', 'citas': [], 'n_pedido': None, 'frase': 'Fuera de alcance'}}]

# Qué hacer según el código de error (la guía los explica en la sección 8.7)
PISTAS = {
    "validacion": "El mensaje debe tener entre 3 y 1000 caracteres.",
    "acceso": "El despliegue pide código de acceso: usa --codigo-acceso.",
    "limite": "Demasiadas consultas seguidas: espera un minuto.",
    "sin_configurar": "Faltan variables de entorno en Vercel. Defínelas y vuelve a desplegar (Redeploy).",
    "backend_acceso": "El token de Vercel no coincide con el del webhook. Revisa ambos lados y vuelve a desplegar.",
    "backend_url": "La URL del webhook no existe o no está activa. n8n: publica el workflow y usa la URL de producción. Make: activa el escenario.",
    "cuota_ia": "Se agotó la cuota del modelo gratuito. Espera o prueba mañana.",
    "backend": "El backend falló por dentro. n8n: mira Executions y busca el nodo en rojo. Make: mira History y el módulo que falló. LangChain: busca el id de la solicitud en los Logs de Vercel.",
    "timeout": "El backend no respondió a tiempo. Reintenta; si se repite, mira la ejecución (n8n: Executions · Make: History · LangChain: Logs de Vercel).",
    "respuesta_invalida": "El backend respondió con algo que no es el contrato. Revisa el último nodo o módulo, el que responde al webhook.",
}
ESTADOS = ("respondida", "sin_informacion", "fuera_de_alcance", "requiere_humano")
COLAS = ("devoluciones", "despachos", "postventa", "revision_humana", "fuera_de_alcance")


def llamar(url, mensaje, cabeceras, espera):
    cuerpo = json.dumps({"mensaje": mensaje}).encode("utf-8")
    req = urllib.request.Request(url, data=cuerpo, method="POST",
                                 headers={"Content-Type": "application/json", "Accept": "application/json", **cabeceras})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=espera) as r:
            status, texto = r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        status, texto = e.code, e.read().decode("utf-8", "replace")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return None, None, time.time() - t0, f"no se pudo conectar: {getattr(e, 'reason', e)}"
    try:
        datos = json.loads(texto)
    except ValueError:
        datos = None
    return status, datos, time.time() - t0, texto


def revisar_contrato(d):
    """Problemas de forma de una respuesta v1 (la que entrega el proxy de Vercel)."""
    p = []
    if not isinstance(d, dict) or d.get("ok") is not True:
        return ["la respuesta no tiene ok = true"]
    if d.get("estado") not in ESTADOS:
        p.append(f"estado inválido: {d.get('estado')!r}")
    if not isinstance(d.get("respuesta"), str) or not d["respuesta"].strip():
        p.append("falta el texto de la respuesta")
    for campo, tipo in (("citas", list), ("pasos", list), ("meta", dict)):
        if not isinstance(d.get(campo), tipo):
            p.append(f"falta «{campo}»")
    if d.get("cola") is not None and d["cola"] not in COLAS:
        p.append(f"cola inválida: {d['cola']!r}")
    if isinstance(d.get("meta"), dict) and d["meta"].get("version") != "1.0":
        p.append("meta.version debería ser «1.0»")
    return p


def revisar_contenido(ej, d, modo):
    """Comparaciones suaves con lo esperado para el ejemplo. Un modelo puede variar su redacción: son avisos, no fallos."""
    av, texto = [], (d.get("respuesta") or "") if isinstance(d, dict) else ""
    esp = ej["esperado"]
    if modo == "proxy" and d.get("estado") != esp["estado"]:
        av.append(f"estado {d.get('estado')!r}, se esperaba {esp['estado']!r}")
    for c in esp["citas"]:
        if c not in texto:
            av.append(f"la respuesta no cita {c}")
    pedido = d.get("pedido") if isinstance(d, dict) else None
    n = (pedido or {}).get("n_pedido") if isinstance(pedido, dict) else None
    if esp["n_pedido"] is not None and str(n) != str(esp["n_pedido"]):
        av.append(f"el pedido consultado fue {n!r}, se esperaba {esp['n_pedido']}")
    if esp["n_pedido"] is None and pedido:
        av.append("no debería traer un pedido")
    if esp["frase"] and esp["frase"].lower() not in texto.lower():
        av.append(f"se esperaba la frase «{esp['frase']}»")
    return av


def main():
    ap = argparse.ArgumentParser(description="Prueba un endpoint del MVP Mesa de ayuda Nimbo.")
    ap.add_argument("url", help="URL del webhook (n8n, Make) o dirección de tu proyecto en Vercel")
    ap.add_argument("--modo", choices=("auto", "webhook", "proxy"), default="auto",
                    help="webhook = backend directo; proxy = despliegue de Vercel (por defecto se deduce de la URL)")
    ap.add_argument("--token", default=os.environ.get("TOKEN_BACKEND", ""), help="secreto del webhook (o variable TOKEN_BACKEND)")
    ap.add_argument("--cabecera", default="x-api-key", help="encabezado del secreto: x-api-key (n8n) o x-make-apikey (Make)")
    ap.add_argument("--codigo-acceso", default=os.environ.get("CODIGO_ACCESO", ""), help="código de acceso del despliegue (ACCESS_CODE)")
    ap.add_argument("--mensaje", help="envía este mensaje en vez de los cuatro ejemplos")
    ap.add_argument("--espera", type=float, default=130, help="segundos de espera por respuesta (por defecto 130)")
    ap.add_argument("--pausa", type=float, default=0, help="segundos de pausa entre mensajes (útil con modelos gratuitos)")
    ap.add_argument("--json", action="store_true", help="muestra también el JSON completo de cada respuesta")
    a = ap.parse_args()

    url = a.url.strip()
    if not url.startswith(("http://", "https://")):
        sys.exit("La URL debe empezar con https://")
    ruta = urlparse(url).path.strip("/")
    modo = a.modo
    if modo == "auto":
        modo = "webhook" if re.search(r"webhook|hook\.|/hook", url, re.I) else "proxy"
    if modo == "proxy" and not ruta:
        url = url.rstrip("/") + "/api/triage"
    cabeceras = {}
    if modo == "webhook" and a.token:
        cabeceras[a.cabecera] = a.token
    if modo == "proxy" and a.codigo_acceso:
        cabeceras["x-access-code"] = a.codigo_acceso
    if modo == "webhook" and "webhook-test" in url:
        print("Aviso: esta es la URL de PRUEBA de n8n; solo responde mientras el editor escucha. Usa la de producción.\n")

    casos = ([{"id": "mensaje", "etiqueta": "Tu mensaje", "mensaje": a.mensaje, "esperado": None}] if a.mensaje else EJEMPLOS)
    print(f"Modo {modo} → {urlparse(url).netloc}/{urlparse(url).path.strip('/')[:40]}{'…' if len(urlparse(url).path) > 41 else ''}\n")
    duros, avisos = 0, 0
    for i, ej in enumerate(casos):
        if i and a.pausa:
            time.sleep(a.pausa)
        status, datos, seg, crudo = llamar(url, ej["mensaje"], cabeceras, a.espera)
        etiqueta = f"{ej['etiqueta']:<18}"
        if status is None:
            duros += 1
            print(f"✗ {etiqueta} {crudo}")
            continue
        if isinstance(datos, dict) and datos.get("ok") is False:
            duros += 1
            e = datos.get("error", {})
            print(f"✗ {etiqueta} HTTP {status} · error «{e.get('codigo')}»: {e.get('mensaje')} ({e.get('detalle')})")
            print(f"    qué hacer: {PISTAS.get(e.get('codigo'), 'mira el detalle del error')}")
            continue
        if status != 200 or not isinstance(datos, dict):
            duros += 1
            resumen = re.sub(r"\s+", " ", crudo or "")[:90]
            print(f"✗ {etiqueta} HTTP {status} · respuesta que no es JSON del contrato: {resumen!r}")
            if status in (401, 403):
                print("    qué hacer: revisa el secreto (--token) y el nombre del encabezado (--cabecera).")
            elif status == 404:
                print("    qué hacer: la URL no existe o el flujo no está publicado/activo.")
            elif resumen.startswith("Accepted"):
                print("    qué hacer: Make recibió el mensaje, pero el escenario está apagado (OFF) o no llegó a «Webhook response»; mira History.")
            continue
        problemas = revisar_contrato(datos) if modo == "proxy" else (
            [] if isinstance(datos.get("respuesta"), str) and datos["respuesta"].strip() or isinstance(datos.get("solicitud"), dict)
            else ["el webhook no devolvió «respuesta» ni «solicitud»"])
        avisos_ej = [] if problemas or not ej.get("esperado") else revisar_contenido(ej, datos, modo)
        marca = "✗" if problemas else ("!" if avisos_ej else "✓")
        duros += bool(problemas)
        avisos += bool(avisos_ej)
        texto = re.sub(r"\s+", " ", datos.get("respuesta") or "")
        print(f"{marca} {etiqueta} {seg:5.1f} s · {datos.get('estado') or 'estado: lo agrega Vercel'}" + (f" · cola {datos['cola']}" if datos.get("cola") else ""))
        print(f"    {texto[:84]}{'…' if len(texto) > 84 else ''}")   # una línea de terminal; el texto completo sale con --json
        for t in problemas + avisos_ej:
            print(f"    · {t}")
        if a.json:
            print("    " + json.dumps(datos, ensure_ascii=False, indent=2).replace("\n", "\n    "))
    print()
    if duros:
        print(f"{duros} de {len(casos)} con problemas. Corrige lo marcado con ✗ antes de seguir.")
    elif avisos:
        print(f"Todo respondió y cumple el contrato; {avisos} con diferencias menores de contenido (!). Un modelo puede variar su redacción: léelas y decide.")
    else:
        print(f"Los {len(casos)} casos respondieron y cumplen lo esperado ✓" if len(casos) > 1 else "El mensaje respondió y cumple lo esperado ✓")
    sys.exit(1 if duros else 0)


if __name__ == "__main__":
    main()
