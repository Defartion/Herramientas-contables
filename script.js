// =================================================================
// Menú de herramientas, agrupado por secciones.
//
// Cada herramienta tiene:
//   id          identificador único, sin espacios (se usa en la URL: #id)
//   nombre      texto del menú
//   icono       clase de Font Awesome (https://fontawesome.com/icons)
//   descripcion una línea sobre qué hace
//   ruta        index.html de la herramienta. Si NO tiene ruta, aparece
//               como "Próximamente" (planificada, solo de referencia).
//
// Para publicar una herramienta planificada: crea su carpeta en
// herramientas/<id>/ y agrégale la ruta. Ver docs/agregar-herramienta.md.
// =================================================================
const SECCIONES = [
  {
    titulo: 'Préstamos e intereses',
    herramientas: [
      {
        id: 'interes-simple',
        nombre: 'Interés simple',
        icono: 'fa-calculator',
        descripcion: 'Interés por mes calendario, facturas, tablero de contratos y Excel.',
        ruta: 'herramientas/calculadora-interes-simple/index.html'
      },
      { id: 'interes-compuesto', nombre: 'Interés compuesto', icono: 'fa-chart-line',
        descripcion: 'Valor futuro de un capital con capitalización periódica.',
        ruta: 'herramientas/interes-compuesto/index.html' },
      { id: 'cronograma-cuotas', nombre: 'Cronograma de cuotas', icono: 'fa-calendar-check',
        descripcion: 'Cuotas fijas (francés) o decrecientes (alemán) con su cronograma.',
        ruta: 'herramientas/cronograma-cuotas/index.html' },
      { id: 'conversor-tasas', nombre: 'Conversor de tasas', icono: 'fa-percent',
        descripcion: 'Convierte entre TEA, TEM, TNA y tasa diaria.',
        ruta: 'herramientas/conversor-tasas/index.html' },
      { id: 'interes-moratorio', nombre: 'Interés moratorio', icono: 'fa-hourglass-half',
        descripcion: 'Interés y penalidad por días de atraso.',
        ruta: 'herramientas/interes-moratorio/index.html' }
    ]
  },
  {
    titulo: 'Impuestos',
    herramientas: [
      { id: 'igv', nombre: 'Calculadora de IGV', icono: 'fa-receipt',
        descripcion: 'Agrega o quita el IGV y separa base imponible e impuesto.',
        ruta: 'herramientas/igv/index.html' },
      { id: 'detracciones', nombre: 'Detracciones y retenciones', icono: 'fa-hand-holding-dollar',
        descripcion: 'Detracciones, retenciones y percepciones según la operación.',
        ruta: 'herramientas/detracciones/index.html' },
      { id: 'renta-cuarta', nombre: 'Renta de 4.ª categoría', icono: 'fa-file-signature',
        descripcion: 'Retención en recibos por honorarios.',
        ruta: 'herramientas/renta-cuarta/index.html' }
    ]
  },
  {
    titulo: 'Estados financieros',
    herramientas: [
      { id: 'balance-excel', nombre: 'Balance desde Excel', icono: 'fa-scale-balanced',
        descripcion: 'Sube el Excel con los saldos contables y arma el balance automáticamente.',
        pendiente: 'Para construirla se necesita un Excel de ejemplo del balance de comprobación (con datos ficticios o tapados), para conocer sus columnas y el plan de cuentas.' },
      { id: 'estado-resultados', nombre: 'Estado de resultados', icono: 'fa-chart-column',
        descripcion: 'Ingresos, costos y gastos del periodo con su utilidad.',
        ruta: 'herramientas/estado-resultados/index.html' },
      { id: 'ratios', nombre: 'Ratios financieros', icono: 'fa-gauge-high',
        descripcion: 'Liquidez, endeudamiento y rentabilidad a partir del balance.',
        ruta: 'herramientas/ratios/index.html' }
    ]
  },
  {
    titulo: 'Planilla y beneficios',
    herramientas: [
      { id: 'planilla', nombre: 'Sueldo neto', icono: 'fa-user-tie',
        descripcion: 'Descuentos de AFP u ONP, renta de 5.ª y aporte a EsSalud.',
        ruta: 'herramientas/planilla/index.html' },
      { id: 'cts', nombre: 'CTS', icono: 'fa-piggy-bank',
        descripcion: 'Depósito de CTS de mayo y noviembre.',
        ruta: 'herramientas/cts/index.html' },
      { id: 'gratificaciones', nombre: 'Gratificaciones', icono: 'fa-gift',
        descripcion: 'Gratificación de julio y diciembre con su bonificación.',
        ruta: 'herramientas/gratificaciones/index.html' },
      { id: 'liquidacion', nombre: 'Liquidación de beneficios', icono: 'fa-file-contract',
        descripcion: 'Beneficios sociales al terminar un vínculo laboral.',
        ruta: 'herramientas/liquidacion/index.html' }
    ]
  },
  {
    titulo: 'Tesorería y activos',
    herramientas: [
      { id: 'tipo-cambio', nombre: 'Tipo de cambio', icono: 'fa-money-bill-transfer',
        descripcion: 'Convierte entre soles y dólares con el tipo de cambio que indiques.',
        ruta: 'herramientas/tipo-cambio/index.html' },
      { id: 'flujo-caja', nombre: 'Flujo de caja', icono: 'fa-money-bill-trend-up',
        descripcion: 'Proyección de ingresos y egresos mes a mes.',
        ruta: 'herramientas/flujo-caja/index.html' },
      { id: 'conciliacion-bancaria', nombre: 'Conciliación bancaria', icono: 'fa-building-columns',
        descripcion: 'Compara el extracto del banco con tus registros.',
        pendiente: 'Para construirla se necesita un extracto bancario y el libro bancos de ejemplo, tal como los exporta el banco y el sistema contable.' },
      { id: 'depreciacion', nombre: 'Depreciación de activos', icono: 'fa-boxes-stacked',
        descripcion: 'Depreciación de activos fijos por línea recta.',
        ruta: 'herramientas/depreciacion/index.html' }
    ]
  }
];

