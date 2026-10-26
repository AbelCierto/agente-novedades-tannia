# Novedades Tannia en local

## Requisitos

- Python 3.12 o superior.
- Una clave `OPENROUTER_API_KEY` para probar la generación de contenido.
- Las credenciales de Meta, Zernio y OpenAI solo son necesarias para probar publicación o generación de imágenes.

## Instalación en Windows

Abre PowerShell en esta carpeta:

```powershell
cd C:\python-dev\kit_mvp_vercel_v1\03_langchain\proyecto-vercel
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-local.txt
Copy-Item .env.example .env
```

Edita `.env` y reemplaza `OPENROUTER_API_KEY` por una clave real. Para habilitar la publicación local, completa también las variables de Meta, Zernio y el código de acceso o el login de Firebase según corresponda.

## Levantar el servidor

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --env-file .env --host 127.0.0.1 --port 8000
```

Abre <http://127.0.0.1:8000>.

En otra terminal, comprueba que el servicio está vivo:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/health | Select-Object -ExpandProperty Content
```

## Probar el agente

Desde `03_langchain`:

```powershell
.\proyecto-vercel\.venv\Scripts\python.exe .\probar_endpoint.py http://127.0.0.1:8000 --pausa 3
```

Esta prueba genera propuestas, pero no publica en redes.

## Probar publicación

La publicación necesita aprobación y autenticación. Define las credenciales en `.env`, reinicia el servidor y usa la pantalla. Para publicar de inmediato:

```text
META_PUBLICAR=ahora
ZERNIO_PUBLICAR=ahora
```

Si dejas esas variables vacías, Facebook y TikTok se manejan como revisión/borrador en Zernio; Instagram siempre requiere una imagen y publicación mediante Meta.

## Diagnóstico de Instagram

Facebook se publica mediante Zernio: conecta la Página de Facebook en el perfil
de Zernio y verifica que la cuenta aparezca como `facebook`. Facebook ya no usa
`publish_actions` ni el flujo de Meta. Si usas Instagram, conserva las credenciales
de Meta (`META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` y `META_IG_USER_ID`) para ese flujo.

Para configurar Instagram mediante Meta, define antes de ejecutar el script:

```powershell
$env:META_APP_ID="ID_DE_LA_APP"
$env:META_APP_SECRET="SECRET_DE_LA_APP"
$env:FB_USER_TOKEN="USER_TOKEN_TEMPORAL"
.\.venv\Scripts\python.exe .\_meta_setup.py
```

El script intercambia el User Token temporal mediante `fb_exchange_token` y solo
después obtiene el Page Access Token. No pegues el App Secret ni ningún token en
el código, el repositorio o un chat.

Para Instagram, confirma que `META_PAGE_ID` es el ID numérico de la Página,
`META_PAGE_ACCESS_TOKEN` es el token de esa Página obtenido de `/me/accounts` y
la app seleccionada en Graph API Explorer es la misma app que genera el token.

## Detener el servidor

En la terminal donde corre Uvicorn, pulsa `Ctrl+C`.

No subas `.env` ni tokens al repositorio.
