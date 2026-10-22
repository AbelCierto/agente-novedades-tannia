/* ============================================================================
   Mesa de ayuda Nimbo · lógica de la interfaz (contrato v1)

   Qué hace este archivo, en orden:
     1. Lee la configuración (config.js) y prepara la pantalla.
     2. Comprueba si el backend responde (GET /api/health). Con ?demo=1 usa respuestas de ejemplo.
     3. Valida el mensaje y lo envía (POST /api/triage).
     4. Dibuja la respuesta mostrando SOLO los campos que llegaron.

   Regla de seguridad: todo texto que viene del backend entra a la página con textContent
   (la función el() de abajo), nunca con innerHTML. Si el modelo devolviera etiquetas HTML o
   scripts, se verían como texto y no se ejecutarían.

   Para tu caso de uso casi no hay que tocar este archivo: edita config.js.
   ============================================================================ */
(function () {
  'use strict';

  const C = window.MESA_CONFIG;
  if (!C) {
    document.body.textContent = 'Falta config.js: la interfaz no puede iniciar.';
    return;
  }

  const $ = (id) => document.getElementById(id);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RUTAS = ['A', 'B', 'R', 'C', 'D'];
  const ESTADOS = ['respondida', 'sin_informacion', 'fuera_de_alcance', 'requiere_humano'];
  const ENDPOINT_PUBLICAR = C.endpointPublicar || '/api/publicar';
  const REDES_NOMBRE = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' };
  const params = new URLSearchParams(location.search);
  const rutaUrl = (params.get('ruta') || '').toUpperCase();

  const estado = {
    demo: params.get('demo') === '1',
    rutaDemo: rutaUrl === 'B' ? 'B' : 'C',
    salud: null,
    codigo: leer('mesa_codigo'),
    enCurso: null,
    temporizadores: [],
  };

  /* ------------------------------------------------------------------ utilidades */
  function leer(clave) {
    try { return sessionStorage.getItem(clave) || ''; } catch (_) { return ''; }
  }
  function guardar(clave, valor) {
    try { if (valor) sessionStorage.setItem(clave, valor); else sessionStorage.removeItem(clave); } catch (_) { /* sin almacenamiento: no pasa nada */ }
  }

  // el('div', {clase: 'x', title: 'y'}, 'texto', otroNodo): crea un elemento. Los textos entran como nodos de texto.
  function el(etiqueta, atributos, ...hijos) {
    const nodo = document.createElement(etiqueta);
    if (atributos) {
      for (const [k, v] of Object.entries(atributos)) {
        if (v === null || v === undefined || v === false || v === '' || k.startsWith('on')) continue;
        if (k === 'clase') nodo.className = v;
        else nodo.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const h of hijos.flat(Infinity)) {
      if (h === null || h === undefined || h === false) continue;
      nodo.append(typeof h === 'object' && h.nodeType ? h : document.createTextNode(String(h)));
    }
    return nodo;
  }

  function icono(nombre, clase) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icono' + (clase ? ' ' + clase : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const uso = document.createElementNS(SVG_NS, 'use');
    uso.setAttribute('href', '#i-' + nombre);
    svg.append(uso);
    return svg;
  }

  function humanizar(texto) {
    const t = String(texto).replace(/_/g, ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function etiqueta(grupo, clave) {
    const g = (C.etiquetas && C.etiquetas[grupo]) || {};
    return g[clave] || humanizar(clave);
  }

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaLarga(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : (iso || '—');
  }
  function duracion(ms) {
    if (typeof ms !== 'number' || !isFinite(ms)) return '—';
    return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} s`;
  }
  const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function anunciar(texto) {
    const nodo = $('anuncio');
    nodo.textContent = '';
    window.setTimeout(() => { nodo.textContent = texto; }, 60);
  }

  /* ------------------------------------------------------------------ piezas de la pantalla */
  function chipRuta(ruta) {
    const r = RUTAS.includes(ruta) ? ruta : '';
    if (!r) return null;
    return el('span', { clase: 'ruta-chip ruta-' + r, title: 'Ruta ' + r + ' · ' + etiqueta('rutas', r) }, `${r} · ${etiqueta('rutas', r)}`);
  }

  function ponerConexion(tipo, texto, ruta) {
    const caja = $('conexion');
    caja.dataset.estado = tipo;
    $('conexion-texto').textContent = texto;
    caja.querySelectorAll('.ruta-chip').forEach((n) => n.remove());
    const chip = ruta ? chipRuta(ruta) : null;
    if (chip) caja.append(chip);
  }

  function mostrarAviso(tipo, ...contenido) {
    const caja = $('aviso');
    caja.className = 'aviso' + (tipo === 'demo' ? ' aviso-demo' : '');
    caja.replaceChildren(icono(tipo === 'demo' ? 'play' : 'alerta'), ...contenido);
    caja.hidden = false;
  }

  function enlaceDemo(texto) {
    const url = new URL(location.href);
    url.searchParams.set('demo', '1');
    return el('a', { clase: 'boton boton-secundario boton-mini', href: url.pathname + url.search }, texto || 'Ver en modo demostración');
  }

  function avisoDemo() {
    const selector = el('select', { id: 'ruta-demo' },
      el('option', { value: 'C' }, 'Agente · n8n o LangChain (ruta C)'),
      el('option', { value: 'B' }, 'Workflow · Make (ruta B)'));
    selector.value = estado.rutaDemo;
    selector.addEventListener('change', () => {
      estado.rutaDemo = selector.value;
      ponerConexion('demo', 'Modo demostración', estado.rutaDemo);
      vistaVacia();
      anunciar('Ahora se simula la respuesta de la ruta ' + estado.rutaDemo);
    });
    const salir = el('a', { clase: 'boton boton-secundario boton-mini', href: location.pathname }, 'Salir del modo demostración');
    mostrarAviso('demo',
      el('p', { clase: 'aviso-texto' },
        el('strong', null, 'Modo demostración. '),
        'Las respuestas son ejemplos guardados en config.js: no hay ningún modelo conectado ni se gasta cuota. Solo responden los cuatro ejemplos.'),
      el('div', { clase: 'selector' }, el('label', { for: 'ruta-demo' }, 'Simular la respuesta de'), selector),
      salir);
  }

  /* ------------------------------------------------------------------ vistas del panel de resultado */
  function mostrar(nodo) {
    $('resultado').replaceChildren(nodo);
  }

  function vistaVacia() {
    mostrar(el('div', { clase: 'vacio' },
      el('div', { clase: 'vacio-icono' }, icono('cola')),
      el('h3', null, 'Aquí aparecerá el análisis'),
      el('p', null, 'Elige un ejemplo o pega un mensaje y pulsa «Analizar mensaje». Verás la respuesta sugerida, las políticas en que se apoya y lo que hizo el sistema para llegar a ella.')));
  }

  function vistaCargando() {
    const detalle = el('span', { clase: 'cargando-detalle', id: 'detalle-carga' },
      estado.demo ? 'Simulando la espera de un backend real.' : 'Un agente con modelo gratuito suele tardar entre 5 y 30 segundos.');
    const cancelar = el('button', { type: 'button', clase: 'boton boton-secundario boton-mini' }, icono('cerrar', 'icono-peq'), el('span', null, 'Cancelar'));
    cancelar.addEventListener('click', () => { if (estado.enCurso) estado.enCurso.control.abort(); });
    mostrar(el('div', { clase: 'cargando' },
      el('div', { clase: 'cargando-cabecera' },
        el('span', { clase: 'girar', 'aria-hidden': 'true' }),
        el('p', { clase: 'cargando-texto' }, 'Analizando el mensaje…', detalle),
        cancelar),
      el('div', { clase: 'esqueleto', 'aria-hidden': 'true' },
        el('div', { clase: 'barra barra-100' }), el('div', { clase: 'barra barra-90' }), el('div', { clase: 'barra barra-75' }), el('div', { clase: 'barra barra-40' }))));
    if (!estado.demo) {
      estado.temporizadores.push(window.setTimeout(() => { detalle.textContent = 'Sigue trabajando. Los modelos gratuitos a veces demoran más.'; }, 8000));
      estado.temporizadores.push(window.setTimeout(() => { detalle.textContent = 'Está tardando más de lo normal; puede estar reintentando. Si pasa de 2 minutos, la pantalla deja de esperar sola.'; }, 30000));
    }
  }

  function vistaInfo(titulo, texto, ...acciones) {
    mostrar(el('div', { clase: 'vacio' },
      el('div', { clase: 'vacio-icono' }, icono('info')),
      el('h3', null, titulo),
      el('p', null, texto),
      acciones.length ? el('div', { clase: 'acciones acciones-centro' }, ...acciones) : null));
  }

  function vistaError(datos) {
    const e = datos.error || {};
    const catalogo = C.errores || {};
    const codigo = catalogo[e.codigo] ? e.codigo : 'backend';
    const cfg = catalogo[codigo] || { titulo: 'No se pudo completar el análisis', ayuda: '' };
    const reintentable = e.reintentable === true || ['timeout', 'red', 'limite', 'cuota_ia', 'backend'].includes(codigo);
    const tecnico = [codigo, e.detalle, datos.meta && datos.meta.id ? 'id ' + datos.meta.id : ''].filter(Boolean).join(' · ');

    const acciones = [];
    if (reintentable) {
      const b = el('button', { type: 'button', clase: 'boton boton-secundario' }, icono('reintentar'), 'Reintentar');
      b.addEventListener('click', () => $('formulario').requestSubmit());
      acciones.push(b);
    }
    if (['sin_configurar', 'red', 'no_json'].includes(codigo) && !estado.demo) acciones.push(enlaceDemo());

    mostrar(el('div', { clase: 'res-error', role: 'alert' },
      el('div', { clase: 'res-error-cabecera' }, icono('alerta'), el('h3', null, cfg.titulo)),
      e.mensaje && e.mensaje !== cfg.titulo ? el('p', { clase: 'res-error-mensaje' }, e.mensaje) : null,
      cfg.ayuda ? el('p', { clase: 'res-error-ayuda' }, cfg.ayuda) : null,
      el('p', { clase: 'res-error-tecnico' }, tecnico),
      acciones.length ? el('div', { clase: 'acciones' }, ...acciones) : null));

    if (codigo === 'acceso') {
      $('bloque-codigo').hidden = false;
      $('codigo').setAttribute('aria-invalid', 'true');
      $('codigo').focus();
    }
  }

  /* ---- respuesta correcta ---- */
  function tituloPolitica(id) {
    const p = (C.politicas || {})[id];
    return p ? p.titulo : '';
  }

  // Convierte «[POL-01]» en una pequeña etiqueta; el resto del texto queda como texto.
  function conCitas(texto) {
    const partes = [];
    const re = /\[?\b(POL-\d{2})\b\]?/g;
    let ultimo = 0;
    let m;
    while ((m = re.exec(texto)) !== null) {
      if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
      partes.push(el('span', { clase: 'cita', title: tituloPolitica(m[1]) }, m[1]));
      ultimo = m.index + m[0].length;
    }
    if (ultimo < texto.length) partes.push(texto.slice(ultimo));
    return partes;
  }

  async function copiarTexto(texto, boton) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(texto);
      ok = true;
    } catch (_) {
      const auxiliar = el('textarea', { clase: 'solo-lectura', tabindex: '-1', 'aria-hidden': 'true' });
      auxiliar.value = texto;
      document.body.append(auxiliar);
      auxiliar.select();
      try { ok = document.execCommand('copy'); } catch (__) { ok = false; }
      auxiliar.remove();
    }
    const rotulo = boton.querySelector('span');
    const original = rotulo.textContent;
    rotulo.textContent = ok ? 'Copiado' : 'No se pudo copiar';
    anunciar(ok ? 'Respuesta copiada al portapapeles' : 'No se pudo copiar la respuesta');
    window.setTimeout(() => { rotulo.textContent = original; }, 2000);
  }

  function chipDato(nombre, valor, clase) {
    return el('span', { clase: 'dato-chip' + (clase ? ' ' + clase : '') }, nombre + ':', el('strong', null, valor));
  }

  function lista(filas) {
    const dl = el('dl', { clase: 'datos' });
    for (const [nombre, valor] of filas) dl.append(el('dt', null, nombre), el('dd', null, valor));
    return dl;
  }
  const mono = (t) => el('span', { clase: 'mono' }, t);

  function bloqueRespuesta(texto) {
    const copiar = el('button', { type: 'button', clase: 'boton boton-mini' }, icono('copiar', 'icono-peq'), el('span', null, 'Copiar'));
    copiar.addEventListener('click', () => copiarTexto(aTextoPlano(texto), copiar));
    return el('section', { clase: 'bloque bloque-respuesta', 'aria-labelledby': 'h-respuesta' },
      el('div', { clase: 'bloque-cabecera' }, el('h3', { id: 'h-respuesta' }, 'Respuesta sugerida'), copiar),
      renderMarkdown(texto));
  }

  /* ---- Markdown seguro: se construye con nodos (nunca innerHTML), el texto viene de un modelo ---- */
  function mdCitas(texto) {
    const nodos = [];
    const re = /\[?(PM-\d{2})\]?/g;
    let ultimo = 0;
    let m;
    while ((m = re.exec(texto)) !== null) {
      if (m.index > ultimo) nodos.push(document.createTextNode(texto.slice(ultimo, m.index)));
      nodos.push(el('span', { clase: 'cita', title: tituloPolitica(m[1]) }, m[1]));
      ultimo = m.index + m[0].length;
    }
    if (ultimo < texto.length) nodos.push(document.createTextNode(texto.slice(ultimo)));
    return nodos;
  }

  function mdInline(texto) {
    const nodos = [];
    for (const parte of texto.split(/(\*\*[^*]+\*\*)/g)) {
      if (!parte) continue;
      const negrita = /^\*\*([^*]+)\*\*$/.exec(parte);
      if (negrita) nodos.push(el('strong', null, ...mdCitas(negrita[1])));
      else nodos.push(...mdCitas(parte));
    }
    return nodos;
  }

  function renderMarkdown(md) {
    const cont = el('div', { clase: 'md' });
    let listaActual = null;
    let tablaActual = null;
    const cerrarLista = () => { if (listaActual) { cont.append(listaActual); listaActual = null; } };
    const cerrarTabla = () => { if (tablaActual) { cont.append(tablaActual); tablaActual = null; } };
    for (const bruto of String(md || '').split('\n')) {
      const s = bruto.trim();
      if (/^([-*_]\s*){3,}$/.test(s)) { cerrarLista(); cerrarTabla(); continue; }        // regla horizontal
      if (s.includes('|') && /^[\s:|-]+$/.test(s)) { continue; }                          // separador de tabla
      if (s.includes('|')) {                                                              // fila de tabla
        cerrarLista();
        if (!tablaActual) tablaActual = el('table', { clase: 'md-tabla' });
        const celdas = s.split('|').map((c) => c.trim());
        if (celdas.length && celdas[0] === '') celdas.shift();
        if (celdas.length && celdas[celdas.length - 1] === '') celdas.pop();
        tablaActual.append(el('tr', null, ...celdas.map((c) => el('td', null, ...mdInline(c)))));
        continue;
      }
      cerrarTabla();
      if (!s) { cerrarLista(); continue; }
      const enc = /^(#{1,6})\s+(.*)$/.exec(s);
      if (enc) { cerrarLista(); cont.append(el('p', { clase: 'md-h' }, ...mdInline(enc[2]))); continue; }
      if (s.startsWith('>')) { cerrarLista(); cont.append(el('blockquote', { clase: 'md-cita' }, ...mdInline(s.replace(/^>\s*/, '')))); continue; }
      const vineta = /^[-*+]\s+(.*)$/.exec(s);
      if (vineta) { if (!listaActual) listaActual = el('ul', { clase: 'md-lista' }); listaActual.append(el('li', null, ...mdInline(vineta[1]))); continue; }
      cerrarLista();
      cont.append(el('p', { clase: 'md-p' }, ...mdInline(s)));
    }
    cerrarLista();
    cerrarTabla();
    return cont;
  }

  // Versión en texto plano (igual que contrato.texto_plano) para la caja de publicar y para copiar.
  function aTextoPlano(md) {
    const salida = [];
    for (const bruto of String(md || '').split('\n')) {
      let s = bruto.trim();
      if (/^([-=_*]\s*){3,}$/.test(s)) continue;
      if (s.includes('|') && /^[\s:|-]+$/.test(s)) continue;
      s = s.replace(/^#{1,6}\s+/, '').replace(/^>\s*/, '').replace(/^[-*+]\s+/, '• ');
      if (s.includes('|')) s = s.split('|').map((c) => c.trim()).filter(Boolean).join(' ');
      salida.push(s);
    }
    return salida.join('\n')
      .replace(/(\*\*|__|\*|_|`)/g, '')
      .replace(/\s*\[PM-\d{2}\]/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function lineaEstado(tipo, mensaje) {
    return el('p', { clase: 'publicar-estado publicar-' + tipo },
      icono(tipo === 'ok' ? 'check' : 'alerta', 'icono-peq'), el('span', null, mensaje));
  }

  async function enviarPublicacion(red, contenido) {
    const cabeceras = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (estado.codigo) cabeceras['x-access-code'] = estado.codigo;
    const res = await fetch(ENDPOINT_PUBLICAR, { method: 'POST', headers: cabeceras, body: JSON.stringify({ red, contenido }), cache: 'no-store' });
    const crudo = await res.text();
    let datos = null;
    try { datos = JSON.parse(crudo); } catch (_) { /* no era JSON */ }
    return datos || { ok: false, error: { codigo: 'no_json', mensaje: 'El servidor respondió algo que no es JSON.' } };
  }

  // Detecta si una línea es el encabezado de una red (Instagram/Facebook/TikTok) y cuál.
  function marcadorDeRed(linea) {
    const limpio = linea.trim().toLowerCase()
      .replace(/^[#>\s]*/, '').replace(/^\d+[.)]\s*/, '').replace(/^[^a-z]*/, '');
    for (const red of ['instagram', 'facebook', 'tiktok']) {
      if (limpio.startsWith(red)) return red;
    }
    return null;
  }

  // Parte la propuesta en la sección de cada red (texto plano), para que cada una reciba lo suyo.
  function seccionesPorRed(md) {
    const lineas = String(md || '').split('\n');
    const marcas = [];
    lineas.forEach((l, i) => {
      const red = marcadorDeRed(l);
      if (red && !marcas.some((m) => m.red === red)) marcas.push({ i, red });
    });
    marcas.sort((a, b) => a.i - b.i);
    const secciones = {};
    marcas.forEach((m, k) => {
      const fin = k + 1 < marcas.length ? marcas[k + 1].i : lineas.length;
      secciones[m.red] = aTextoPlano(lineas.slice(m.i + 1, fin).join('\n'));
    });
    return secciones;
  }

  // Panel de la Fase 2: un cuadro editable por red; nada se publica sin que una persona lo apruebe.
  function bloquePublicar(texto) {
    const secciones = seccionesPorRed(texto);
    const completo = aTextoPlano(texto);
    const redes = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']];
    const filas = redes.map(([val, lab]) => {
      const cb = el('input', { type: 'checkbox', id: 'red-' + val, value: val, checked: true });
      cb.checked = true;   // las tres marcadas por defecto
      const area = el('textarea', { clase: 'campo-area', rows: '5', 'aria-label': 'Contenido para ' + lab });
      area.value = secciones[val] || completo;   // su propia sección; si no se detectó, la propuesta completa
      return { val, lab, cb, area };
    });
    const estadoCaja = el('div', { clase: 'publicar-estados', role: 'status', 'aria-live': 'polite' });
    const boton = el('button', { type: 'button', clase: 'boton boton-primario' }, icono('enviar'), el('span', null, 'Aprobar y publicar'));

    boton.addEventListener('click', async () => {
      const activos = filas.filter((f) => f.cb.checked);
      if (!activos.length) { estadoCaja.replaceChildren(lineaEstado('error', 'Elige al menos una red.')); return; }
      boton.setAttribute('aria-disabled', 'true');
      const resultados = [lineaEstado('info', `Publicando en ${activos.length} red(es)…`)];
      estadoCaja.replaceChildren(...resultados);
      resultados.length = 0;
      for (const f of activos) {
        const contenido = f.area.value.trim();
        if (contenido.length < 3) {
          resultados.push(lineaEstado('error', f.lab + ': el texto está vacío'));
          estadoCaja.replaceChildren(...resultados);
          continue;
        }
        try {
          const d = await enviarPublicacion(f.val, contenido);
          if (d.ok && d.publicacion) {
            const p = d.publicacion;
            resultados.push(lineaEstado('ok', (p.borrador ? 'Borrador' : 'Publicado') + ' · ' + f.lab + (p.id ? ' · id ' + p.id : '')));
          } else {
            const err = d.error || {};
            resultados.push(lineaEstado('error', f.lab + ': ' + (err.mensaje || err.codigo || 'error')));
          }
        } catch (_) {
          resultados.push(lineaEstado('error', f.lab + ': no se pudo conectar'));
        }
        estadoCaja.replaceChildren(...resultados);
      }
      boton.removeAttribute('aria-disabled');
    });

    const bloquesRed = filas.map((f) => el('div', { clase: 'publicar-red' },
      el('label', { clase: 'red-check' }, f.cb, f.lab), f.area));

    return el('section', { clase: 'bloque bloque-publicar', 'aria-labelledby': 'h-publicar' },
      el('div', { clase: 'bloque-cabecera' }, el('h3', { id: 'h-publicar' }, icono('enviar'), 'Aprobar y publicar en redes')),
      el('p', { clase: 'ayuda' }, 'Cada red tiene su propio texto. Revísalo, desmarca la que no quieras y pulsa publicar. Nada se publica sin tu aprobación.'),
      ...bloquesRed,
      el('div', { clase: 'acciones' }, boton),
      estadoCaja);
  }

  function bloquePoliticas(citas) {
    const items = citas.map((id) => {
      const p = (C.politicas || {})[id];
      if (!p) {
        return el('li', { clase: 'politica politica-fila' }, el('span', { clase: 'politica-id' }, id), el('span', null, 'Política no incluida en config.js'));
      }
      return el('li', null, el('details', { clase: 'politica' },
        el('summary', null, el('span', { clase: 'politica-id' }, id), el('span', null, p.titulo)),
        el('p', { clase: 'politica-texto' }, p.texto)));
    });
    return el('section', { clase: 'bloque', 'aria-labelledby': 'h-politicas' },
      el('h3', { id: 'h-politicas' }, icono('politica'), 'Políticas citadas'),
      el('ul', { clase: 'politicas' }, ...items));
  }

  function tarjetaPedido(p) {
    if (!p) return null;
    const filas = [
      ['Pedido', mono('#' + p.n_pedido)],
      ['Producto', p.producto || '—'],
      ['Estado', p.estado ? etiqueta('pedidoEstados', p.estado) : '—'],
      ['Entrega', p.fecha_entrega ? fechaLarga(p.fecha_entrega) : 'Aún sin entregar'],
    ];
    const tieneDias = typeof p.dias_desde_entrega === 'number';
    if (tieneDias) filas.push(['Desde la entrega', `${p.dias_desde_entrega} ${p.dias_desde_entrega === 1 ? 'día' : 'días'}`]);
    return el('section', { clase: 'tarjeta', 'aria-labelledby': 'h-pedido' },
      el('h3', { id: 'h-pedido' }, icono('pedido'), 'Pedido consultado'),
      lista(filas),
      tieneDias && C.fechaReferenciaTexto ? el('p', { clase: 'ayuda' }, `Días contados hasta el ${C.fechaReferenciaTexto}, la fecha fija de este caso de ejemplo.`) : null);
  }

  function tarjetaSolicitud(s) {
    if (!s) return null;
    const filas = [];
    if (typeof s.es_consulta_tienda === 'boolean') filas.push(['¿Consulta de la tienda?', s.es_consulta_tienda ? 'Sí' : 'No']);
    filas.push(['Pedido mencionado', typeof s.n_pedido === 'number' ? mono('#' + s.n_pedido) : 'Ninguno']);
    filas.push(['Motivo', s.motivo ? etiqueta('motivos', s.motivo) : '—']);
    if (s.resumen) filas.push(['Resumen', s.resumen]);
    return el('section', { clase: 'tarjeta', 'aria-labelledby': 'h-solicitud' },
      el('h3', { id: 'h-solicitud' }, icono('cola'), 'Clasificación del mensaje'),
      lista(filas));
  }

  function bloquePasos(pasos) {
    const items = pasos.map((p) => el('li', { clase: p.tipo === 'herramienta' ? 'paso-herramienta' : 'paso-simple' },
      el('span', { clase: 'paso-icono' }, icono(p.tipo === 'herramienta' ? 'herramienta' : 'paso')),
      el('span', { clase: 'paso-nombre' }, p.nombre),
      p.detalle ? el('p', { clase: 'paso-detalle' }, p.detalle) : null));
    return el('section', { clase: 'bloque', 'aria-labelledby': 'h-pasos' },
      el('h3', { id: 'h-pasos' }, icono('herramienta'), 'Qué hizo el sistema'),
      el('p', { clase: 'ayuda' }, 'Los pasos, en orden. Sirven para auditar de dónde salió cada dato de la respuesta.'),
      el('ol', { clase: 'pasos' }, ...items));
  }

  function bloqueTecnico(d, msNavegador) {
    const m = d.meta || {};
    const filas = [
      ['Backend', m.backend ? etiqueta('backends', m.backend) : '—'],
      ['Ruta', chipRuta(m.ruta) || '—'],
      ['Modelo', m.modelo ? mono(m.modelo) : (m.backend === 'demo' ? 'Ninguno (demostración)' : '—')],
      ['Llamadas al modelo', typeof m.llamadas_modelo === 'number' ? String(m.llamadas_modelo) : '—'],
      ['Tiempo en el navegador', duracion(msNavegador)],
    ];
    if (typeof m.latencia_ms === 'number') filas.push(['Tiempo en el servidor', duracion(m.latencia_ms)]);
    filas.push(['ID de solicitud', mono(m.id || '—')], ['Contrato', m.version ? 'v' + m.version : '—']);
    return el('details', { clase: 'tecnico' },
      el('summary', null, 'Detalles técnicos'),
      el('div', { clase: 'tecnico-cuerpo' },
        lista(filas),
        el('details', { clase: 'json' },
          el('summary', null, icono('codigo', 'icono-peq'), 'Ver la respuesta JSON del contrato'),
          el('pre', { tabindex: '0', 'aria-label': 'Respuesta JSON del contrato' }, JSON.stringify(d, null, 2)))));
  }

  function vistaResultado(d, msNavegador) {
    const respuesta = typeof d.respuesta === 'string' ? d.respuesta : '';
    const citas = Array.isArray(d.citas) ? d.citas : [];
    const estadoOk = ESTADOS.includes(d.estado) ? d.estado : 'respondida';
    const claveInfo = estadoOk === 'respondida' && !respuesta ? 'clasificada'
      : estadoOk === 'respondida' && !citas.length ? 'respondida_sin_citas' : estadoOk;
    const info = ((C.etiquetas && C.etiquetas.estados) || {})[claveInfo] || { titulo: humanizar(estadoOk), detalle: '' };
    const iconoEstado = { respondida: 'check', sin_informacion: 'info', fuera_de_alcance: 'prohibido', requiere_humano: 'persona' }[estadoOk];
    const urgencia = d.solicitud && d.solicitud.urgencia;

    const partes = [
      el('div', { clase: 'res-estado' },
        el('span', { clase: 'insignia insignia-' + estadoOk }, icono(iconoEstado), info.titulo),
        d.cola ? chipDato('Cola', etiqueta('colas', d.cola)) : null,
        urgencia ? chipDato('Urgencia', etiqueta('urgencias', urgencia), 'urgencia-' + urgencia) : null),
      info.detalle ? el('p', { clase: 'res-explica' }, info.detalle) : null,
      d.razon ? el('p', { clase: 'res-explica' }, el('strong', null, 'Razón: '), d.razon) : null,
      d.alerta ? el('div', { clase: 'alerta-res', role: 'note' }, icono('alerta'), el('p', null, el('strong', null, 'Alerta: '), d.alerta)) : null,
      respuesta ? bloqueRespuesta(respuesta) : null,
      (estadoOk === 'respondida' && respuesta) ? bloquePublicar(respuesta) : null,
      citas.length ? bloquePoliticas(citas) : null,
    ];
    const tarjetas = [tarjetaPedido(d.pedido), tarjetaSolicitud(d.solicitud)].filter(Boolean);
    if (tarjetas.length) partes.push(el('div', { clase: 'rejilla' }, ...tarjetas));
    if (Array.isArray(d.pasos) && d.pasos.length) partes.push(bloquePasos(d.pasos));
    partes.push(bloqueTecnico(d, msNavegador));
    return el('article', { clase: 'res' }, ...partes);
  }

  /* ------------------------------------------------------------------ llamada al backend */
  function errorLocal(codigo, detalle) {
    return { ok: false, error: { codigo, mensaje: '', detalle: detalle || '', reintentable: ['red', 'timeout'].includes(codigo) }, meta: {} };
  }

  async function analizarReal(mensaje, control) {
    let vencio = false;
    const reloj = window.setTimeout(() => { vencio = true; control.abort(); }, C.timeoutMs);
    try {
      const cabeceras = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (estado.codigo) cabeceras['x-access-code'] = estado.codigo;
      const res = await fetch(C.endpoint, { method: 'POST', headers: cabeceras, body: JSON.stringify({ mensaje }), signal: control.signal, cache: 'no-store' });
      const crudo = await res.text();
      let datos = null;
      try { datos = JSON.parse(crudo); } catch (_) { /* no era JSON */ }
      if (datos && typeof datos === 'object' && typeof datos.ok === 'boolean') return datos;
      return errorLocal('no_json', 'HTTP ' + res.status);
    } catch (e) {
      if (control.signal.aborted) return errorLocal(vencio ? 'timeout' : 'cancelado', vencio ? 'la pantalla dejó de esperar' : '');
      return errorLocal('red', String((e && e.message) || e));
    } finally {
      window.clearTimeout(reloj);
    }
  }

  async function analizarDemo(mensaje, control) {
    await new Promise((resolver) => {
      const t = window.setTimeout(resolver, 700 + Math.random() * 500);
      control.signal.addEventListener('abort', () => { window.clearTimeout(t); resolver(); }, { once: true });
    });
    if (control.signal.aborted) return errorLocal('cancelado');
    const ej = C.ejemplos.find((x) => x.mensaje.trim() === mensaje);
    if (!ej || !ej.demo) return { ok: false, sinEjemplo: true };
    return JSON.parse(JSON.stringify(ej.demo[estado.rutaDemo] || ej.demo.C));
  }

  /* ------------------------------------------------------------------ formulario */
  function validar(mensaje) {
    if (mensaje.length < C.minCaracteres) return `Escribe al menos ${C.minCaracteres} caracteres.`;
    if (mensaje.length > C.maxCaracteres) return `El mensaje supera los ${C.maxCaracteres} caracteres.`;
    return '';
  }
  function errorCampo(texto) {
    const caja = $('error-mensaje');
    caja.textContent = texto;
    caja.hidden = !texto;
    if (texto) $('mensaje').setAttribute('aria-invalid', 'true'); else $('mensaje').removeAttribute('aria-invalid');
  }
  function actualizarContador() {
    const n = $('mensaje').value.length;
    const caja = $('contador');
    caja.textContent = `${n} / ${C.maxCaracteres}`;
    caja.classList.toggle('cerca', n >= C.maxCaracteres * 0.9 && n < C.maxCaracteres);
    caja.classList.toggle('lleno', n >= C.maxCaracteres);
  }
  function marcarEjemplo(id) {
    document.querySelectorAll('.ejemplo').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  }
  function usarEjemplo(ej) {
    $('mensaje').value = ej.mensaje;
    actualizarContador();
    errorCampo('');
    marcarEjemplo(ej.id);
    anunciar('Ejemplo «' + ej.etiqueta + '» cargado en el mensaje');
  }
  function crearEjemplos() {
    const ul = $('lista-ejemplos');
    for (const ej of C.ejemplos) {
      const b = el('button', { type: 'button', clase: 'ejemplo', 'aria-pressed': 'false', 'data-id': ej.id },
        el('span', { clase: 'ejemplo-titulo' }, ej.etiqueta), el('span', { clase: 'ejemplo-tipo' }, ej.tipo));
      b.addEventListener('click', () => usarEjemplo(ej));
      ul.append(el('li', null, b));
    }
  }

  function fijarCargando(activo) {
    $('enviar').setAttribute('aria-disabled', String(activo));   // aria-disabled y no «disabled»: así el foco del teclado no se pierde
    $('enviar-texto').textContent = activo ? 'Analizando…' : 'Analizar mensaje';
    $('resultado').setAttribute('aria-busy', String(activo));
    if (!activo) {
      estado.temporizadores.forEach((t) => window.clearTimeout(t));
      estado.temporizadores = [];
    }
  }

  function revelarResultado() {
    const titulo = $('t-resultado');
    const arriba = titulo.getBoundingClientRect().top;
    if (arriba > window.innerHeight * 0.55 || arriba < 0) titulo.scrollIntoView({ behavior: reducirMovimiento() ? 'auto' : 'smooth', block: 'start' });
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (estado.enCurso) return;
    const mensaje = $('mensaje').value.trim();
    const problema = validar(mensaje);
    if (problema) {
      errorCampo(problema);
      $('mensaje').focus();
      return;
    }
    errorCampo('');
    $('codigo').removeAttribute('aria-invalid');

    const control = new AbortController();
    estado.enCurso = { control };
    fijarCargando(true);
    vistaCargando();
    anunciar('Analizando el mensaje');
    const inicio = performance.now();
    const datos = estado.demo ? await analizarDemo(mensaje, control) : await analizarReal(mensaje, control);
    const ms = performance.now() - inicio;
    estado.enCurso = null;
    fijarCargando(false);

    if (datos.sinEjemplo) {
      vistaInfo('En modo demostración solo responden los ejemplos',
        'Elige uno de los cuatro ejemplos tal como está, sin editarlo. Para escribir mensajes libres hace falta conectar el backend.',
        el('a', { clase: 'boton boton-secundario', href: location.pathname }, 'Salir del modo demostración'));
      anunciar('En modo demostración solo responden los cuatro ejemplos');
    } else if (datos.ok) {
      mostrar(vistaResultado(datos, ms));
      const nCitas = Array.isArray(datos.citas) ? datos.citas.length : 0;
      const nombreEstado = (((C.etiquetas && C.etiquetas.estados) || {})[datos.estado] || {}).titulo || humanizar(datos.estado || 'respondida');
      anunciar(`Análisis listo: ${nombreEstado}. ${nCitas} ${nCitas === 1 ? 'política citada' : 'políticas citadas'}.`);
    } else if (datos.error && datos.error.codigo === 'cancelado') {
      vistaInfo('Consulta cancelada', 'La pantalla dejó de esperar. Si ya había salido hacia el backend, puede que él siga trabajando: revisa sus ejecuciones si necesitas confirmarlo.');
      anunciar('Consulta cancelada');
    } else {
      vistaError(datos);
      anunciar('No se pudo completar el análisis');
    }
    revelarResultado();
  }

  /* ------------------------------------------------------------------ conexión con el backend */
  async function comprobarSalud() {
    const control = new AbortController();
    const reloj = window.setTimeout(() => control.abort(), 8000);
    try {
      const res = await fetch(C.health, { cache: 'no-store', signal: control.signal });
      const datos = await res.json();
      if (!res.ok || !datos || datos.ok !== true) throw new Error('health');
      estado.salud = datos;
      const nombre = datos.backend ? etiqueta('backends', datos.backend) : 'backend';
      if (datos.configurado === false) {
        ponerConexion('sin-configurar', 'Falta configurar el backend', datos.ruta);
        mostrarAviso('info',
          el('p', { clase: 'aviso-texto' }, el('strong', null, 'El servicio todavía no está configurado. '),
            'La función responde, pero faltan variables de entorno en Vercel. Defínelas, vuelve a desplegar y recarga esta página.'),
          enlaceDemo());
      } else {
        ponerConexion('conectado', 'Conectado · ' + nombre, datos.ruta);
      }
      if (datos.requiere_codigo) $('bloque-codigo').hidden = false;
    } catch (_) {
      ponerConexion('sin-backend', 'Sin backend (solo interfaz)');
      mostrarAviso('info',
        el('p', { clase: 'aviso-texto' }, el('strong', null, 'No se encontró el backend. '),
          'Esta página funciona como interfaz, pero ' + C.health + ' no responde. Si acabas de publicar solo la carpeta public, es lo esperado: sigue la guía para agregar la carpeta api.'),
        enlaceDemo());
    } finally {
      window.clearTimeout(reloj);
    }
  }

  /* ------------------------------------------------------------------ inicio */
  function iniciar() {
    document.title = C.titulo + ' · MVP';
    $('titulo').textContent = C.titulo;
    $('subtitulo').textContent = C.subtitulo;
    $('mensaje').maxLength = C.maxCaracteres;
    crearEjemplos();
    vistaVacia();
    actualizarContador();

    $('formulario').addEventListener('submit', enviar);
    $('mensaje').addEventListener('input', () => {
      actualizarContador();
      errorCampo('');
      const actual = $('mensaje').value.trim();
      const coincide = C.ejemplos.find((e) => e.mensaje.trim() === actual);
      marcarEjemplo(coincide ? coincide.id : '');
    });
    $('mensaje').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('formulario').requestSubmit(); }
    });
    $('limpiar').addEventListener('click', () => {
      $('mensaje').value = '';
      actualizarContador();
      errorCampo('');
      marcarEjemplo('');
      vistaVacia();
      $('mensaje').focus();
    });
    $('codigo').value = estado.codigo;
    $('codigo').addEventListener('input', () => {
      estado.codigo = $('codigo').value.trim();
      guardar('mesa_codigo', estado.codigo);
      $('codigo').removeAttribute('aria-invalid');
    });

    if (estado.demo) {
      ponerConexion('demo', 'Modo demostración', estado.rutaDemo);
      avisoDemo();
    } else {
      comprobarSalud();
    }
  }

  iniciar();
})();
