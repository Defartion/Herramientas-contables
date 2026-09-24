// ---------------------------------------------------------------
// Lista de herramientas disponibles.
// Para agregar una nueva herramienta en el futuro:
//   1. Crea su carpeta en herramientas/<nombre>/ con su propio
//      index.html, style.css y script.js.
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

function renderTabs() {
  const nav = document.getElementById('tabs');
  nav.innerHTML = HERRAMIENTAS.map(h => `
    <button class="tab-btn" data-id="${h.id}" onclick="seleccionarHerramienta('${h.id}')">
      <i class="fas ${h.icono}"></i> ${h.nombre}
    </button>
  `).join('');
}

function seleccionarHerramienta(id) {
  const herramienta = HERRAMIENTAS.find(h => h.id === id);
  if (!herramienta) return;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === id);
  });

  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="frame-wrap">
      <iframe id="toolFrame" src="${herramienta.ruta}" title="${herramienta.nombre}"></iframe>
    </div>
  `;

  try {
    localStorage.setItem('hubUltimaHerramienta', id);
  } catch (e) {
    console.warn('No se pudo recordar la última herramienta abierta:', e);
  }
}

(function init() {
  renderTabs();

  if (!HERRAMIENTAS.length) {
    document.getElementById('main').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-toolbox"></i>
        <p>Todavía no hay herramientas agregadas.</p>
      </div>`;
    return;
  }

  let ultima = null;
  try {
    ultima = localStorage.getItem('hubUltimaHerramienta');
  } catch (e) { /* no pasa nada si falla */ }

  const idInicial = HERRAMIENTAS.some(h => h.id === ultima) ? ultima : HERRAMIENTAS[0].id;
  seleccionarHerramienta(idInicial);
})();