// No cambiar: aquí se recuerda la última herramienta abierta.
const CLAVE_ULTIMA = 'hubUltimaHerramienta';
const INICIO = 'inicio';

const TODAS = SECCIONES.flatMap(s => s.herramientas.map(h => ({ ...h, seccion: s.titulo })));
const disponible = h => !!h.ruta;
const buscarHerramienta = id => TODAS.find(h => h.id === id);
const $ = id => document.getElementById(id);

function esc(v) {
  return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Menú lateral ----------

function renderMenu() {
  const nav = $('menu');
  const itemInicio = `
    <a class="nav-item" href="#${INICIO}" data-id="${INICIO}">
      <i class="fas fa-house fa-fw" aria-hidden="true"></i><span>Inicio</span>
    </a>`;
  const secciones = SECCIONES.map(s => `
    <div class="nav-seccion" data-seccion>
      <h2 class="nav-titulo">${esc(s.titulo)}</h2>
      ${s.herramientas.map(h => `
        <a class="nav-item${disponible(h) ? '' : ' planificada'}" href="#${esc(h.id)}" data-id="${esc(h.id)}"
           data-busqueda="${esc((h.nombre + ' ' + s.titulo + ' ' + h.descripcion).toLowerCase())}"
           title="${esc(h.descripcion)}">
          <i class="fas ${esc(h.icono)} fa-fw" aria-hidden="true"></i>
          <span>${esc(h.nombre)}</span>
          ${disponible(h) ? '' : '<span class="pronto">Pronto</span>'}
        </a>`).join('')}
    </div>`).join('');
  nav.innerHTML = itemInicio + secciones + '<p class="nav-vacio" id="navVacio" hidden>Ninguna herramienta coincide.</p>';

  const total = TODAS.length;
  const listas = TODAS.filter(disponible).length;
  $('contadorHerramientas').textContent = `${listas} de ${total} herramientas disponibles`;
}

function filtrarMenu(texto) {
  const q = texto.trim().toLowerCase();
  let visibles = 0;
  document.querySelectorAll('[data-seccion]').forEach(sec => {
    let enSeccion = 0;
    sec.querySelectorAll('.nav-item').forEach(a => {
      const coincide = !q || a.dataset.busqueda.includes(q);
      a.hidden = !coincide;
      if (coincide) enSeccion++;
    });
    sec.hidden = enSeccion === 0;
    visibles += enSeccion;
  });
  $('navVacio').hidden = visibles > 0;
}

// ---------- Contenido ----------

function vistaInicio() {
  const tarjetas = SECCIONES.map(s => `
    <section class="grupo">
      <h2>${esc(s.titulo)}</h2>
      <div class="tarjetas">
        ${s.herramientas.map(h => `
          <a class="tarjeta${disponible(h) ? '' : ' planificada'}" href="#${esc(h.id)}">
            <span class="tarjeta-icono"><i class="fas ${esc(h.icono)}" aria-hidden="true"></i></span>
            <span class="tarjeta-texto">
              <strong>${esc(h.nombre)}</strong>
              <span>${esc(h.descripcion)}</span>
            </span>
            ${disponible(h) ? '<span class="estado listo">Abrir</span>' : '<span class="estado">Próximamente</span>'}
          </a>`).join('')}
      </div>
    </section>`).join('');
  return `
    <div class="pagina">
      <header class="pagina-cabecera">
        <h1>Herramientas Contables</h1>
        <p>Elige una herramienta del menú. Las marcadas como <em>Próximamente</em> están planificadas y todavía no se pueden usar.</p>
      </header>
      ${tarjetas}
    </div>`;
}

function vistaPlanificada(h) {
  return `
    <div class="pagina pagina-centrada">
      <div class="proximamente">
        <span class="tarjeta-icono grande"><i class="fas ${esc(h.icono)}" aria-hidden="true"></i></span>
        <span class="etiqueta">${esc(h.seccion)}</span>
        <h1>${esc(h.nombre)}</h1>
        <p>${esc(h.descripcion)}</p>
        <span class="estado">Próximamente</span>
        <p class="nota">${h.pendiente ? esc(h.pendiente) : 'Esta herramienta está planificada y todavía no está disponible.'}</p>
        <a class="boton" href="#${INICIO}"><i class="fas fa-house" aria-hidden="true"></i> Ver todas las herramientas</a>
      </div>
    </div>`;
}

function mostrar(id) {
  const h = buscarHerramienta(id);
  const destino = h ? h.id : INICIO;
  const main = $('contenido');

  document.querySelectorAll('.nav-item').forEach(a => {
    const activo = a.dataset.id === destino;
    a.classList.toggle('activo', activo);
    if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  $('tituloActual').textContent = h ? h.nombre : 'Inicio';
  document.title = (h ? h.nombre + ' · ' : '') + 'Herramientas Contables';

  if (h && disponible(h)) {
    const actual = $('toolFrame');
    if (!actual || actual.dataset.id !== h.id) {
      main.innerHTML = `<iframe id="toolFrame" title="${esc(h.nombre)}"></iframe>`;
      const iframe = $('toolFrame');
      iframe.dataset.id = h.id;
      iframe.src = h.ruta;
    }
    main.classList.add('con-iframe');
  } else {
    main.classList.remove('con-iframe');
    main.innerHTML = h ? vistaPlanificada(h) : vistaInicio();
    main.scrollTop = 0;
  }

  // Solo se recuerdan las herramientas que ya funcionan (y el inicio).
  try {
    if (!h || disponible(h)) localStorage.setItem(CLAVE_ULTIMA, destino);
  } catch (e) {
    console.warn('No se pudo recordar la última herramienta abierta:', e);
  }
  cerrarMenuMovil();
}

// ---------- Menú en celular ----------

function abrirMenuMovil() {
  document.body.classList.add('menu-abierto');
  $('btnMenu').setAttribute('aria-expanded', 'true');
  const activo = document.querySelector('.nav-item.activo') || document.querySelector('.nav-item');
  if (activo) activo.focus();
}

function cerrarMenuMovil() {
  if (!document.body.classList.contains('menu-abierto')) return;
  document.body.classList.remove('menu-abierto');
  $('btnMenu').setAttribute('aria-expanded', 'false');
}

// ---------- Inicio ----------

(function init() {
  renderMenu();

  $('buscarHerramienta').addEventListener('input', e => filtrarMenu(e.target.value));
  $('btnMenu').addEventListener('click', () =>
    document.body.classList.contains('menu-abierto') ? cerrarMenuMovil() : abrirMenuMovil());
  $('fondoMenu').addEventListener('click', cerrarMenuMovil);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenuMovil(); });

  // Hacer clic en la herramienta que ya está abierta también cierra el menú.
  $('menu').addEventListener('click', e => { if (e.target.closest('.nav-item')) cerrarMenuMovil(); });

  window.addEventListener('hashchange', () => mostrar(location.hash.slice(1)));

  let ultima = null;
  try {
    ultima = localStorage.getItem(CLAVE_ULTIMA);
  } catch (e) { /* no pasa nada si falla */ }

  const desdeURL = location.hash.slice(1);
  const existe = id => id === INICIO || !!buscarHerramienta(id);
  const primera = (TODAS.find(disponible) || {}).id || INICIO;
  const inicial = existe(desdeURL) ? desdeURL : (existe(ultima) ? ultima : primera);
  if (location.hash.slice(1) !== inicial) history.replaceState(null, '', '#' + inicial);
  mostrar(inicial);
})();
