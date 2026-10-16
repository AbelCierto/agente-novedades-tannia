# Showcase · los tres montajes funcionando

Esta carpeta sirve para dos cosas: **comparar** lo que debería verse en cada alternativa mientras construyes la tuya, y
**presentarla** con un guion de diez minutos.

## `capturas/`

Cada alternativa tiene cinco capturas de la pantalla completa: los cuatro ejemplos y una falla del modelo vista en el móvil.
El nombre es `<alternativa>_<n>_<qué muestra>.png`.

| Número | Qué muestra |
|---|---|
| 1 | Ejemplo «Devolución»: una respuesta con la política citada y el pedido consultado. |
| 2 | Ejemplo «Producto dañado»: dos políticas combinadas. Con Make se agrega la clasificación del ticket (cola, motivo, urgencia y alerta de plazo), porque el workflow la calcula. |
| 3 | Ejemplo «Pedido inexistente»: el sistema no inventa un pedido y lo deriva a una persona. |
| 4 | Ejemplo «Fuera de alcance»: un sistema útil también sabe cuándo no responder. |
| 5 | Falla del modelo en el móvil: la pantalla explica qué pasó y qué hacer, en lugar de quedarse en blanco. |

**Cómo leerlas.** Se tomaron en un laboratorio, con un modelo de lenguaje **simulado**: la pantalla, el proxy y las herramientas
(las políticas y la tabla de pedidos) son los del kit, pero el texto de cada respuesta lo redactó el simulador. Con el modelo real,
la redacción y los tiempos serán distintos. No las presentes como respuestas de un modelo real.

## `GUION_10_MINUTOS.md`

El guion de la sección 7.6 de la guía, en un archivo de texto: qué hacer y qué decir en cada minuto, y cómo preparar la demostración
para que una falla ajena (la cuota del modelo gratuito, por ejemplo) no la arruine. Imprímelo o adáptalo.

## Si todavía no tienes las tres plataformas

El modo demostración de la pantalla (`?demo=1` al final de la dirección) responde a los cuatro ejemplos con respuestas guardadas y
deja alternar entre la forma de responder de un agente y la de un workflow. Si lo usas en una presentación, **avisa** que no es el
sistema real.
