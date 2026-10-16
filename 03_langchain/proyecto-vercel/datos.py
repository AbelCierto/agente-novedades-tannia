"""Datos del caso de referencia (Tienda Nimbo, ficticia). EDITA AQUÍ para tu caso.

Mismos datos y mismo prompt que el template LC-C del Kit PoC, para que PoC y MVP digan lo mismo.
"""

FECHA_REFERENCIA = "2026-10-15"  # «hoy» fijo, para que los días desde la entrega no cambien
MODEL_ID = "nvidia/nemotron-3-ultra-550b-a55b:free"  # modelo de OpenRouter (variable de entorno MODEL_ID para cambiarlo sin tocar el código)

# Políticas que consulta la herramienta buscar_politicas. Reemplázalas por tus documentos ya limpios.
POLITICAS = [
    {
        "id": "POL-01",
        "titulo": "Devoluciones",
        "texto": (
            "Puedes devolver un producto dentro de 30 días corridos desde la fecha de entrega, "
            "siempre que esté sin uso, con sus etiquetas y con su boleta o número de pedido. No se "
            "aceptan devoluciones de productos personalizados, ropa interior ni alimentos. La "
            "devolución se solicita en la mesa de ayuda indicando el número de pedido. El envío de "
            "vuelta es gratuito si el producto llegó con falla o equivocado; en los demás casos lo "
            "paga el cliente."
        ),
    },
    {
        "id": "POL-02",
        "titulo": "Cambios de talla o color",
        "texto": (
            "Los cambios de talla o color se aceptan dentro de 15 días corridos desde la entrega, "
            "sujetos a stock. El producto debe estar sin uso y con etiquetas. Si no hay stock del "
            "producto solicitado, se ofrece una devolución según la política de devoluciones. Cada "
            "pedido admite un solo cambio."
        ),
    },
    {
        "id": "POL-03",
        "titulo": "Despachos",
        "texto": (
            "Tienda Nimbo despacha solo dentro de Chile. Plazos de entrega: Región Metropolitana, 2 a"
            " 4 días hábiles; otras regiones, 4 a 8 días hábiles; zonas extremas (Arica y Parinacota,"
            " Aysén y Magallanes), hasta 12 días hábiles. El despacho es gratuito en compras sobre "
            "$40.000; bajo ese monto cuesta $3.990. Un pedido se considera atrasado si supera el "
            "plazo máximo de su zona."
        ),
    },
    {
        "id": "POL-04",
        "titulo": "Productos dañados o incorrectos",
        "texto": (
            "Si un producto llega dañado o no corresponde a lo comprado, debes reportarlo dentro de "
            "48 horas desde la entrega, adjuntando fotos del producto y del embalaje. Si el reporte "
            "llega a tiempo, Tienda Nimbo repone el producto sin costo o reembolsa el total, a "
            "elección del cliente. Los reportes fuera de plazo se evalúan como garantía."
        ),
    },
    {
        "id": "POL-05",
        "titulo": "Garantía",
        "texto": (
            "Todos los productos tienen 6 meses de garantía por fallas de fabricación, contados desde"
            " la entrega. La garantía no cubre daños por mal uso, golpes ni desgaste normal. Para "
            "usarla se requiere el número de pedido y una descripción de la falla; el producto pasa "
            "por una revisión técnica de hasta 10 días hábiles."
        ),
    },
    {
        "id": "POL-06",
        "titulo": "Reembolsos",
        "texto": (
            "Los reembolsos se hacen al mismo medio de pago de la compra, entre 5 y 10 días hábiles "
            "después de que el producto devuelto llega a bodega y es aprobado. Tienda Nimbo no hace "
            "reembolsos en efectivo ni a cuentas de terceros. El cliente recibe un correo cuando el "
            "reembolso es emitido."
        ),
    },
]

