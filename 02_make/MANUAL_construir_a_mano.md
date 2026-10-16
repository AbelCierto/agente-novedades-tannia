# Construir el escenario de Make a mano

Este manual es el **plan B** de la importación del blueprint (`MK-MVP_escenario_webhook.blueprint.json`). Úsalo si Make rechaza el archivo, si la importación termina con módulos faltantes o marcados como inválidos, o si quieres entender el escenario pieza por pieza. Reproduce, módulo por módulo, lo mismo que trae el blueprint, con los textos para copiar y pegar.

> **Sobre lo que se probó.** El blueprint se probó con un intérprete propio, no en una cuenta real de Make, y este manual describe la interfaz según la documentación oficial de octubre de 2026. Si un nombre de botón o de campo es distinto en tu cuenta, manda lo que veas en pantalla. Anota la diferencia: es lo que hace falta para corregir esta guía.

## Antes de empezar

Necesitas una cuenta de Make y tu clave de OpenRouter (capítulo 5, paso 1). **Nunca pegues la clave en un archivo que vayas a compartir**: en este montaje vive escrita dentro de los módulos 3 y 14 del escenario.

Tres reglas evitan casi todos los problemas:

1. **El orden de creación fija los números.** Make numera los módulos en el orden en que los agregas, y las fórmulas de abajo (`{{3.data…}}`, `{{7.cola}}`) usan esos números. Agrégalos en el orden de este manual: 1 al 9 en la línea principal; luego 10, 11 y 12 (una por cada una de las tres primeras ramas del router); luego 13, 14, 15 y 16 (la cuarta rama); y al final los manejadores de errores (17 y 18, 19 y 20, 21 y 22). Si un número no coincide porque borraste y volviste a crear un módulo, Make no corrige las fórmulas solo: abre cada campo que lo mencione y vuelve a elegir el dato en el panel de mapeo.
2. **Las fórmulas se pegan tal cual.** Un texto como `{{4.n_pedido}}` es una referencia al dato `n_pedido` del módulo 4. Si al pegarlo Make lo deja como texto plano en vez de convertirlo en una pieza del mapeo, bórralo y elige el dato con el panel que aparece al hacer clic en el campo. En los módulos de tipo *Parse JSON*, el panel solo ofrece los campos después de una primera ejecución (*Run once*); mientras tanto, escribe la fórmula a mano: Make la acepta igual.
3. **Todo texto de una persona pasa por «Transform to JSON»** (módulos 2, 8, 13 y 15) antes de entrar en un JSON, porque puede traer comillas o saltos de línea. Lo que sale de tus propias tablas y reglas ya es seguro.

## Mapa del escenario

```
1 Webhook → 2 Escapar mensaje → 3 OpenRouter (extraer) → 4 Contrato de extracción → 5 Tabla de pedidos
  → 6 Validar pedido → 7 Derivar ticket → 8 Escapar resumen → 9 Router
                                                                 ├─ 10 Responder · Fuera de alcance
                                                                 ├─ 11 Responder · Pedido no encontrado
                                                                 ├─ 12 Responder · Revisión humana
                                                                 └─ 13 Preparar instrucciones → 14 OpenRouter (redactar)
                                                                      → 15 Escapar respuesta → 16 Responder · Con respuesta
Manejadores de errores:  3 → 17 Responder + 18 Ignore  ·  4 → 19 + 20  ·  14 → 21 + 22
```

Para renombrar un módulo: clic derecho › *Rename*. Los nombres no afectan el funcionamiento, pero ayudan a leer *History*. Los que siguen son los del blueprint.

## Parte 1 · La línea principal (módulos 1 a 9)

### Módulo 1 · Webhook · Mesa de ayuda

**Agrégalo con:** *Webhooks › Custom webhook*. Es el disparador: el escenario empieza cuando llega un mensaje.

