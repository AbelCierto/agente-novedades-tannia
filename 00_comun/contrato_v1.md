# Contrato de interfaz v1 · Mesa de ayuda Nimbo

Versión 1.0 · octubre 2026 · Kit MVP del curso AI Project (BSG Institute)

La pantalla web solo conoce este contrato. No sabe si detrás hay n8n, Make o LangChain: por eso puedes cambiar de backend sin tocar el frontend. Este documento dice qué envía la pantalla, qué recibe y qué debe devolver tu backend para que todo encaje. La versión formal, para validar con herramientas, está en `contrato.schema.json`.

## 1. Quién habla con quién

```
Navegador ──POST /api/triage──▶ Vercel (app.py) ──POST {"mensaje": ...}──▶ Backend ──▶ Modelo (OpenRouter)
          ◀───── contrato v1 ────┘   valida · limita · normaliza   ◀── JSON del backend ──┘
```

El navegador nunca habla con el backend ni con el modelo. Vercel (el *proxy*) guarda los secretos, valida lo que llega, limita las visitas y convierte lo que devuelve el backend a la forma exacta que se describe abajo. Esa conversión vive en `contrato.py`.

## 2. Petición

`POST /api/triage` con cuerpo JSON:

```json
{ "mensaje": "Hola, mi pedido 1012 llegó hace unos días. ¿Todavía lo puedo devolver?" }
```

- `mensaje`: texto de entre 3 y 1000 caracteres. Vercel quita caracteres de control y rechaza el resto con el error `validacion`.
- Encabezado opcional `x-access-code`: solo si definiste la variable `ACCESS_CODE` en Vercel.
- Vercel reenvía al backend el mismo cuerpo `{"mensaje": ...}`, sin nada más. Si el backend usa un secreto, viaja en un encabezado que tú eliges (n8n: `x-api-key`; Make: `x-make-apikey`).

## 3. Respuesta correcta (HTTP 200)

Ejemplo de una respuesta de un agente (ruta C: n8n o LangChain):

```json
{
  "ok": true,
  "estado": "respondida",
  "respuesta": "Sí, todavía puedes devolver tu pedido 1012: lo recibiste el 28 de septiembre, hace 17 días, y el plazo de devolución es de 30 días corridos desde la entrega [POL-01]. El producto debe estar sin uso y con sus etiquetas, y la devolución se solicita en la mesa de ayuda indicando el número de pedido [POL-01].",
  "citas": ["POL-01"],
  "pedido": {
    "n_pedido": 1012,
    "estado": "entregado",
    "producto": "Cafetera de émbolo 1L",
    "fecha_entrega": "2026-09-28",
    "dias_desde_entrega": 17
  },
  "solicitud": null,
  "cola": null,
  "razon": "",
  "alerta": "",
  "pasos": [
    {"tipo": "herramienta", "nombre": "consultar_pedido", "detalle": "n_pedido = 1012 → entregado hace 17 días"},
    {"tipo": "herramienta", "nombre": "buscar_politicas", "detalle": "«plazo de devolución» → POL-01"}
  ],
  "meta": {
    "version": "1.0",
    "backend": "n8n",
    "ruta": "C",
    "modelo": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "llamadas_modelo": 2,
    "latencia_ms": 6840,
    "id": "7c2e9a41"
  }
}
```

Ejemplo de una respuesta de un workflow (ruta B: Make), que además trae la clasificación del ticket:

```json
{
  "ok": true,
  "estado": "respondida",
  "respuesta": "Tu pedido 1011 (Parka de plumas) se entregó el 30 de septiembre, hace 15 días. Los productos dañados deben reportarse dentro de 48 horas desde la entrega [POL-04], por lo que ese plazo ya venció y el caso se evalúa como garantía, que cubre fallas de fabricación por 6 meses [POL-05]. Para usarla necesitamos el número de pedido y una descripción de la falla; el producto pasa por una revisión técnica de hasta 10 días hábiles [POL-05].",
  "citas": ["POL-04", "POL-05"],
  "pedido": {
    "n_pedido": 1011,
    "estado": "entregado",
    "producto": "Parka de plumas",
    "fecha_entrega": "2026-09-30",
    "dias_desde_entrega": 15
  },
  "solicitud": {
    "es_consulta_tienda": true,
    "n_pedido": 1011,
    "motivo": "producto_danado",
    "urgencia": "media",
    "resumen": "Parka del pedido 1011 con el cierre roto desde hace dos semanas; pide una solución."
  },
  "cola": "postventa",
  "razon": "Pedido válido: se deriva según el motivo",
  "alerta": "Reporte fuera del plazo de 48 horas (POL-04): se evalúa como garantía (POL-05).",
  "pasos": [
    {"tipo": "paso", "nombre": "extraer_datos", "detalle": "modelo → motivo = producto_danado · n_pedido = 1011"},
    {"tipo": "paso", "nombre": "validar_pedido", "detalle": "tabla de pedidos → entregado hace 15 días"},
    {"tipo": "paso", "nombre": "derivar_cola", "detalle": "regla → postventa · alerta de plazo (más de 48 h)"},
    {"tipo": "paso", "nombre": "redactar_respuesta", "detalle": "modelo con las políticas de la tienda como contexto"}
  ],
  "meta": {
    "version": "1.0",
    "backend": "make",
    "ruta": "B",
    "modelo": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "llamadas_modelo": 2,
    "latencia_ms": 9210,
    "id": "b04f6d12"
  }
}
```

