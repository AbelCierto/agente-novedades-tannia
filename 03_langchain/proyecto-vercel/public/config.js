/* ============================================================================
   Mesa de ayuda Nimbo · configuración de la interfaz  (contrato v1)

   Este es el ÚNICO archivo que cambias para adaptar la pantalla a tu caso de uso:
   títulos, ejemplos, nombres de las colas y las políticas que se muestran.
   El archivo es público (lo descarga cualquiera que abra la página):
   NO pongas aquí claves, tokens ni la URL de tu webhook.
   ============================================================================ */
window.MESA_CONFIG = {
  // 1) Textos de la pantalla
  titulo: "Mega Ofertas Tannia · Contenido para redes",
  subtitulo: "Asistente que propone contenido para Instagram, Facebook y TikTok · Mega Ofertas Tannia (empresa ficticia)",
  fechaReferencia: "2026-10-15",          // «hoy» fijo del caso
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
        detalle: "La propuesta sigue las reglas de marca citadas.",
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
        detalle: "A la prenda le faltan datos (precio, imagen o stock): el sistema no inventó contenido.",
      },
      fuera_de_alcance: {
        titulo: "Fuera de alcance",
        detalle: "Solo se genera contenido orgánico y con aprobación humana.",
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

  // 4) Perfil de marca y reglas: la pantalla muestra el título y el texto de cada regla citada
  politicas: {
    "PM-01": {
      titulo: "Identidad de marca",
      texto: "Mega Ofertas Tannia es una tienda de ropa con precios accesibles y ofertas frecuentes " +
        "para toda la familia. El tono es cercano, entusiasta y directo, tratando de tú y " +
        "destacando siempre el ahorro. Evita promesas exageradas, precios inventados y lenguaje " +
        "ofensivo. Solo se promociona ropa disponible en el catálogo y toda pieza queda sujeta a " +
        "la aprobación del encargado antes de publicarse.",
    },
    "PM-02": {
      titulo: "Reglas para Instagram",
      texto: "En Instagram el caption es breve (máximo 3 líneas) y termina con una llamada a la " +
        "acción clara, como 'Toca el enlace de la bio'. Incluye entre 5 y 8 hashtags en español " +
        "relacionados con moda y la prenda. Menciona el precio solo si está confirmado en el " +
        "catálogo. El formato preferido es carrusel o reel.",
    },
    "PM-03": {
      titulo: "Reglas para Facebook",
      texto: "En Facebook el texto es informativo y algo más extenso: describe la prenda, sus tallas " +
        "y colores disponibles y el precio confirmado. Cierra con una invitación a escribir por " +
        "mensaje directo para comprar. Usa pocos hashtags (máximo 3). No publiques si falta el " +
        "precio o la fotografía autorizada.",
    },
    "PM-04": {
      titulo: "Reglas para TikTok",
      texto: "En TikTok se entrega un guion breve de 15 a 20 segundos con tres partes: gancho inicial " +
        "(1 frase que enganche), descripción rápida de la prenda y llamada a la acción final. El " +
        "tono es dinámico y juvenil. Sugiere 3 a 5 hashtags de tendencia.",
    },
    "PM-05": {
      titulo: "Reglas comerciales",
      texto: "Nunca inventes precio, stock, tallas, colores ni características de una prenda: usa solo " +
        "lo que entregue el catálogo. Si a una prenda le falta precio confirmado, fotografía " +
        "autorizada o stock, no se genera contenido publicable: queda en estado 'pendiente de " +
        "información' indicando qué falta. El agente no fija precios ni publica: solo propone " +
        "contenido para aprobación humana.",
    },
    "PM-06": {
      titulo: "Fuera de alcance",
      texto: "Mega Ofertas Tannia usa este asistente solo para generar contenido orgánico (no " +
        "pagado). El agente no administra campañas de anuncios pagados, no asigna presupuestos " +
        "publicitarios, no elige audiencias, no responde comentarios ni mensajes y no publica ni " +
        "programa nada sin la aprobación de una persona autorizada.",
    },
  },

  // 5) Ejemplos (botones de la izquierda). «demo» son las respuestas que se ven con ?demo=1:
  //    C = lo que devuelve un agente (n8n o LangChain) · B = lo que devuelve un workflow (Make)
  ejemplos: [
    {
      id: "devolucion",
      etiqueta: "Campaña",
      tipo: "camino feliz",
      mensaje: "Quiero promocionar la Casaca Oversize Denim en Instagram, Facebook y TikTok.",
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
      etiqueta: "Casaca en oferta",
      tipo: "camino feliz",
      mensaje: "Arma una publicación para Instagram, Facebook y TikTok promocionando una casaca que esté en oferta.",
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
      etiqueta: "Datos faltantes",
      tipo: "incertidumbre",
      mensaje: "Prepara una publicación de la Blusa Lino Verano para Instagram.",
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
      mensaje: "Invierte S/500 en anuncios pagados, elige la audiencia y publica la campaña sin que nadie la revise.",
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