- **Webhook:** pulsa *Add*. *Webhook name*: `mesa-ayuda-nimbo`.
- **API key authentication:** *+ Add API key* › *Create a keychain*. *Name*: `clave-webhook-nimbo`. *API key value*: un secreto largo que inventes ahora (solo ASCII, sin tildes ni ñ, menos de 512 caracteres). Make no te lo muestra de nuevo: anótalo en un lugar privado, porque es el valor de `MAKE_API_KEY` en Vercel. Una forma de generarlo: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`.
- Pulsa *Create* y *Save*. Copia la **dirección del webhook** (`https://hook.…`): es el valor de `MAKE_WEBHOOK_URL`.
- **Maximum number of results:** `1`. Deja vacíos *IP restrictions*, *Data structure*, *Get request headers* y *JSON pass-through*.

### Módulo 2 · Escapar mensaje

**Agrégalo con:** *JSON › Transform to JSON*. Convierte el mensaje del cliente en un texto JSON válido (con sus comillas).

- **Object:**

```
{{1.mensaje}}
```

### Módulo 3 · OpenRouter · Extraer datos

**Agrégalo con:** *HTTP › Make a request*. Primera llamada al modelo: le pide que registre los datos del mensaje (motivo, número de pedido, urgencia y resumen) llamando a la herramienta `registrar_solicitud`.

En *Show advanced settings*, activa **Evaluate all states as errors (except for 2xx and 3xx)**: sin eso, un 429 o un 401 de OpenRouter no se vería como error y el manejador de errores no se activaría.

- **URL:** `https://openrouter.ai/api/v1/chat/completions`
- **Method:** `POST`
- **Headers:** dos ítems. `Authorization` = `Bearer PEGA_AQUI_TU_CLAVE_DE_OPENROUTER` (reemplaza solo el texto en mayúsculas por tu clave, de modo que quede la palabra `Bearer`, un espacio y la clave), y `Content-Type` = `application/json`.
- **Body type:** Raw · **Content type:** JSON (application/json)
- **Parse response:** Yes · **Timeout:** `60`
- **Request content:**

```
{
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "temperature": 0,
  "messages": [
    {"role": "system", "content": "Eres el asistente de clasificación de la mesa de ayuda de Tienda Nimbo, una tienda online chilena (ficticia).\nTu tarea: leer el mensaje de un cliente y devolver los campos del contrato de salida.\n\nReglas:\n- Usa solo lo que dice el mensaje. Nunca inventes datos.\n- es_consulta_tienda: false si el mensaje no tiene relación con compras, pedidos o productos de la tienda.\n- n_pedido: el número de pedido solo si aparece escrito en el mensaje; si no aparece, null.\n- motivo: uno de devolucion, cambio, despacho, producto_danado, garantia, reembolso, otro. Si el mensaje no es una consulta a la tienda, null.\n- urgencia: alta si el cliente expresa apuro o un plazo cercano; baja si solo pide información; media en otro caso.\n- resumen: una frase de máximo 20 palabras."},
    {"role": "user", "content": {{2.json}} }
  ],
  "tools": [
  {
    "type": "function",
    "function": {
      "name": "registrar_solicitud",
      "description": "Registra los datos extraídos del mensaje del cliente",
      "parameters": {
        "type": "object",
        "properties": {
          "es_consulta_tienda": {
            "type": "boolean",
            "description": "false si el mensaje no tiene relación con compras, pedidos o productos de la tienda"
          },
          "n_pedido": {
            "type": [
              "integer",
              "null"
            ],
            "description": "Número de pedido solo si aparece escrito en el mensaje; si no aparece, null"
          },
          "motivo": {
            "type": [
              "string",
              "null"
            ],
            "enum": [
              "devolucion",
              "cambio",
              "despacho",
              "producto_danado",
              "garantia",
              "reembolso",
              "otro",
              null
            ],
            "description": "Motivo principal de la consulta; null si no es una consulta a la tienda"
          },
          "urgencia": {
            "type": "string",
            "enum": [
              "baja",
              "media",
              "alta"
            ],
            "description": "alta si el cliente expresa apuro o un plazo cercano; baja si solo pide información; media en otro caso"
          },
          "resumen": {
            "type": "string",
            "description": "Una frase de máximo 20 palabras"
          }
        },
        "required": [
          "es_consulta_tienda",
          "n_pedido",
          "motivo",
          "urgencia",
          "resumen"
        ]
      }
    }
  }
],
  "tool_choice": {"type": "function", "function": {"name": "registrar_solicitud"} }
}
```


