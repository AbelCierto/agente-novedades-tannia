# Alternativa LangChain · Mesa de ayuda Nimbo (ruta C: agente en código)

Un agente de LangChain que corre dentro de la misma función de Vercel que sirve la pantalla. No hay webhook ni plataforma que
importar: el agente es el código del proyecto. Tutorial completo: capítulo 6 de la guía. Esta página lo resume.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `probar_endpoint.py` | Prueba tu servidor (local o en Vercel) con los cuatro mensajes de ejemplo. Solo necesita Python 3.9 o superior. |
| `proyecto-vercel/` | El proyecto completo: la pantalla (`public/`), el proxy (`app.py`) y el agente (`agente.py`, `busqueda.py`, `datos.py`). |

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
6. **Agrega la clave y vuelve a desplegar.** En *Settings › Environment Variables* agrega `OPENROUTER_API_KEY` como *Secret* y usa
   *Redeploy*. Opcionales: `ACCESS_CODE`, `MODEL_ID` y `MAX_POR_MINUTO` (capítulo 8).
7. **Verifica de punta a punta**: abre tu dirección pública y corre

   ```
   python3 probar_endpoint.py https://TU-PROYECTO.vercel.app --pausa 3
   ```

   En la pantalla, abre «Qué hizo el sistema» para ver qué herramientas usó el agente y en qué orden.

## Si algo falla

La pantalla y el probador muestran un **código**. Búscalo en la sección 8.7 de la guía. Los dos que más se ven aquí son
`sin_configurar` (falta `OPENROUTER_API_KEY` o no volviste a desplegar) y `backend` con «OpenRouter rechazó la clave» (la clave está
mal pegada, sin comillas ni espacios). El capítulo 6 trae, además, una tabla de lo que ocurre cuando el agente falla.
