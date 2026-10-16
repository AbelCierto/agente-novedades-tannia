# Alternativa n8n · Mesa de ayuda Nimbo (ruta C: agente)

Un agente de n8n que atiende a Tienda Nimbo, detrás de un webhook protegido, con una pantalla publicada en Vercel.
Tutorial completo: capítulo 4 de la guía. Esta página lo resume.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `N8-MVP_agente_webhook.json` | El workflow para importar en n8n. No trae credenciales: las creas en el paso 3. |
| `probar_endpoint.py` | Prueba el webhook o tu dirección pública con los cuatro mensajes de ejemplo. Solo necesita Python 3.9 o superior. |
| `proyecto-vercel/` | La carpeta que se sube a GitHub y se despliega en Vercel (pantalla + proxy). |

## Los nueve pasos

Los pasos 1 a 5 dejan n8n funcionando solo, sin Vercel. Los pasos 6 a 9 lo conectan y lo publican.

1. **Crea la clave de OpenRouter** (openrouter.ai/keys). Ponle un límite de crédito pequeño.
2. **Importa el workflow** `N8-MVP_agente_webhook.json` en n8n.
3. **Crea las dos credenciales desde sus nodos**: la de OpenRouter (nodo del modelo) y la *Header Auth* del webhook, con la cabecera
   `x-api-key` y un secreto largo que inventas tú. Anota ese secreto: lo necesitarás en el paso 8.
4. **Pruébalo desde el editor**, con la URL de prueba del nodo Webhook.
5. **Publica el workflow** y copia la **URL de producción** del nodo Webhook (termina en `/webhook/mesa-ayuda-nimbo`, no en
   `/webhook-test/...`). Pruébala con el probador.
6. **Sube el contenido de `proyecto-vercel/` a GitHub**, sin `.env`. `app.py` y `public/` deben quedar en la raíz del repositorio.
7. **Importa el repositorio en Vercel y despliega sin variables.** Debes ver «El servicio todavía no está configurado»: es la prueba
   de que Vercel, Python y tus archivos están bien.
8. **Conecta Vercel con n8n.** En *Settings › Environment Variables* agrega, como *Secret*, estas dos variables y vuelve a desplegar
   (*Redeploy*): las variables nuevas solo valen para despliegues nuevos.

   | Variable | Valor |
   |---|---|
   | `N8N_WEBHOOK_URL` | La URL de producción del paso 5, completa. |
   | `N8N_WEBHOOK_TOKEN` | El mismo secreto de la credencial *Header Auth* del paso 3. Ni una letra distinta. |

   Opcional: `ACCESS_CODE`, para que solo entre quien tenga un código (capítulo 8).
9. **Verifica de punta a punta**: abre tu dirección pública (la esquina debe decir «Conectado · n8n») y corre

   ```
   python3 probar_endpoint.py https://TU-PROYECTO.vercel.app --pausa 3
   ```

   Debes ver los cuatro casos con ✓.

## Si algo falla

La pantalla y el probador muestran un **código** (por ejemplo `backend_url`, `backend_acceso` o `cuota_ia`). Búscalo en la sección 8.7
de la guía: dice qué revisar en cada plataforma. Cada paso del capítulo 4 trae además un recuadro «Si falla».