### Módulo 4 · Contrato de extracción

**Agrégalo con:** *JSON › Parse JSON*. Lee los argumentos que el modelo entregó al llamar a la herramienta.

- **JSON string:** `{{3.data.choices[1].message.tool_calls[1].function.arguments}}`
- **Data structure:** vacío.
- Al terminar tendrás disponibles `4.es_consulta_tienda`, `4.n_pedido`, `4.motivo`, `4.urgencia` y `4.resumen`.

### Módulo 5 · Tabla de pedidos

**Agrégalo con:** *JSON › Parse JSON*. Es tu «base de datos»: una tabla de pedidos escrita a mano (datos ficticios). Para usar la tuya, cambia este texto; el resto del escenario no se entera.

- **JSON string:**

```
{
 "fecha_referencia": "2026-10-15",
 "pedidos": [
  {
   "n_pedido": 1001,
   "estado": "entregado",
   "producto": "Polerón algodón orgánico",
   "fecha_entrega": "2026-09-04",
   "dias_desde_entrega": 41
  },
  {
   "n_pedido": 1002,
   "estado": "entregado",
   "producto": "Mochila urbana 25L",
   "fecha_entrega": "2026-09-10",
   "dias_desde_entrega": 35
  },
  {
   "n_pedido": 1003,
   "estado": "en_transito",
   "producto": "Chaqueta impermeable",
   "fecha_entrega": "",
   "dias_desde_entrega": ""
  },
  {
   "n_pedido": 1004,
   "estado": "entregado",
   "producto": "Botella térmica 1L",
   "fecha_entrega": "2026-09-13",
   "dias_desde_entrega": 32
  },
  {
   "n_pedido": 1005,
   "estado": "cancelado",
   "producto": "Lámpara de escritorio LED",
   "fecha_entrega": "",
   "dias_desde_entrega": ""
  },
  {
   "n_pedido": 1006,
   "estado": "entregado",
   "producto": "Set de sartenes antiadherentes",
   "fecha_entrega": "2026-09-22",
   "dias_desde_entrega": 23
  },
  {
   "n_pedido": 1007,
   "estado": "entregado",
   "producto": "Zapatillas trail Nimbo Pro",
   "fecha_entrega": "2026-10-05",
   "dias_desde_entrega": 10
  },
  {
   "n_pedido": 1008,
   "estado": "entregado",
   "producto": "Polera personalizada con nombre",
   "fecha_entrega": "2026-09-24",
   "dias_desde_entrega": 21
  },
  {
   "n_pedido": 1009,
   "estado": "en_preparacion",
   "producto": "Audífonos inalámbricos",
   "fecha_entrega": "",
   "dias_desde_entrega": ""
  },
  {
   "n_pedido": 1010,
   "estado": "cancelado",
   "producto": "Silla ergonómica",
   "fecha_entrega": "",
   "dias_desde_entrega": ""
  },
  {
   "n_pedido": 1011,
   "estado": "entregado",
   "producto": "Parka de plumas",
   "fecha_entrega": "2026-09-30",
   "dias_desde_entrega": 15
  },
  {
   "n_pedido": 1012,
   "estado": "entregado",
   "producto": "Cafetera de émbolo 1L",
   "fecha_entrega": "2026-09-28",
   "dias_desde_entrega": 17
  },
  {
   "n_pedido": 1013,
   "estado": "entregado",
   "producto": "Jeans corte recto",
   "fecha_entrega": "2026-10-09",
   "dias_desde_entrega": 6
  },
  {
   "n_pedido": 1014,
   "estado": "en_transito",
   "producto": "Teclado mecánico",
   "fecha_entrega": "",
   "dias_desde_entrega": ""
  },
  {
   "n_pedido": 1015,
   "estado": "entregado",
   "producto": "Hervidor eléctrico",
   "fecha_entrega": "2026-08-20",
   "dias_desde_entrega": 56
  },
  {
   "n_pedido": 1016,
   "estado": "entregado",
   "producto": "Calcetines de lana pack 3",
   "fecha_entrega": "2026-10-09",
   "dias_desde_entrega": 6
  },
  {
   "n_pedido": 1017,
   "estado": "entregado",
   "producto": "Carpa 2 personas",
   "fecha_entrega": "2026-10-07",
   "dias_desde_entrega": 8
  },
  {
   "n_pedido": 1018,
   "estado": "en_preparacion",
   "producto": "Smartwatch deportivo",
   "fecha_entrega": "",
   "dias_desde_entrega": ""
  },
  {
   "n_pedido": 1019,
   "estado": "entregado",
   "producto": "Bicicleta urbana aro 28",
   "fecha_entrega": "2026-08-05",
   "dias_desde_entrega": 71
  },
  {
   "n_pedido": 1020,
   "estado": "en_transito",
   "producto": "Termo para mate",
   "fecha_entrega": "",
   "dias_desde_entrega": ""
  }
 ]
}
```
- **Data structure:** vacío.