| Campo | Qué es | Quién lo produce |
|---|---|---|
| `ok` | siempre `true` en una respuesta correcta | Vercel |
| `estado` | `respondida`, `sin_informacion`, `fuera_de_alcance` o `requiere_humano` | Vercel (lo deduce de `cola` y de las frases de abstención) |
| `respuesta` | texto plano para el cliente, de hasta 2000 caracteres; cita las políticas como `[POL-01]` | el modelo |
| `citas` | códigos de política citados (`POL-01`…`POL-06`), sin repetir | Vercel (los lee de `respuesta`) |
| `pedido` | `n_pedido`, `estado`, `producto`, `fecha_entrega`, `dias_desde_entrega`; o `null` si no se consultó ningún pedido | la herramienta o la regla de tu backend |
| `solicitud` | `es_consulta_tienda`, `n_pedido`, `motivo`, `urgencia`, `resumen`; o `null` | el modelo, al extraer datos (ruta B) |
| `cola` | `devoluciones`, `despachos`, `postventa`, `revision_humana` o `fuera_de_alcance`; o `null` | las reglas de tu flujo (ruta B) |
| `razon` | por qué se eligió esa cola | las reglas de tu flujo (ruta B) |
| `alerta` | aviso de plazo u otro; texto vacío si no hay | las reglas de tu flujo (ruta B) |
| `pasos` | lista de `{tipo, nombre, detalle}` con lo que hizo el sistema, en orden; `tipo` es `herramienta` o `paso` | tu backend |
| `meta` | `version`, `backend`, `ruta`, `modelo`, `llamadas_modelo`, `latencia_ms`, `id` | Vercel (y el backend, para `modelo` y `llamadas_modelo`) |

Los cuatro estados son la versión legible por código de lo que en el PoC eran frases: «No tengo esa información», «Fuera de alcance» y «No encontré el pedido» (o la cola `revision_humana`) se vuelven `sin_informacion`, `fuera_de_alcance` y `requiere_humano`. Todo lo demás es `respondida`.

## 4. Respuesta de error

Cuando algo falla, la pantalla recibe siempre esta forma (con el código HTTP que corresponda):

```json
{
  "ok": false,
  "error": {
    "codigo": "backend_url",
    "mensaje": "No se encontró el backend en la URL configurada.",
    "detalle": "el webhook respondió 404; si es n8n, ¿está publicado?",
    "reintentable": false
  },
  "meta": {"version": "1.0", "backend": "n8n", "id": "e51a9c07"}
}
```

| `codigo` | HTTP | Qué pasó | Qué hacer |
|---|---|---|---|
| `validacion` | 400 | El mensaje está vacío, es muy corto o supera los 1000 caracteres | Corrige el mensaje |
| `acceso` | 401 | El despliegue pide código de acceso y falta o es incorrecto | Escribe el código en la pantalla |
| `limite` | 429 | Demasiadas consultas seguidas desde el mismo visitante | Espera un minuto |
| `sin_configurar` | 503 | Faltan variables de entorno en Vercel | Defínelas y vuelve a desplegar |
| `backend_acceso` | 502 | El backend rechazó el secreto que envía Vercel (401 o 403) | Que el secreto coincida en Vercel y en la plataforma |
| `backend_url` | 502 | La URL del webhook no existe (404) | n8n: publica el workflow y usa la URL de producción. Make: activa el escenario |
| `cuota_ia` | 502 | El modelo gratuito alcanzó su cuota | Espera o prueba mañana |
| `backend` | 502 | El backend falló por dentro | Mira Executions (n8n) o History (Make) y busca el nodo o módulo en rojo |
| `timeout` | 504 | El backend no respondió a tiempo | Reintenta; si se repite, mira la ejecución |
| `respuesta_invalida` | 502 | El backend respondió con algo que no cumple el contrato | Revisa el último nodo o módulo, el que responde al webhook |

Además, la pantalla reconoce tres errores que se producen en el navegador y no llegan a Vercel: `red` (sin conexión o sin servidor), `no_json` (el servidor respondió algo que no es JSON) y `cancelado`.

`reintentable` le dice a la pantalla si tiene sentido ofrecer «Reintentar». `detalle` es una pista corta para quien depura; nunca contiene claves, URLs ni el texto del cliente.

## 5. Qué debe devolver tu backend

Tu backend responde al webhook con un objeto JSON. Estos son los campos que importan:

- **Mínimo:** `respuesta` (texto). Con eso solo, la pantalla ya funciona.
- **Recomendado:** `pedido` (cuando consultaste uno) y `pasos` (para que se pueda auditar de dónde salió cada dato).
- **Ruta B (workflow):** además `solicitud`, `cola`, `razon` y `alerta`.
- **Informativos:** `modelo` y `llamadas_modelo`.

No hace falta que devuelvas `estado`, `citas` ni `meta`: los calcula Vercel.

Vercel es **tolerante con lo que recibe y estricto con lo que entrega**. En concreto, acepta que:

- el backend responda un objeto o una lista con un objeto;
- el texto venga en `respuesta`, `output`, `text`, `response` o `message`;
- los números y booleanos lleguen como texto (`"1012"`, `"true"`); es lo que hace Make cuando inserta valores en un JSON;
- sobren campos: los que el contrato no conoce se descartan.

Y siempre: recorta los textos a su largo máximo, quita caracteres de control y reconoce la forma `{"ok": false, "error": {...}}` en cualquier código HTTP para respetar el error que informe tu flujo.

## 6. Cómo agregar un campo

1. Haz que tu backend lo devuelva.
2. En `contrato.py`, agrega el campo en `normalizar_salida` (y valida su forma).
3. En `public/app.js`, dibújalo. Usa siempre las funciones del archivo y nunca `innerHTML`: el texto viene de un modelo y no es de confianza.
4. Súbelo a `contrato.schema.json` para que las pruebas lo conozcan.

Mientras no cambies `meta.version`, los cambios compatibles (campos nuevos opcionales) no rompen ningún despliegue existente.