# Tabla que consulta la herramienta consultar_pedido. En un caso real sería tu base de datos o la API de tu tienda.
PEDIDOS = [
    {"n_pedido": 1001, "fecha_compra": "2026-09-01", "fecha_entrega": "2026-09-04", "estado": "entregado", "producto": "Polerón algodón orgánico", "categoria": "vestuario", "region": "Metropolitana", "monto_clp": 24990},
    {"n_pedido": 1002, "fecha_compra": "2026-09-03", "fecha_entrega": "2026-09-10", "estado": "entregado", "producto": "Mochila urbana 25L", "categoria": "accesorios", "region": "Valparaíso", "monto_clp": 39990},
    {"n_pedido": 1003, "fecha_compra": "2026-10-08", "fecha_entrega": None, "estado": "en_transito", "producto": "Chaqueta impermeable", "categoria": "vestuario", "region": "Los Lagos", "monto_clp": 69990},
    {"n_pedido": 1004, "fecha_compra": "2026-09-10", "fecha_entrega": "2026-09-13", "estado": "entregado", "producto": "Botella térmica 1L", "categoria": "hogar", "region": "Metropolitana", "monto_clp": 14990},
    {"n_pedido": 1005, "fecha_compra": "2026-09-12", "fecha_entrega": None, "estado": "cancelado", "producto": "Lámpara de escritorio LED", "categoria": "hogar", "region": "Biobío", "monto_clp": 29990},
    {"n_pedido": 1006, "fecha_compra": "2026-09-15", "fecha_entrega": "2026-09-22", "estado": "entregado", "producto": "Set de sartenes antiadherentes", "categoria": "hogar", "region": "Araucanía", "monto_clp": 59990},
    {"n_pedido": 1007, "fecha_compra": "2026-10-01", "fecha_entrega": "2026-10-05", "estado": "entregado", "producto": "Zapatillas trail Nimbo Pro", "categoria": "calzado", "region": "Metropolitana", "monto_clp": 54990},
    {"n_pedido": 1008, "fecha_compra": "2026-09-18", "fecha_entrega": "2026-09-24", "estado": "entregado", "producto": "Polera personalizada con nombre", "categoria": "vestuario", "region": "Maule", "monto_clp": 19990},
    {"n_pedido": 1009, "fecha_compra": "2026-10-10", "fecha_entrega": None, "estado": "en_preparacion", "producto": "Audífonos inalámbricos", "categoria": "tecnologia", "region": "Metropolitana", "monto_clp": 44990},
    {"n_pedido": 1010, "fecha_compra": "2026-09-20", "fecha_entrega": None, "estado": "cancelado", "producto": "Silla ergonómica", "categoria": "hogar", "region": "Coquimbo", "monto_clp": 149990},
    {"n_pedido": 1011, "fecha_compra": "2026-09-22", "fecha_entrega": "2026-09-30", "estado": "entregado", "producto": "Parka de plumas", "categoria": "vestuario", "region": "Magallanes", "monto_clp": 89990},
    {"n_pedido": 1012, "fecha_compra": "2026-09-24", "fecha_entrega": "2026-09-28", "estado": "entregado", "producto": "Cafetera de émbolo 1L", "categoria": "hogar", "region": "Metropolitana", "monto_clp": 22990},
    {"n_pedido": 1013, "fecha_compra": "2026-10-02", "fecha_entrega": "2026-10-09", "estado": "entregado", "producto": "Jeans corte recto", "categoria": "vestuario", "region": "Antofagasta", "monto_clp": 34990},
    {"n_pedido": 1014, "fecha_compra": "2026-10-05", "fecha_entrega": None, "estado": "en_transito", "producto": "Teclado mecánico", "categoria": "tecnologia", "region": "Aysén", "monto_clp": 64990},
    {"n_pedido": 1015, "fecha_compra": "2026-08-15", "fecha_entrega": "2026-08-20", "estado": "entregado", "producto": "Hervidor eléctrico", "categoria": "hogar", "region": "Metropolitana", "monto_clp": 27990},
    {"n_pedido": 1016, "fecha_compra": "2026-10-06", "fecha_entrega": "2026-10-09", "estado": "entregado", "producto": "Calcetines de lana pack 3", "categoria": "vestuario", "region": "Metropolitana", "monto_clp": 12990},
    {"n_pedido": 1017, "fecha_compra": "2026-09-28", "fecha_entrega": "2026-10-07", "estado": "entregado", "producto": "Carpa 2 personas", "categoria": "deportes", "region": "Ñuble", "monto_clp": 99990},
    {"n_pedido": 1018, "fecha_compra": "2026-10-12", "fecha_entrega": None, "estado": "en_preparacion", "producto": "Smartwatch deportivo", "categoria": "tecnologia", "region": "Valparaíso", "monto_clp": 119990},
    {"n_pedido": 1019, "fecha_compra": "2026-07-30", "fecha_entrega": "2026-08-05", "estado": "entregado", "producto": "Bicicleta urbana aro 28", "categoria": "deportes", "region": "Metropolitana", "monto_clp": 329990},
    {"n_pedido": 1020, "fecha_compra": "2026-10-09", "fecha_entrega": None, "estado": "en_transito", "producto": "Termo para mate", "categoria": "hogar", "region": "Araucanía", "monto_clp": 17990},
]

# La descripción de cada herramienta es su interfaz: el modelo decide cuándo usarla leyendo este texto.
DESC_BUSCAR_POLITICAS = (
    "Busca en las políticas oficiales de Tienda Nimbo (devoluciones, cambios, despachos, productos "
    "dañados, garantía y reembolsos). Úsala cuando la respuesta dependa de una regla o plazo de la "
    "tienda. Recibe una consulta en texto y devuelve los fragmentos más relevantes con su código."
)

DESC_CONSULTAR_PEDIDO = (
    "Consulta un pedido de Tienda Nimbo por su número (entero de 4 dígitos, por ejemplo 1007). "
    "Devuelve estado, producto, fechas de compra y entrega y días transcurridos desde la entrega. "
    "Úsala cuando la pregunta mencione un número de pedido."
)

# Instrucciones del agente (prompt del sistema).
PROMPT_AGENTE = """\
Eres el asistente de la mesa de ayuda de Tienda Nimbo (tienda online chilena, ficticia). Hoy es 2026-10-15.

Herramientas:
- buscar_politicas: busca en las políticas oficiales (devoluciones, cambios, despachos, productos dañados, garantía, reembolsos).
- consultar_pedido: entrega estado y fechas de un pedido a partir de su número.

Reglas:
- Si la pregunta menciona un número de pedido, usa consultar_pedido. Si la respuesta depende de una regla de la tienda, usa buscar_politicas. Si necesitas ambas cosas, usa ambas.
- Nunca inventes datos de pedidos ni plazos: usa solo lo que entreguen las herramientas.
- Si consultar_pedido no encuentra el pedido, dilo con la frase "No encontré el pedido" y pide verificar el número.
- Si la pregunta no tiene relación con Tienda Nimbo, no uses herramientas y responde exactamente: "Fuera de alcance: solo respondo consultas sobre Tienda Nimbo."
- Responde en máximo 4 frases y cita entre corchetes la política usada, por ejemplo [POL-01].
- Escribe en texto plano, sin Markdown ni listas, y dirígete al cliente de tú.
"""