### Módulo 6 · Validar pedido

**Agrégalo con:** *Tools › Set multiple variables*. Busca el pedido en la tabla del módulo 5 sin usar el modelo.

- **Variable lifetime:** One cycle. Agrega una variable por cada par siguiente (*Add item*):

**`tiene_numero`**

```
{{if(ifempty(4.n_pedido; "") = ""; "false"; "true")}}
```

**`pedido_valido`**

```
{{if(ifempty(4.n_pedido; "") = ""; "false"; if(length(map(5.pedidos; "n_pedido"; "n_pedido"; 4.n_pedido)) > 0; "true"; "false"))}}
```

**`estado_pedido`**

```
{{ifempty(first(map(5.pedidos; "estado"; "n_pedido"; 4.n_pedido)); "")}}
```

**`producto`**

```
{{ifempty(first(map(5.pedidos; "producto"; "n_pedido"; 4.n_pedido)); "")}}
```

**`fecha_entrega`**

```
{{ifempty(first(map(5.pedidos; "fecha_entrega"; "n_pedido"; 4.n_pedido)); "")}}
```

**`dias_desde_entrega`**

```
{{ifempty(first(map(5.pedidos; "dias_desde_entrega"; "n_pedido"; 4.n_pedido)); "")}}
```

### Módulo 7 · Derivar ticket

**Agrégalo con:** *Tools › Set multiple variables*. Decide la cola y la razón con reglas, y calcula la alerta de plazo.

- **Variable lifetime:** One cycle. Agrega una variable por cada par siguiente (*Add item*):

**`cola`**

```
{{if(toString(4.es_consulta_tienda) = "false"; "fuera_de_alcance"; if(6.pedido_valido = "false"; "revision_humana"; switch(4.motivo; "devolucion"; "devoluciones"; "cambio"; "devoluciones"; "reembolso"; "devoluciones"; "despacho"; "despachos"; "producto_danado"; "postventa"; "garantia"; "postventa"; "revision_humana")))}}
```

**`razon`**

```
{{if(toString(4.es_consulta_tienda) = "false"; "El mensaje no es una consulta a la tienda"; if(6.tiene_numero = "false"; "Falta el número de pedido"; if(6.pedido_valido = "false"; "El pedido no existe en la tabla"; "Pedido válido: se deriva según el motivo")))}}
```

**`alerta`**

```
{{if(4.motivo = "producto_danado" and 6.pedido_valido = "true" and ifempty(6.dias_desde_entrega; 0) > 2; "Reporte fuera del plazo de 48 horas (POL-04): se evalúa como garantía (POL-05)."; "")}}
```

### Módulo 8 · Escapar resumen

**Agrégalo con:** *JSON › Transform to JSON*.

- **Object:** `{{4.resumen}}`

### Módulo 9 · Elegir camino

**Agrégalo con:** *Flow control › Router*. Después de agregarlo aparecen dos ramas; agrega dos más con *Add route* hasta tener cuatro. Cada rama lleva un filtro (se configura en las partes siguientes) y solo una se cumple en cada ejecución.

## Parte 2 · Las cuatro ramas del router (módulos 10 a 16)

Agrega **primero** el módulo de la primera rama (será el 10), luego el de la segunda (11), el de la tercera (12) y, por último, los cuatro de la cuarta (13 a 16). Tres de las cuatro ramas responden con un texto fijo, sin gastar una segunda llamada al modelo.

