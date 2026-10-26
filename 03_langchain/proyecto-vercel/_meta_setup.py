"""Ayudante local (no se despliega): a partir de un User Access Token de Meta, obtiene
META_PAGE_ID, META_PAGE_ACCESS_TOKEN y META_IG_USER_ID, e imprime el bloque para tu .env.

Uso:
    python _meta_setup.py

Pega el User Access Token del Graph API Explorer cuando lo pida (no queda en el historial).
Antes de ejecutar, define META_APP_ID y META_APP_SECRET para intercambiarlo por
un User Access Token de larga duración.

Seguridad: el token de Página es un secreto. Cópialo a tu .env; NO lo pegues en ningún chat ni lo subas a git.
"""
import getpass
import json
import os
import urllib.error
import urllib.parse
import urllib.request

GRAPH = "https://graph.facebook.com/" + (os.getenv("META_GRAPH_VERSION", "").strip() or "v26.0")


def get(ruta, params):
    url = GRAPH + ruta + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print("Error de Meta:", e.code, e.read().decode()[:300])
        raise SystemExit(1)


token = os.getenv("FB_USER_TOKEN", "").strip().strip('"').strip()
if not token:
    try:
        token = getpass.getpass("Pega tu User Access Token de Meta: ").strip().strip('"').strip()
    except Exception:
        token = ""
if not token or len(token) < 20:
    raise SystemExit(
        'Token vacío o incompleto. Pásalo por variable de entorno y vuelve a correr:\n'
        '  $env:FB_USER_TOKEN="EAAG...tu_token_largo"; python _meta_setup.py'
    )

app_id = os.getenv("META_APP_ID", "").strip()
app_secret = os.getenv("META_APP_SECRET", "").strip()
if not app_id or not app_secret:
    raise SystemExit(
        "Faltan META_APP_ID o META_APP_SECRET. Son obligatorios para no generar "
        "un Page Token basado en un User Access Token temporal."
    )

# Intercambia el token corto por uno de larga duración antes de pedir /me/accounts.
larga = get("/oauth/access_token", {
    "grant_type": "fb_exchange_token",
    "client_id": app_id,
    "client_secret": app_secret,
    "fb_exchange_token": token,
})
token_largo = larga.get("access_token") if isinstance(larga, dict) else None
if not token_largo:
    raise SystemExit("Meta no devolvió un access_token de larga duración.")
token = token_largo
expira_en = larga.get("expires_in") if isinstance(larga, dict) else None
if expira_en:
    print(f"Token de usuario extendido. Duración indicada por Meta: {expira_en} segundos.")
else:
    print("Token de usuario extendido a larga duración.")

cuentas = get("/me/accounts", {"access_token": token, "fields": "id,name,access_token,tasks"})
paginas = cuentas.get("data", [])
if not paginas:
    raise SystemExit("No se encontraron Páginas. ¿Diste el permiso pages_show_list y eres admin de alguna Página?")

print("\nPáginas encontradas:")
for i, p in enumerate(paginas):
    print(f"  [{i}] {p.get('name')} (id {p.get('id')})")
idx = 0
if len(paginas) > 1:
    idx = int(input("\n¿Qué Página usar? Escribe el número: ").strip() or "0")
pagina = paginas[idx]

page_id = pagina["id"]
page_token = pagina["access_token"]  # token de Página (de larga duración si el de usuario lo era)
tasks = pagina.get("tasks") or []
if tasks:
    print("\nTareas autorizadas para la Página:")
    print("  " + ", ".join(tasks))
    if "CREATE_CONTENT" not in tasks:
        print("ADVERTENCIA: este token no tiene CREATE_CONTENT; Meta no permitirá publicar en Facebook.")

ig = get(f"/{page_id}", {"access_token": page_token, "fields": "instagram_business_account"})
ig_id = (ig.get("instagram_business_account") or {}).get("id", "")

print("\n================ PEGA ESTO EN TU .env ================")
print(f"META_PAGE_ID={page_id}")
print(f"META_PAGE_ACCESS_TOKEN={page_token}")
print(f"META_IG_USER_ID={ig_id}" + ("" if ig_id else "   # tu Página no tiene IG Business vinculada"))
print("=====================================================")
print("\nLuego reinicia el servidor. (No pegues estos valores en ningún chat.)")
