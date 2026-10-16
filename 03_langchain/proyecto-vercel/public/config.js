/* ============================================================================
   Mesa de ayuda Nimbo · configuración de la interfaz  (contrato v1)

   Este es el ÚNICO archivo que cambias para adaptar la pantalla a tu caso de uso:
   títulos, ejemplos, nombres de las colas y las políticas que se muestran.
   El archivo es público (lo descarga cualquiera que abra la página):
   NO pongas aquí claves, tokens ni la URL de tu webhook.
   ============================================================================ */
window.MESA_CONFIG = {
  // 1) Textos de la pantalla
  titulo: "Mesa de ayuda Nimbo",
  subtitulo: "Asistente de primera línea para el equipo de soporte · Tienda Nimbo (empresa ficticia)",
  fechaReferencia: "2026-10-15",          // «hoy» fijo del caso, para que los días desde la entrega no cambien
  fechaReferenciaTexto: "15 de octubre de 2026",

  // 2) Conexión con el backend (salvo que renombres las rutas de la carpeta api/, no lo toques)
  endpoint: "/api/triage",
  health: "/api/health",
  minCaracteres: 3,
  maxCaracteres: 1000,
  timeoutMs: 130000,   // un poco más que maxDuration de la función en vercel.json (120 s)

  // 3) Cómo se escribe en pantalla cada valor del contrato
  etiquetas: {
    estados: {
      respondida: {
        titulo: "Respondida",
        detalle: "La respuesta se apoya en las políticas citadas.",
      },
      respondida_sin_citas: {
        titulo: "Respondida",
        detalle: "No cita ninguna política: revisa la respuesta con cuidado antes de usarla.",
      },
      clasificada: {
        titulo: "Clasificada",
        detalle: "El mensaje se clasificó; en esta ruta no se redacta una respuesta.",
      },
      sin_informacion: {
        titulo: "Sin información",
        detalle: "Las políticas no cubren esta consulta, así que el sistema no inventó una respuesta.",
      },
      fuera_de_alcance: {
        titulo: "Fuera de alcance",
        detalle: "El mensaje no es una consulta sobre Tienda Nimbo.",
      },
      requiere_humano: {
        titulo: "Requiere a una persona",
        detalle: "El sistema no pudo resolverlo solo: el caso pasa a revisión humana.",
      },
    },
    colas: {
      devoluciones: "Devoluciones",
      despachos: "Despachos",
      postventa: "Postventa",
      revision_humana: "Revisión humana",
      fuera_de_alcance: "Fuera de alcance",
    },
    motivos: {
      devolucion: "Devolución",
      cambio: "Cambio",
      despacho: "Despacho",
      producto_danado: "Producto dañado",
      garantia: "Garantía",
      reembolso: "Reembolso",
      otro: "Otro",
    },
    urgencias: {
      baja: "Baja",
      media: "Media",
      alta: "Alta",
    },
    rutas: {
      A: "Llamada simple",
      B: "Workflow",
      R: "RAG",
      C: "Agente",
      D: "Multiagente",
    },
    backends: {
      n8n: "n8n",
      make: "Make",
      langchain: "LangChain",
      demo: "Demostración",
    },
    pedidoEstados: {
      entregado: "Entregado",
      en_transito: "En tránsito",
      en_preparacion: "En preparación",
      cancelado: "Cancelado",
    },
  },

  // 4) Políticas del caso: la pantalla muestra el título y el texto de cada política citada
  politicas: {
    "POL-01": {
      titulo: "Devoluciones",
      texto: "Puedes devolver un producto dentro de 30 días corridos desde la fecha de entrega, " +
        "siempre que esté sin uso, con sus etiquetas y con su boleta o número de pedido. No " +
        "se aceptan devoluciones de productos personalizados, ropa interior ni alimentos. La " +
        "devolución se solicita en la mesa de ayuda indicando el número de pedido. El envío " +
        "de vuelta es gratuito si el producto llegó con falla o equivocado; en los demás " +
        "casos lo paga el cliente.",
    },
    "POL-02": {
      titulo: "Cambios de talla o color",
      texto: "Los cambios de talla o color se aceptan dentro de 15 días corridos desde la entrega, " +
        "sujetos a stock. El producto debe estar sin uso y con etiquetas. Si no hay stock del " +
        "producto solicitado, se ofrece una devolución según la política de devoluciones. " +
        "Cada pedido admite un solo cambio.",
    },
    "POL-03": {
      titulo: "Despachos",
      texto: "Tienda Nimbo despacha solo dentro de Chile. Plazos de entrega: Región Metropolitana, " +
        "2 a 4 días hábiles; otras regiones, 4 a 8 días hábiles; zonas extremas (Arica y " +
        "Parinacota, Aysén y Magallanes), hasta 12 días hábiles. El despacho es gratuito en " +
        "compras sobre $40.000; bajo ese monto cuesta $3.990. Un pedido se considera atrasado " +
        "si supera el plazo máximo de su zona.",
    },
    "POL-04": {
      titulo: "Productos dañados o incorrectos",
      texto: "Si un producto llega dañado o no corresponde a lo comprado, debes reportarlo dentro " +
        "de 48 horas desde la entrega, adjuntando fotos del producto y del embalaje. Si el " +
        "reporte llega a tiempo, Tienda Nimbo repone el producto sin costo o reembolsa el " +
        "total, a elección del cliente. Los reportes fuera de plazo se evalúan como garantía.",
    },
    "POL-05": {
      titulo: "Garantía",
      texto: "Todos los productos tienen 6 meses de garantía por fallas de fabricación, contados " +
        "desde la entrega. La garantía no cubre daños por mal uso, golpes ni desgaste normal. " +
        "Para usarla se requiere el número de pedido y una descripción de la falla; el " +
        "producto pasa por una revisión técnica de hasta 10 días hábiles.",
    },
    "POL-06": {
      titulo: "Reembolsos",
      texto: "Los reembolsos se hacen al mismo medio de pago de la compra, entre 5 y 10 días " +
        "hábiles después de que el producto devuelto llega a bodega y es aprobado. Tienda " +
        "Nimbo no hace reembolsos en efectivo ni a cuentas de terceros. El cliente recibe un " +
        "correo cuando el reembolso es emitido.",
    },
  },

  // 5) Ejemplos (botones de la izquierda). «demo» son las respuestas que se ven con ?demo=1:
  //    C = lo que devuelve un agente (n8n o LangChain) · B = lo que devuelve un workflow (Make)
  ejemplos: [
    {
      id: "devolucion",
      etiqueta: "Devolución",
      tipo: "camino feliz",
      mensaje: "Hola, mi pedido 1012 llegó hace unos días. ¿Todavía lo puedo devolver?",
      demo: {
        C: {
          ok: true,
          estado: "respondida",
          respuesta: "Sí, todavía puedes devolver tu pedido 1012: lo recibiste el 28 de septiembre, hace " +
            "17 días, y el plazo de devolución es de 30 días corridos desde la entrega [POL-01]. " +
            "El producto debe estar sin uso y con sus etiquetas, y la devolución se solicita en " +
            "la mesa de ayuda indicando el número de pedido [POL-01].",
          citas: ["POL-01"],
          pedido: {
            n_pedido: 1012,
            estado: "entregado",
            producto: "Cafetera de émbolo 1L",
            fecha_entrega: "2026-09-28",
            dias_desde_entrega: 17,
          },
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [
            {
              tipo: "herramienta",
              nombre: "consultar_pedido",
              detalle: "n_pedido = 1012 → entregado hace 17 días",
            },
            {
              tipo: "herramienta",
              nombre: "buscar_politicas",
              detalle: "«plazo de devolución» → POL-01",
            },
          ],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "C",
            modelo: "",
            llamadas_modelo: 2,
            id: "demo",
          },
        },
        B: {
          ok: true,
          estado: "respondida",
          respuesta: "Sí, todavía puedes devolver tu pedido 1012: lo recibiste el 28 de septiembre, hace " +
            "17 días, y el plazo de devolución es de 30 días corridos desde la entrega [POL-01]. " +
            "El producto debe estar sin uso y con sus etiquetas, y la devolución se solicita en " +
            "la mesa de ayuda indicando el número de pedido [POL-01].",
          citas: ["POL-01"],
          pedido: {
            n_pedido: 1012,
            estado: "entregado",
            producto: "Cafetera de émbolo 1L",
            fecha_entrega: "2026-09-28",
            dias_desde_entrega: 17,
          },
          solicitud: {
            es_consulta_tienda: true,
            n_pedido: 1012,
            motivo: "devolucion",
            urgencia: "baja",
            resumen: "Consulta si todavía puede devolver el pedido 1012.",
          },
          cola: "devoluciones",
          razon: "Pedido válido: se deriva según el motivo",
          alerta: "",
          pasos: [
            {
              tipo: "paso",
              nombre: "extraer_datos",
              detalle: "modelo → motivo = devolucion · n_pedido = 1012",
            },
            {
              tipo: "paso",
              nombre: "validar_pedido",
              detalle: "tabla de pedidos → entregado hace 17 días",
            },
            {
              tipo: "paso",
              nombre: "derivar_cola",
              detalle: "regla → devoluciones",
            },
            {
              tipo: "paso",
              nombre: "redactar_respuesta",
              detalle: "modelo con las políticas de la tienda como contexto",
            },
          ],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "B",
            modelo: "",
            llamadas_modelo: 2,
            id: "demo",
          },
        },
      },
    },
    {
      id: "danado",
      etiqueta: "Producto dañado",
      tipo: "razonamiento con dos reglas",
      mensaje: "Compré una parka (pedido 1011) y llegó con el cierre roto hace dos semanas. ¿Qué puedo hacer?",
      demo: {
        C: {
          ok: true,
          estado: "respondida",
          respuesta: "Tu pedido 1011 (Parka de plumas) se entregó el 30 de septiembre, hace 15 días. Los " +
            "productos dañados deben reportarse dentro de 48 horas desde la entrega [POL-04], por " +
            "lo que ese plazo ya venció y el caso se evalúa como garantía, que cubre fallas de " +
            "fabricación por 6 meses [POL-05]. Para usarla necesitamos el número de pedido y una " +
            "descripción de la falla; el producto pasa por una revisión técnica de hasta 10 días " +
            "hábiles [POL-05].",
          citas: ["POL-04", "POL-05"],
          pedido: {
            n_pedido: 1011,
            estado: "entregado",
            producto: "Parka de plumas",
            fecha_entrega: "2026-09-30",
            dias_desde_entrega: 15,
          },
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [
            {
              tipo: "herramienta",
              nombre: "consultar_pedido",
              detalle: "n_pedido = 1011 → entregado hace 15 días",
            },
            {
              tipo: "herramienta",
              nombre: "buscar_politicas",
              detalle: "«producto dañado plazo garantía» → POL-04, POL-05",
            },
          ],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "C",
            modelo: "",
            llamadas_modelo: 2,
            id: "demo",
          },
        },
        B: {
          ok: true,
          estado: "respondida",
          respuesta: "Tu pedido 1011 (Parka de plumas) se entregó el 30 de septiembre, hace 15 días. Los " +
            "productos dañados deben reportarse dentro de 48 horas desde la entrega [POL-04], por " +
            "lo que ese plazo ya venció y el caso se evalúa como garantía, que cubre fallas de " +
            "fabricación por 6 meses [POL-05]. Para usarla necesitamos el número de pedido y una " +
            "descripción de la falla; el producto pasa por una revisión técnica de hasta 10 días " +
            "hábiles [POL-05].",
          citas: ["POL-04", "POL-05"],
          pedido: {
            n_pedido: 1011,
            estado: "entregado",
            producto: "Parka de plumas",
            fecha_entrega: "2026-09-30",
            dias_desde_entrega: 15,
          },
          solicitud: {
            es_consulta_tienda: true,
            n_pedido: 1011,
            motivo: "producto_danado",
            urgencia: "media",
            resumen: "Parka del pedido 1011 con el cierre roto desde hace dos semanas; pide una solución.",
          },
          cola: "postventa",
          razon: "Pedido válido: se deriva según el motivo",
          alerta: "Reporte fuera del plazo de 48 horas (POL-04): se evalúa como garantía (POL-05).",
          pasos: [
            {
              tipo: "paso",
              nombre: "extraer_datos",
              detalle: "modelo → motivo = producto_danado · n_pedido = 1011",
            },
            {
              tipo: "paso",
              nombre: "validar_pedido",
              detalle: "tabla de pedidos → entregado hace 15 días",
            },
            {
              tipo: "paso",
              nombre: "derivar_cola",
              detalle: "regla → postventa · alerta de plazo (más de 48 h)",
            },
            {
              tipo: "paso",
              nombre: "redactar_respuesta",
              detalle: "modelo con las políticas de la tienda como contexto",
            },
          ],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "B",
            modelo: "",
            llamadas_modelo: 2,
            id: "demo",
          },
        },
      },
    },
    {
      id: "inexistente",
      etiqueta: "Pedido inexistente",
      tipo: "incertidumbre",
      mensaje: "¿En qué estado está mi pedido 1099?",
      demo: {
        C: {
          ok: true,
          estado: "requiere_humano",
          respuesta: "No encontré el pedido 1099. ¿Puedes verificar el número? Si está correcto, una " +
            "persona del equipo revisará tu caso.",
          citas: [],
          pedido: null,
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [
            {
              tipo: "herramienta",
              nombre: "consultar_pedido",
              detalle: "n_pedido = 1099 → no existe",
            },
          ],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "C",
            modelo: "",
            llamadas_modelo: 2,
            id: "demo",
          },
        },
        B: {
          ok: true,
          estado: "requiere_humano",
          respuesta: "No encontré el pedido 1099. ¿Puedes verificar el número? Si está correcto, una " +
            "persona del equipo revisará tu caso.",
          citas: [],
          pedido: null,
          solicitud: {
            es_consulta_tienda: true,
            n_pedido: 1099,
            motivo: "despacho",
            urgencia: "baja",
            resumen: "Pregunta en qué estado está el pedido 1099.",
          },
          cola: "revision_humana",
          razon: "El pedido no existe en la tabla",
          alerta: "",
          pasos: [
            {
              tipo: "paso",
              nombre: "extraer_datos",
              detalle: "modelo → motivo = despacho · n_pedido = 1099",
            },
            {
              tipo: "paso",
              nombre: "validar_pedido",
              detalle: "tabla de pedidos → no existe",
            },
            {
              tipo: "paso",
              nombre: "derivar_cola",
              detalle: "regla → revision_humana",
            },
            {
              tipo: "paso",
              nombre: "responder_con_texto_fijo",
              detalle: "sin modelo: mensaje preparado para este caso",
            },
          ],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "B",
            modelo: "",
            llamadas_modelo: 1,
            id: "demo",
          },
        },
      },
    },
    {
      id: "fuera",
      etiqueta: "Fuera de alcance",
      tipo: "fuera de alcance",
      mensaje: "Escríbeme un poema sobre el mar.",
      demo: {
        C: {
          ok: true,
          estado: "fuera_de_alcance",
          respuesta: "Fuera de alcance: solo respondo consultas sobre Tienda Nimbo.",
          citas: [],
          pedido: null,
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "C",
            modelo: "",
            llamadas_modelo: 1,
            id: "demo",
          },
        },
        B: {
          ok: true,
          estado: "fuera_de_alcance",
          respuesta: "Fuera de alcance: solo respondo consultas sobre Tienda Nimbo.",
          citas: [],
          pedido: null,
          solicitud: {
            es_consulta_tienda: false,
            n_pedido: null,
            motivo: null,
            urgencia: "baja",
            resumen: "Pide un poema sobre el mar.",
          },
          cola: "fuera_de_alcance",
          razon: "El mensaje no es una consulta a la tienda",
          alerta: "",
          pasos: [
            {
              tipo: "paso",
              nombre: "extraer_datos",
              detalle: "modelo → es_consulta_tienda = false",
            },
            {
              tipo: "paso",
              nombre: "derivar_cola",
              detalle: "regla → fuera_de_alcance",
            },
            {
              tipo: "paso",
              nombre: "responder_con_texto_fijo",
              detalle: "sin modelo: frase de fuera de alcance",
            },
          ],
          meta: {
            version: "1.0",
            backend: "demo",
            ruta: "B",
            modelo: "",
            llamadas_modelo: 1,
            id: "demo",
          },
        },
      },
    },
  ],

  // 6) Ayuda que se muestra según el tipo de error (los códigos son los del contrato)
  errores: {
    validacion: {
      titulo: "El mensaje no es válido",
      ayuda: "Escribe entre 3 y 1000 caracteres. Si pegaste un texto muy largo, deja solo lo " +
        "esencial del mensaje del cliente.",
    },
    acceso: {
      titulo: "Falta el código de acceso",
      ayuda: "Este despliegue pide un código para proteger la cuota del modelo. Escríbelo en el " +
        "campo «Código de acceso» y vuelve a intentar.",
    },
    limite: {
      titulo: "Demasiadas solicitudes seguidas",
      ayuda: "El servicio limita cuántas consultas se pueden hacer por minuto. Espera unos " +
        "segundos y vuelve a intentar.",
    },
    sin_configurar: {
      titulo: "El servicio todavía no está configurado",
      ayuda: "Faltan variables de entorno en Vercel (la guía dice cuáles). Después de definirlas " +
        "hay que volver a desplegar. Mientras tanto, puedes ver la interfaz en modo " +
        "demostración.",
    },
    backend_acceso: {
      titulo: "El backend rechazó las credenciales",
      ayuda: "El token que envía Vercel no coincide con el que espera n8n o Make. Revisa el " +
        "encabezado de autenticación en ambos lados y vuelve a desplegar si lo cambiaste.",
    },
    backend_url: {
      titulo: "No se encontró el backend",
      ayuda: "La URL del webhook no existe o no está activa. En n8n, el workflow debe estar " +
        "publicado y la URL ser la de producción (no la de prueba); en Make, el escenario " +
        "debe estar activo.",
    },
    cuota_ia: {
      titulo: "Se agotó la cuota del modelo",
      ayuda: "El modelo gratuito tiene límites por minuto y por día. Espera un poco o intenta " +
        "mañana; con algo de crédito en OpenRouter el cupo diario sube.",
    },
    backend: {
      titulo: "El backend falló",
      ayuda: "Revisa las ejecuciones del flujo (Executions en n8n, History en Make) para ver en " +
        "qué nodo o módulo se rompió. El identificador de abajo sirve para encontrar esta " +
        "solicitud en los registros de Vercel.",
    },
    timeout: {
      titulo: "El backend tardó demasiado",
      ayuda: "El flujo no respondió a tiempo. Reintenta; si se repite, revisa en la plataforma si " +
        "la ejecución quedó trabada o el modelo está lento.",
    },
    respuesta_invalida: {
      titulo: "La respuesta no cumple el contrato",
      ayuda: "El backend respondió, pero no con los campos del contrato v1. Revisa el último nodo " +
        "o módulo, el que responde al webhook.",
    },
    red: {
      titulo: "No se pudo contactar al servidor",
      ayuda: "Revisa tu conexión. Si abriste index.html directamente desde tu computador, no hay " +
        "servidor: usa el modo demostración o despliega en Vercel.",
    },
    no_json: {
      titulo: "El servidor no respondió con JSON",
      ayuda: "Suele pasar cuando la función /api/triage no está desplegada (404) o falló al " +
        "iniciar (500). Revisa los registros del despliegue en Vercel.",
    },
  },
};