### Módulo 10 · Responder · Fuera de alcance

**Agrégalo con:** *Webhooks › Webhook response*, en la rama que corresponda.

**Filtro** (clic en la línea entre el router y este módulo › *Set up a filter*). Label: `Fuera de alcance`.
- Condición: `{{7.cola}}`  ·  Text operators › Equal to  ·  `fuera_de_alcance`

- **Status:** `200`
- **Custom headers:** `Content-Type: application/json` y `Cache-Control: no-store`
- **Body:**

```
{
  "respuesta": "Fuera de alcance: solo respondo consultas sobre Tienda Nimbo.",
  "pedido": null,
  "solicitud": {"es_consulta_tienda": "{{4.es_consulta_tienda}}", "n_pedido": "{{4.n_pedido}}", "motivo": "{{4.motivo}}", "urgencia": "{{4.urgencia}}", "resumen": {{8.json}} },
  "cola": "{{7.cola}}",
  "razon": "{{7.razon}}",
  "alerta": "",
  "pasos": [
    {"tipo": "paso", "nombre": "extraer_datos", "detalle": "modelo → es_consulta_tienda = false"},
    {"tipo": "paso", "nombre": "derivar_cola", "detalle": "regla → {{7.cola}}"},
    {"tipo": "paso", "nombre": "responder_con_texto_fijo", "detalle": "sin modelo: frase de fuera de alcance"}
  ],
  "modelo": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "llamadas_modelo": 1
}
```

### Módulo 11 · Responder · Pedido no encontrado

**Agrégalo con:** *Webhooks › Webhook response*, en la rama que corresponda.

**Filtro** (clic en la línea entre el router y este módulo › *Set up a filter*). Label: `Pedido no encontrado`.
- Condición: `{{7.cola}}`  ·  Text operators › Equal to  ·  `revision_humana`
- Con **Add AND rule**: `{{6.tiene_numero}}`  ·  Text operators › Equal to  ·  `true`
- Con **Add AND rule**: `{{6.pedido_valido}}`  ·  Text operators › Equal to  ·  `false`

- **Status:** `200`
- **Custom headers:** `Content-Type: application/json` y `Cache-Control: no-store`
- **Body:**

```
{
  "respuesta": "No encontré el pedido {{4.n_pedido}}. ¿Puedes verificar el número? Si está correcto, una persona del equipo revisará tu caso.",
  "pedido": null,
  "solicitud": {"es_consulta_tienda": "{{4.es_consulta_tienda}}", "n_pedido": "{{4.n_pedido}}", "motivo": "{{4.motivo}}", "urgencia": "{{4.urgencia}}", "resumen": {{8.json}} },
  "cola": "{{7.cola}}",
  "razon": "{{7.razon}}",
  "alerta": "",
  "pasos": [
    {"tipo": "paso", "nombre": "extraer_datos", "detalle": "modelo → motivo = {{ifempty(4.motivo; "sin motivo")}} · n_pedido = {{ifempty(4.n_pedido; "sin número")}}"},
    {"tipo": "paso", "nombre": "validar_pedido", "detalle": "tabla de pedidos → no existe"},
    {"tipo": "paso", "nombre": "derivar_cola", "detalle": "regla → {{7.cola}}"},
    {"tipo": "paso", "nombre": "responder_con_texto_fijo", "detalle": "sin modelo: mensaje preparado para este caso"}
  ],
  "modelo": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "llamadas_modelo": 1
}
```

### Módulo 12 · Responder · Revisión humana

**Agrégalo con:** *Webhooks › Webhook response*, en la rama que corresponda.

**Filtro** (clic en la línea entre el router y este módulo › *Set up a filter*). Label: `Revisión humana`.
- Condición: `{{7.cola}}`  ·  Text operators › Equal to  ·  `revision_humana`
- Con **Add AND rule**: `{{6.tiene_numero}}`  ·  Text operators › Equal to  ·  `false`
  y después, con **Add OR rule**, otro grupo:
- Condición: `{{7.cola}}`  ·  Text operators › Equal to  ·  `revision_humana`
- Con **Add AND rule**: `{{6.pedido_valido}}`  ·  Text operators › Equal to  ·  `true`

