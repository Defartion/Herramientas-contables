// ---------------------------------------------------------------
// Lista de herramientas disponibles.
// Para agregar una nueva herramienta (ver docs/agregar-herramienta.md):
//   1. Crea su carpeta en herramientas/<nombre>/ con su propio
//      index.html, style.css y script(s).
//   2. Agrega un objeto aquí con id, nombre, icono (clase de
//      Font Awesome) y ruta (al index.html de esa carpeta).
// No necesitas tocar nada más: el menú se genera solo.
// ---------------------------------------------------------------
const HERRAMIENTAS = [
  {
    id: 'interes-simple',
    nombre: 'Interés Simple',
    icono: 'fa-calculator',
    ruta: 'herramientas/calculadora-interes-simple/index.html'
  }
  // Ejemplo de cómo se vería una segunda herramienta:
  // {
  //   id: 'conversor-moneda',
  //   nombre: 'Conversor de Moneda',
  //   icono: 'fa-money-bill-transfer',
  //   ruta: 'herramientas/conversor-moneda/index.html'
  // }
];

// No cambiar: aquí se recuerda la última herramienta abierta.
const CLAVE_ULTIMA = 'hubUltimaHerramienta';

function renderTabs() {
  const nav = document.getElementById('tabs');
  nav.innerHTML = '';
  HERRAMIENTAS.forEach(h => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn';
    btn.id = 'tab-' + h.id;
    btn.dataset.id = h.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'main');
    btn.innerHTML = `<i class="fas ${h.icono}" aria-hidden="true"></i> <span></span>`;
    btn.querySelector('span').textContent = h.nombre;
    btn.addEventListener('click', () => seleccionarHerramienta(h.id, true));
    nav.appendChild(btn);
  });

  // Flechas izquierda/derecha para moverse entre pestañas.
  nav.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const botones = Array.from(nav.querySelectorAll('.tab-btn'));
    const i = botones.indexOf(document.activeElement);
    if (i === -1) return;
    const siguiente = botones[(i + (e.key === 'ArrowRight' ? 1 : -1) + botones.length) % botones.length];
    siguiente.focus();
    seleccionarHerramienta(siguiente.dataset.id, true);
  });
}

function seleccionarHerramienta(id, actualizarURL) {
  const herramienta = HERRAMIENTAS.find(h => h.id === id);
  if (!herramienta) return;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const activa = btn.dataset.id === id;
    btn.classList.toggle('active', activa);
    btn.setAttribute('aria-selected', String(activa));
    btn.tabIndex = activa ? 0 : -1;
  });

  const main = document.getElementById('main');
  main.setAttribute('role', 'tabpanel');
  main.setAttribute('aria-labelledby', 'tab-' + id);
  const actual = document.getElementById('toolFrame');
  if (!actual || actual.dataset.id !== id) {
    main.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'frame-wrap';
    const iframe = document.createElement('iframe');
    iframe.id = 'toolFrame';
    iframe.dataset.id = id;
    iframe.src = herramienta.ruta;
    iframe.title = herramienta.nombre;
    wrap.appendChild(iframe);
    main.appendChild(wrap);
  }
  document.title = herramienta.nombre + ' · Herramientas Contables';

  // Enlace directo a la herramienta (por ejemplo .../#interes-simple).
  if (actualizarURL && location.hash !== '#' + id) {
    history.replaceState(null, '', '#' + id);
  }

  try {
    localStorage.setItem(CLAVE_ULTIMA, id);
  } catch (e) {
    console.warn('No se pudo recordar la última herramienta abierta:', e);
  }
}

(function init() {
  renderTabs();

  if (!HERRAMIENTAS.length) {
    document.getElementById('main').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-toolbox" aria-hidden="true"></i>
        <p>Todavía no hay herramientas agregadas.</p>
      </div>`;
    return;
  }

  let ultima = null;
  try {
    ultima = localStorage.getItem(CLAVE_ULTIMA);
  } catch (e) { /* no pasa nada si falla */ }

  const desdeURL = location.hash.slice(1);
  const existe = id => HERRAMIENTAS.some(h => h.id === id);
  const idInicial = existe(desdeURL) ? desdeURL : (existe(ultima) ? ultima : HERRAMIENTAS[0].id);
  seleccionarHerramienta(idInicial, false);

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (existe(id)) seleccionarHerramienta(id, false);
  });
})();
