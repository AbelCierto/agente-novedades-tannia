# Alternativa Make · Mesa de ayuda Nimbo (ruta B: workflow)

Un escenario de Make que lee, clasifica y deriva los mensajes de Tienda Nimbo, detrás de un webhook protegido con clave, con una
pantalla publicada en Vercel. Tutorial completo: capítulo 5 de la guía. Esta página lo resume.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `MK-MVP_escenario_webhook.blueprint.json` | El escenario para importar en Make. **No trae tu clave de OpenRouter** (ver más abajo). |
| `MANUAL_construir_a_mano.md` | El plan B: el mismo escenario explicado módulo por módulo, con los textos para pegar. Úsalo si Make rechaza el blueprint o la importación deja módulos faltantes. |
| `probar_endpoint.py` | Prueba el webhook o tu dirección pública con los cuatro mensajes de ejemplo. Solo necesita Python 3.9 o superior. |
| `proyecto-vercel/` | La carpeta que se sube a GitHub y se despliega en Vercel (pantalla + proxy). |

## Los nueve pasos

Los pasos 1 a 5 dejan Make funcionando solo, sin Vercel. Los pasos 6 a 9 lo conectan y lo publican.

1. **Crea la clave de OpenRouter** (openrouter.ai/keys). Ponle un límite de crédito pequeño.
2. **Importa el blueprint** (*Scenarios › Create a new scenario*, menú `⋯` del editor › *Import blueprint*).
3. **Crea el webhook y su clave de API** en el módulo 1 (*Custom webhook*, con *API key authentication*). Make exige la clave en la
   cabecera `x-make-apikey`. Guarda la clave y la dirección del webhook: Make no te deja ver la clave de nuevo.
4. **Pega tu clave de OpenRouter** en los módulos 3 y 14 (cabecera `Authorization`: la palabra `Bearer`, un espacio y la clave) y
   haz una primera prueba con *Run once*.
5. **Enciende el escenario** (programación *Immediately as data arrives*, interruptor en ON) y prueba los cuatro casos con el probador.
6. **Sube el contenido de `proyecto-vercel/` a GitHub**, sin `.env`. `app.py` y `public/` deben quedar en la raíz del repositorio.
7. **Importa el repositorio en Vercel y despliega sin variables.** Debes ver «El servicio todavía no está configurado».
8. **Conecta Vercel con Make.** En *Settings › Environment Variables* agrega, como *Secret*, estas dos variables y vuelve a desplegar
   (*Redeploy*):

   | Variable | Valor |
   |---|---|
   | `MAKE_WEBHOOK_URL` | La dirección del webhook del paso 3, completa. Cópiala del módulo 1 de Make. |
   | `MAKE_API_KEY` | La misma clave que escribiste en *API key value* en el paso 3. Ni una letra distinta. |

   Opcional: `ACCESS_CODE` (capítulo 8).
9. **Verifica de punta a punta**: abre tu dirección pública (la esquina debe decir «Conectado · Make») y corre

   ```
   python3 probar_endpoint.py https://TU-PROYECTO.vercel.app --pausa 3
   ```

## Cuidado con la clave de OpenRouter

El blueprint trae en los módulos 3 y 14 el texto `Bearer PEGA_AQUI_TU_CLAVE_DE_OPENROUTER`. Cuando lo reemplazas por tu clave, **tu
escenario pasa a contener la clave**: si lo exportas para entregarlo, vuelve a dejar ese texto en los dos módulos antes de guardar el
archivo (capítulo 9, «Que no vaya ninguna clave»).

## Lo que no se pudo probar

El blueprint se probó con un intérprete propio que ejecuta módulos, filtros y manejadores de error según la documentación de Make,
no en una cuenta real. Los nombres de menús y campos son los de la documentación de octubre de 2026: si algo es distinto en tu
cuenta, manda lo que veas y anótalo.

## Si algo falla

La pantalla y el probador muestran un **código**. Búscalo en la sección 8.7 de la guía. En Make, un `backend` con «Falló el módulo n»
se investiga en *History*: en los módulos 3 y 14, un 429 es el límite del modelo y un 401 es una clave incorrecta.