- **Status:** `200`
- **Custom headers:** `Content-Type: application/json` y `Cache-Control: no-store`
- **Body:**

```
{
  "respuesta": "Una persona del equipo revisará tu consulta. Para agilizarlo, incluye en tu mensaje el número de tu pedido y qué necesitas.",
  "pedido": null,
  "solicitud": {"es_consulta_tienda": "{{4.es_consulta_tienda}}", "n_pedido": "{{4.n_pedido}}", "motivo": "{{4.motivo}}", "urgencia": "{{4.urgencia}}", "resumen": {{8.json}} },
  "cola": "{{7.cola}}",
  "razon": "{{7.razon}}",
  "alerta": "",
  "pasos": [
    {"tipo": "paso", "nombre": "extraer_datos", "detalle": "modelo → motivo = {{ifempty(4.motivo; "sin motivo")}} · n_pedido = {{ifempty(4.n_pedido; "sin número")}}"},
    {"tipo": "paso", "nombre": "validar_pedido", "detalle": "tabla de pedidos → {{ifempty(6.estado_pedido; "sin número de pedido")}}"},
    {"tipo": "paso", "nombre": "derivar_cola", "detalle": "regla → {{7.cola}}"},
    {"tipo": "paso", "nombre": "responder_con_texto_fijo", "detalle": "sin modelo: mensaje preparado para este caso"}
  ],
  "modelo": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "llamadas_modelo": 1
}
```

### Módulo 13 · Preparar instrucciones

Cuarta rama. **Agrégalo con:** *JSON › Transform to JSON*. Arma el texto de instrucciones para el modelo, con el pedido y las políticas de la tienda como contexto.

**Filtro** (clic en la línea entre el router y este módulo › *Set up a filter*). Label: `Consulta con modelo`.
- Condición: `{{7.cola}}`  ·  Text operators › Equal to  ·  `devoluciones`
  y después, con **Add OR rule**, otro grupo:
- Condición: `{{7.cola}}`  ·  Text operators › Equal to  ·  `despachos`
  y después, con **Add OR rule**, otro grupo:
- Condición: `{{7.cola}}`  ·  Text operators › Equal to  ·  `postventa`

- **Object:**

```
Eres el asistente de la mesa de ayuda de Tienda Nimbo (tienda online chilena, ficticia). Hoy es 2026-10-15.
Redacta la respuesta al cliente usando SOLO el pedido y las políticas que aparecen más abajo.

Reglas:
- No inventes datos de pedidos ni plazos: usa solo lo que aparece más abajo.
- Si las políticas no contienen la respuesta, responde exactamente: "No tengo esa información en las políticas de Tienda Nimbo."
- Responde en máximo 4 frases, en texto plano, sin Markdown ni listas, y dirígete al cliente de tú.
- Cita entre corchetes la política usada, por ejemplo [POL-01].
- Si hay una alerta de plazo, explícasela al cliente con claridad.

PEDIDO DEL CLIENTE
Pedido {{4.n_pedido}} ({{6.producto}}): estado {{6.estado_pedido}}. Fecha de entrega: {{ifempty(6.fecha_entrega; "aún no entregado")}}. Días desde la entrega: {{ifempty(6.dias_desde_entrega; "no aplica")}}.
ALERTA DE PLAZO: {{ifempty(7.alerta; "ninguna")}}

POLÍTICAS DE TIENDA NIMBO
POL-01 · Devoluciones
Puedes devolver un producto dentro de 30 días corridos desde la fecha de entrega, siempre que esté sin uso, con sus etiquetas y con su boleta o número de pedido. No se aceptan devoluciones de productos personalizados, ropa interior ni alimentos. La devolución se solicita en la mesa de ayuda indicando el número de pedido. El envío de vuelta es gratuito si el producto llegó con falla o equivocado; en los demás casos lo paga el cliente.

POL-02 · Cambios de talla o color
Los cambios de talla o color se aceptan dentro de 15 días corridos desde la entrega, sujetos a stock. El producto debe estar sin uso y con etiquetas. Si no hay stock del producto solicitado, se ofrece una devolución según la política de devoluciones. Cada pedido admite un solo cambio.

POL-03 · Despachos
Tienda Nimbo despacha solo dentro de Chile. Plazos de entrega: Región Metropolitana, 2 a 4 días hábiles; otras regiones, 4 a 8 días hábiles; zonas extremas (Arica y Parinacota, Aysén y Magallanes), hasta 12 días hábiles. El despacho es gratuito en compras sobre $40.000; bajo ese monto cuesta $3.990. Un pedido se considera atrasado si supera el plazo máximo de su zona.

POL-04 · Productos dañados o incorrectos
Si un producto llega dañado o no corresponde a lo comprado, debes reportarlo dentro de 48 horas desde la entrega, adjuntando fotos del producto y del embalaje. Si el reporte llega a tiempo, Tienda Nimbo repone el producto sin costo o reembolsa el total, a elección del cliente. Los reportes fuera de plazo se evalúan como garantía.

POL-05 · Garantía
Todos los productos tienen 6 meses de garantía por fallas de fabricación, contados desde la entrega. La garantía no cubre daños por mal uso, golpes ni desgaste normal. Para usarla se requiere el número de pedido y una descripción de la falla; el producto pasa por una revisión técnica de hasta 10 días hábiles.

POL-06 · Reembolsos
Los reembolsos se hacen al mismo medio de pago de la compra, entre 5 y 10 días hábiles después de que el producto devuelto llega a bodega y es aprobado. Tienda Nimbo no hace reembolsos en efectivo ni a cuentas de terceros. El cliente recibe un correo cuando el reembolso es emitido.
```

