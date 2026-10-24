/* ============================================================================
   Novedades Tannia · configuración de la interfaz  (contrato v1)

   Este es el ÚNICO archivo que cambias para adaptar la pantalla a tu caso de uso:
   títulos, ejemplos y las reglas de marca que se muestran.
   El archivo es público (lo descarga cualquiera que abra la página):
   NO pongas aquí claves, tokens ni la URL de tu webhook.
   ============================================================================ */
window.MESA_CONFIG = {
  // 1) Textos de la pantalla
  titulo: "Novedades Tannia · Contenido para redes",
  subtitulo: "Asistente que propone contenido para Instagram, Facebook y TikTok · Tienda de ropa para damas y caballeros",
  fechaReferencia: "2026-10-15",          // «hoy» fijo del caso
  fechaReferenciaTexto: "15 de octubre de 2026",

  // Solicitud de campaña (entrada JSON del pasaporte). Las categorías deben coincidir con las del catálogo (datos.py).
  empresaId: "novedades-tannia",
  redes: ["instagram", "facebook", "tiktok"],
  categorias: ["accesorios", "blusas", "casacas", "faldas", "pantalones", "poleras", "vestidos"],

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
      texto: "Novedades Tannia es una tienda de ropa para damas y caballeros con precios accesibles " +
        "y novedades frecuentes. El tono es cercano, entusiasta y directo, tratando de tú y " +
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
      texto: "Novedades Tannia usa este asistente solo para generar contenido orgánico (no " +
        "pagado). El agente no administra campañas de anuncios pagados, no asigna presupuestos " +
        "publicitarios, no elige audiencias, no responde comentarios ni mensajes y no publica ni " +
        "programa nada sin la aprobación de una persona autorizada.",
    },
  },

  // 5) Ejemplos (botones de la izquierda). «demo.C» es la respuesta que se ve con ?demo=1 (sin llamar al modelo).
  ejemplos: [
    {
      id: "campana",
      etiqueta: "Campaña",
      tipo: "camino feliz",
      mensaje: "Quiero promocionar la Casaca Oversize Denim en Instagram, Facebook y TikTok.",
      redes: ["instagram", "facebook", "tiktok"],
      categoria: "casacas",
      criterios: "",
      demo: {
        C: {
          ok: true,
          estado: "respondida",
          respuesta: "### Instagram [PM-02]\n" +
            "Tu nueva casaca favorita a solo S/103.92. Casaca Oversize Denim con 20% de descuento hasta agotar stock, " +
            "tallas S, M y L en azul y negro.\nToca el enlace de la bio y asegura la tuya.\n" +
            "#NovedadesTannia #ModaPeru #Casaca #Denim #Oversize #Oferta\n\n" +
            "### Facebook [PM-03]\n" +
            "Llegó la Casaca Oversize Denim: corte amplio y cómodo, ideal para el día a día. Disponible en tallas S, M y L, " +
            "en azul y negro. Precio regular S/129.90, hoy a S/103.92 (20% de descuento hasta agotar stock). " +
            "Escríbenos por mensaje directo para comprar la tuya.\n#NovedadesTannia #Casaca #Oferta\n\n" +
            "### TikTok [PM-04]\n" +
            "Gancho: ¿Una casaca denim que combina con todo y está en oferta?\n" +
            "Prenda: Casaca Oversize Denim, tallas S a L, azul o negro, de S/129.90 a S/103.92.\n" +
            "Cierre: corre al enlace del perfil antes de que se agote.\n#NovedadesTannia #OutfitDelDia #Denim #Oferta",
          citas: ["PM-02", "PM-03", "PM-04"],
          pedido: null,
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [
            { tipo: "herramienta", nombre: "consultar_catalogo", detalle: "categoria = casacas → 2 prenda(s): Casaca Oversize Denim, Casaca Bomber Satén" },
            { tipo: "herramienta", nombre: "buscar_perfil_marca", detalle: "«reglas instagram facebook tiktok» → PM-02, PM-03, PM-04" },
          ],
          meta: { version: "1.0", backend: "demo", ruta: "C", modelo: "", llamadas_modelo: 3, id: "demo" },
        },
      },
    },
    {
      id: "oferta",
      etiqueta: "Casaca en oferta",
      tipo: "camino feliz",
      mensaje: "Arma una publicación para Instagram, Facebook y TikTok promocionando una casaca que esté en oferta.",
      redes: ["instagram", "facebook", "tiktok"],
      categoria: "casacas",
      criterios: "solo prendas con descuento",
      demo: {
        C: {
          ok: true,
          estado: "respondida",
          respuesta: "La casaca en oferta del catálogo es la Casaca Oversize Denim (20% hasta agotar stock).\n\n" +
            "### Instagram [PM-02]\n" +
            "Oferta que no se repite: Casaca Oversize Denim a S/103.92. Tallas S, M y L en azul y negro.\n" +
            "Toca el enlace de la bio.\n#NovedadesTannia #Casaca #Denim #ModaPeru #Oferta\n\n" +
            "### Facebook [PM-03]\n" +
            "Casaca Oversize Denim con 20% de descuento: de S/129.90 a S/103.92 hasta agotar stock. Tallas S, M y L, " +
            "colores azul y negro. Escríbenos por mensaje directo para separar la tuya.\n#NovedadesTannia #Oferta\n\n" +
            "### TikTok [PM-04]\n" +
            "Gancho: 20% menos en la casaca que todos quieren.\n" +
            "Prenda: Casaca Oversize Denim, azul o negro, tallas S a L, ahora S/103.92.\n" +
            "Cierre: enlace en el perfil, hasta agotar stock.\n#NovedadesTannia #Oferta #Denim",
          citas: ["PM-02", "PM-03", "PM-04"],
          pedido: null,
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [
            { tipo: "herramienta", nombre: "consultar_catalogo", detalle: "categoria = casacas → 2 prenda(s): Casaca Oversize Denim, Casaca Bomber Satén" },
            { tipo: "herramienta", nombre: "buscar_perfil_marca", detalle: "«reglas instagram facebook tiktok» → PM-02, PM-03, PM-04" },
          ],
          meta: { version: "1.0", backend: "demo", ruta: "C", modelo: "", llamadas_modelo: 3, id: "demo" },
        },
      },
    },
    {
      id: "faltantes",
      etiqueta: "Datos faltantes",
      tipo: "incertidumbre",
      mensaje: "Prepara una publicación de la Blusa Lino Verano para Instagram.",
      redes: ["instagram"],
      categoria: "blusas",
      criterios: "",
      demo: {
        C: {
          ok: true,
          estado: "sin_informacion",
          respuesta: "Estado: pendiente de información. La Blusa Lino Verano (SKU-108) no tiene los datos completos " +
            "para generar la publicación: le faltan el precio y la imagen autorizada. Actualiza esos campos en el " +
            "catálogo y vuelve a solicitar la publicación.",
          citas: [],
          pedido: null,
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [
            { tipo: "herramienta", nombre: "consultar_catalogo", detalle: "categoria = blusas → 1 prenda(s): Blusa Lino Verano" },
          ],
          meta: { version: "1.0", backend: "demo", ruta: "C", modelo: "", llamadas_modelo: 2, id: "demo" },
        },
      },
    },
    {
      id: "fuera",
      etiqueta: "Fuera de alcance",
      tipo: "fuera de alcance",
      mensaje: "Invierte S/500 en anuncios pagados, elige la audiencia y publica la campaña sin que nadie la revise.",
      redes: ["instagram", "facebook", "tiktok"],
      categoria: "",
      criterios: "",
      demo: {
        C: {
          ok: true,
          estado: "fuera_de_alcance",
          respuesta: "Fuera de alcance: solo genero contenido orgánico y requiere aprobación humana.",
          citas: [],
          pedido: null,
          solicitud: null,
          cola: null,
          razon: "",
          alerta: "",
          pasos: [],
          meta: { version: "1.0", backend: "demo", ruta: "C", modelo: "", llamadas_modelo: 1, id: "demo" },
        },
      },
    },
  ],

  // 6) Ayuda que se muestra según el tipo de error (los códigos son los del contrato)
  errores: {
    validacion: {
      titulo: "El mensaje no es válido",
      ayuda: "Escribe entre 3 y 1000 caracteres. Si pegaste un texto muy largo, deja solo lo " +
        "esencial de la publicación que necesitas.",
    },
    acceso: {
      titulo: "Falta el código de acceso",
      ayuda: "Este despliegue pide un código para proteger la cuota del modelo y tus redes. Escríbelo en el " +
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
      titulo: "Un servicio externo rechazó las credenciales",
      ayuda: "Meta, Zernio u OpenAI rechazó la clave o el token. Revisa la variable de entorno " +
        "correspondiente (META_PAGE_ACCESS_TOKEN, ZERNIO_API_KEY u OPENAI_API_KEY) y vuelve a desplegar.",
    },
    backend_url: {
      titulo: "No se encontró el backend",
      ayuda: "La dirección configurada del servicio no existe o no está activa.",
    },
    cuota_ia: {
      titulo: "Se agotó la cuota del modelo",
      ayuda: "El modelo gratuito tiene límites por minuto y por día. Espera un poco o intenta " +
        "mañana; con algo de crédito en OpenRouter el cupo diario sube.",
    },
    backend: {
      titulo: "El backend falló",
      ayuda: "El agente o un servicio de publicación falló. El identificador de abajo sirve para " +
        "encontrar esta solicitud en los registros de Vercel (o en la terminal, si corre en local).",
    },
    timeout: {
      titulo: "El backend tardó demasiado",
      ayuda: "El agente no respondió a tiempo. Reintenta; si se repite, el modelo gratuito " +
        "puede estar saturado: prueba más tarde o cambia MODEL_ID.",
    },
    respuesta_invalida: {
      titulo: "La respuesta no cumple el contrato",
      ayuda: "El agente respondió, pero no con los campos del contrato v1. Revisa los registros " +
        "del servidor con el identificador de abajo.",
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
