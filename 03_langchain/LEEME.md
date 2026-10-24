# Novedades Tannia · agente de contenido para redes (LangChain, ruta C)

Agente de LangChain que propone publicaciones para Instagram, Facebook y TikTok de **Novedades Tannia**, tienda de ropa para
damas y caballeros. Usa el catálogo y las reglas de marca (PM-01 a PM-06), nunca inventa precio, stock ni tallas, y nada se
publica sin aprobación humana. Tras aprobar, la publicación sale por Meta Graph API (Facebook e Instagram) y Zernio (TikTok),
con una imagen generada por OpenAI.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `probar_endpoint.py` | Prueba tu servidor (local o en Vercel) con los cuatro pedidos de ejemplo. No publica nada. Solo necesita Python 3.9 o superior. |
| `proyecto-vercel/` | El proyecto completo: la pantalla (`public/`), el proxy (`app.py`), el agente (`agente.py`, `busqueda.py`, `datos.py`) y la publicación (`publicacion.py`, `publicacion_meta.py`, `imagen.py`). |

## Los siete pasos

Los pasos 1 a 3 dejan el agente funcionando **en tu computador**, sin GitHub ni Vercel. Los pasos 4 a 7 lo publican.

1. **Crea la clave de OpenRouter** (openrouter.ai/keys). Ponle un límite de crédito pequeño. La clave se usa en dos lugares (tu
   archivo `.env` y Vercel) y no va en ningún otro.
2. **Instala el proyecto y arráncalo.** Necesitas Python 3.12 o superior. Desde `proyecto-vercel/`:

   ```
   python3 -m venv .venv
   source .venv/bin/activate          # en Windows: .venv\Scripts\activate.bat
   pip install -r requirements-local.txt
   cp .env.example .env               # abre .env y reemplaza la clave de ejemplo por la tuya
   python -m uvicorn app:app --env-file .env --port 8000
   ```

   Abre http://localhost:8000: debe verse la pantalla con «Conectado · LangChain».
3. **Prueba el agente con los cuatro casos**, desde otra terminal, en la carpeta que contiene `probar_endpoint.py`:

   ```
   python3 probar_endpoint.py http://localhost:8000 --pausa 3
   ```

4. **Sube el contenido de `proyecto-vercel/` a GitHub**, sin `.env`. `app.py` y `public/` deben quedar en la raíz del repositorio.
5. **Importa el repositorio en Vercel y despliega sin variables.** Debes ver «El servicio todavía no está configurado».
6. **Agrega las claves y vuelve a desplegar.** En *Settings › Environment Variables* agrega como *Secret* `OPENROUTER_API_KEY`,
   `ACCESS_CODE` (obligatorio si activas la publicación), `ZERNIO_API_KEY`, `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`,
   `META_IG_USER_ID` y `OPENAI_API_KEY`, y usa *Redeploy*. Guía de Meta: `proyecto-vercel/COMO_CONECTAR_META.md`.
7. **Verifica de punta a punta**: abre tu dirección pública y corre

   ```
   python3 probar_endpoint.py https://TU-PROYECTO.vercel.app --pausa 3
   ```

   En la pantalla, abre «Qué hizo el sistema» para ver qué herramientas usó el agente y en qué orden.

## Si algo falla

La pantalla y el probador muestran un **código**. Búscalo en la sección 8.7 de la guía. Los dos que más se ven aquí son
`sin_configurar` (falta `OPENROUTER_API_KEY` o no volviste a desplegar) y `backend` con «OpenRouter rechazó la clave» (la clave está
mal pegada, sin comillas ni espacios). El capítulo 6 trae, además, una tabla de lo que ocurre cuando el agente falla.