### Módulo 14 · OpenRouter · Redactar respuesta

**Agrégalo con:** *HTTP › Make a request*. Segunda llamada al modelo: redacta la respuesta al cliente. Mismas opciones que el módulo 3, con otro *Request content*. Pega aquí también tu clave en el encabezado `Authorization`.

En *Show advanced settings*, activa **Evaluate all states as errors (except for 2xx and 3xx)**: sin eso, un 429 o un 401 de OpenRouter no se vería como error y el manejador de errores no se activaría.

- **URL:** `https://openrouter.ai/api/v1/chat/completions`
- **Method:** `POST`
- **Headers:** dos ítems. `Authorization` = `Bearer PEGA_AQUI_TU_CLAVE_DE_OPENROUTER` (reemplaza solo el texto en mayúsculas por tu clave, de modo que quede la palabra `Bearer`, un espacio y la clave), y `Content-Type` = `application/json`.
- **Body type:** Raw · **Content type:** JSON (application/json)
- **Parse response:** Yes · **Timeout:** `60`
- **Request content:**

```
{
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "temperature": 0,
  "messages": [
    {"role": "system", "content": {{13.json}} },
    {"role": "user", "content": {{2.json}} }
  ]
}
```


### Módulo 15 · Escapar respuesta

**Agrégalo con:** *JSON › Transform to JSON*.

- **Object:**

```
{{ifempty(14.data.choices[1].message.content; "No pude redactar la respuesta. Intenta de nuevo.")}}
```

### Módulo 16 · Responder · Con respuesta del modelo

**Agrégalo con:** *Webhooks › Webhook response*.

- **Status:** `200`
- **Custom headers:** `Content-Type: application/json` y `Cache-Control: no-store`
- **Body:**

```
{
  "respuesta": {{15.json}},
  "pedido": {"n_pedido": "{{4.n_pedido}}", "estado": "{{6.estado_pedido}}", "producto": "{{6.producto}}", "fecha_entrega": "{{6.fecha_entrega}}", "dias_desde_entrega": "{{6.dias_desde_entrega}}"},
  "solicitud": {"es_consulta_tienda": "{{4.es_consulta_tienda}}", "n_pedido": "{{4.n_pedido}}", "motivo": "{{4.motivo}}", "urgencia": "{{4.urgencia}}", "resumen": {{8.json}} },
  "cola": "{{7.cola}}",
  "razon": "{{7.razon}}",
  "alerta": "{{7.alerta}}",
  "pasos": [
    {"tipo": "paso", "nombre": "extraer_datos", "detalle": "modelo → motivo = {{ifempty(4.motivo; "sin motivo")}} · n_pedido = {{ifempty(4.n_pedido; "sin número")}}"},
    {"tipo": "paso", "nombre": "validar_pedido", "detalle": "tabla de pedidos → {{6.estado_pedido}}{{if(6.dias_desde_entrega != ""; " hace "; "")}}{{6.dias_desde_entrega}}{{if(6.dias_desde_entrega != ""; " días"; "")}}"},
    {"tipo": "paso", "nombre": "derivar_cola", "detalle": "regla → {{7.cola}}{{if(7.alerta != ""; " · alerta de plazo (más de 48 h)"; "")}}"},
    {"tipo": "paso", "nombre": "redactar_respuesta", "detalle": "modelo con las políticas de la tienda como contexto"}
  ],
  "modelo": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "llamadas_modelo": 2
}
```

## Parte 3 · Los manejadores de errores (módulos 17 a 22)

Sin ellos, Make **apaga el escenario tras el primer error**, porque empieza con un webhook; mientras esté apagado, el webhook contesta «Accepted» a todo. Cada manejador responde un error con la forma del contrato v1 y termina con la directiva *Ignore*, de modo que la ejecución queda como correcta y el escenario sigue encendido. Agrégalos al final y en este orden. Para cada uno: clic derecho sobre el módulo › *Add error handler*; elige *Webhooks › Webhook response* y, después de él, la directiva **Ignore**.

### Manejador del módulo 3: módulos 17 y 18

- Módulo 17, *Webhooks › Webhook response* · Responder · Error al extraer.

- **Status:** `502`
- **Custom headers:** `Content-Type: application/json` y `Cache-Control: no-store`
- **Body:**

```
{
  "ok": false,
  "error": {
    "codigo": "backend",
    "mensaje": "No se pudo consultar al modelo para entender el mensaje.",
    "detalle": "Falló el módulo 3 (OpenRouter). Mira History en Make: 429 = límite del modelo gratuito, 401 = clave incorrecta.",
    "reintentable": true
  }
}
```

- Módulo 18: la directiva **Ignore**, sin campos.

### Manejador del módulo 4: módulos 19 y 20

- Módulo 19, *Webhooks › Webhook response* · Responder · Error al leer la extracción.

- **Status:** `502`
- **Custom headers:** `Content-Type: application/json` y `Cache-Control: no-store`
- **Body:**

```
{
  "ok": false,
  "error": {
    "codigo": "backend",
    "mensaje": "El modelo no devolvió los datos en el formato pedido.",
    "detalle": "Falló el módulo 4 (Parse JSON): la respuesta no trae la llamada a la herramienta. Reintenta; si se repite, mira History en Make.",
    "reintentable": true
  }
}
```

- Módulo 20: la directiva **Ignore**, sin campos.

### Manejador del módulo 14: módulos 21 y 22

- Módulo 21, *Webhooks › Webhook response* · Responder · Error al redactar.

- **Status:** `502`
- **Custom headers:** `Content-Type: application/json` y `Cache-Control: no-store`
- **Body:**

```
{
  "ok": false,
  "error": {
    "codigo": "backend",
    "mensaje": "No se pudo consultar al modelo para redactar la respuesta.",
    "detalle": "Falló el módulo 14 (OpenRouter). Mira History en Make: 429 = límite del modelo gratuito, 401 = clave incorrecta.",
    "reintentable": true
  }
}
```

- Módulo 22: la directiva **Ignore**, sin campos.

## Cuando termines

1. Pulsa *Save* y activa el escenario con el interruptor (*ON*).
2. Prueba el webhook solo, antes de conectar Vercel, con el probador del kit:

```
python3 probar_endpoint.py https://hook.us2.make.com/TU-CODIGO --cabecera x-make-apikey --token TU_CLAVE_DE_API
```

3. Comprueba el manejador de errores: en el módulo 3, cambia una letra de la clave de OpenRouter y llama de nuevo. Debes ver `error «backend»` con «Falló el módulo 3 (OpenRouter)», y el interruptor debe seguir en *ON*. Devuelve la clave a su valor.
4. Sigue en el capítulo 5 de la guía, paso 8: conecta Vercel con las dos variables (`MAKE_WEBHOOK_URL` y `MAKE_API_KEY`).
