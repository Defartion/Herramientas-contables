// ---------- Utilidades de formato ----------
function fmt(n) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function nombreMes(y, m) {
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return meses[m] + ' ' + y;
}

function fechaLegible(d) {
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fechaCorta(d) {
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------- Persistencia del tablero acumulado ----------
const LEDGER_KEY = 'interesSimpleTableroLedger';
const CONTADOR_KEY = 'interesSimpleContratoContador';

function leerContador() {
  try {
    const n = parseInt(localStorage.getItem(CONTADOR_KEY), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch (e) {
    return 0;
  }
}

function guardarContador(n) {
  try {
    localStorage.setItem(CONTADOR_KEY, String(n));
  } catch (e) {
    console.warn('No se pudo guardar el contador de contratos:', e);
  }
}

function siguienteNumeroContrato() {
  const n = leerContador() + 1;
  guardarContador(n);
  return n;
}

function leerLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    const lista = raw ? JSON.parse(raw) : [];

    // Migración: los registros antiguos no tienen numeroContrato.
    // Se les asigna uno nuevo la primera vez que se leen, sin tocar
    // el resto de sus datos, y se persiste el resultado.
    let contador = Math.max(leerContador(), lista.reduce((max, r) =>
      (typeof r.numeroContrato === 'number' && r.numeroContrato > max) ? r.numeroContrato : max, 0));
    let huboMigracion = false;
    lista.forEach(r => {
      if (typeof r.numeroContrato !== 'number') {
        contador += 1;
        r.numeroContrato = contador;
        huboMigracion = true;
      }
    });
    if (huboMigracion) {
      guardarContador(contador);
      guardarLedger(lista);
    }

    return lista;
  } catch (e) {
    console.warn('No se pudo leer el tablero:', e);
    return [];
  }
}

function guardarLedger(lista) {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(lista));
  } catch (e) {
    console.warn('No se pudo guardar el tablero:', e);
  }
}

function agregarAlLedger(registro) {
  const lista = leerLedger();
  lista.push(registro);
  guardarLedger(lista);
}

function eliminarDelLedger(id) {
  const lista = leerLedger().filter(r => r.id !== id);
  guardarLedger(lista);
  renderLedger();
}

function vaciarLedger() {
  guardarLedger([]);
  renderLedger();
}

function renderLedger() {
  const lista = leerLedger().slice().sort((a, b) => a.fechaInicioISO.localeCompare(b.fechaInicioISO));
  const cont = document.getElementById('ledgerContenedor');

  if (!lista.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        Todavía no hay registros en el tablero.
      </div>`;
    return;
  }

  let totalMonto = 0, totalInt1 = 0, totalImp1 = 0, totalInt2 = 0, totalImp2 = 0, totalIntGen = 0, totalImpGen = 0;

  const filas = lista.map((r, idx) => {
    totalMonto += r.capital;
    totalInt1 += r.interes1;
    totalImp1 += r.impuesto1;
    totalInt2 += r.interes2 || 0;
    totalImp2 += r.impuesto2 || 0;
    totalIntGen += r.interes1 + (r.interes2 || 0);
    totalImpGen += r.impuesto1 + (r.impuesto2 || 0);

    return `
      <tr>
        <td class="col-nro">${idx + 1}</td>
        <td class="col-nro">${r.numeroContrato}</td>
        <td>${r.fechaFactura1}</td>
        <td class="num">${fmt(r.capital)}</td>
        <td class="num">${fmt(r.interes1)}</td>
        <td class="num">${fmt(r.impuesto1)}</td>
        <td>${r.fechaFactura2 || '-'}</td>
        <td class="num">${r.interes2 != null ? fmt(r.interes2) : '-'}</td>
        <td class="num">${r.impuesto2 != null ? fmt(r.impuesto2) : '-'}</td>
        <td class="num">${fmt(r.interes1 + (r.interes2 || 0))}</td>
        <td class="num">${fmt(r.impuesto1 + (r.impuesto2 || 0))}</td>
        <td class="center"><button class="ledger-delete" onclick="eliminarDelLedger(${r.id})" aria-label="Eliminar registro"><i class="fas fa-trash"></i></button></td>
      </tr>`;
  }).join('');

  cont.innerHTML = `
    <div class="table-wrap">
      <table class="ledger-table">
        <thead>
          <tr>
            <th class="center">N°</th>
            <th class="center">N° Contrato</th>
            <th>Fecha factura 1</th>
            <th class="num">Monto</th>
            <th class="num">Interés 1</th>
            <th class="num">Impuesto 1</th>
            <th>Fecha factura 2</th>
            <th class="num">Interés 2</th>
            <th class="num">Impuesto 2</th>
            <th class="num">Interés total</th>
            <th class="num">Impuesto total</th>
            <th class="center">Quitar</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
        <tfoot>
          <tr>
            <td class="center">Σ</td>
            <td class="center"></td>
            <td>Totales</td>
            <td class="num">${fmt(totalMonto)}</td>
            <td class="num">${fmt(totalInt1)}</td>
            <td class="num">${fmt(totalImp1)}</td>
            <td></td>
            <td class="num">${fmt(totalInt2)}</td>
            <td class="num">${fmt(totalImp2)}</td>
            <td class="num">${fmt(totalIntGen)}</td>
            <td class="num">${fmt(totalImpGen)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <button class="clear-all-btn" onclick="vaciarLedger()"><i class="fas fa-trash-can"></i> Vaciar tablero</button>
  `;
}

function irAlTablero() {
  document.getElementById('tablero').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Cálculo principal ----------
function calcular() {
  const capitalInput = document.getElementById('capital').value;
  const fechaInicioStr = document.getElementById('fechaInicio').value;
  const tasaInput = document.getElementById('tasa').value;
  const plazoInput = document.getElementById('plazo').value;
  const impuestoInput = document.getElementById('impuesto').value;

  if (!capitalInput || !fechaInicioStr || !tasaInput || !plazoInput || !impuestoInput) {
    alert('Por favor completa todos los campos.');
    return;
  }

  const capital = parseFloat(capitalInput);
  const tasaTotal = parseFloat(tasaInput) / 100;
  const plazoDias = parseInt(plazoInput, 10);
  const impuestoPct = parseFloat(impuestoInput) / 100;

  if (capital <= 0 || plazoDias <= 0) {
    alert('Revisa que el monto y el plazo sean mayores a cero.');
    return;
  }

  const tasaDiaria = tasaTotal / plazoDias;

  const [y, m, d] = fechaInicioStr.split('-').map(Number);
  let cursor = new Date(y, m - 1, d);
  const fechaInicioObj = new Date(y, m - 1, d);

  const grupos = [];
  let ultimoDia = new Date(cursor);

  for (let i = 0; i < plazoDias; i++) {
    const yy = cursor.getFullYear();
    const mm = cursor.getMonth();
    let grupo = grupos.find(g => g.year === yy && g.month === mm);
    if (!grupo) {
      grupo = { year: yy, month: mm, dias: 0 };
      grupos.push(grupo);
    }
    grupo.dias += 1;
    ultimoDia = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }

  // --- Desglose visual por mes (tarjeta de resultados) ---
  const tbody = document.getElementById('tablaBody');
  tbody.innerHTML = '';
  let interesTotal = 0;

  grupos.forEach((g, idx) => {
    const interesGrupo = capital * tasaDiaria * g.dias;
    interesTotal += interesGrupo;
    const tr = document.createElement('tr');
    const etiqueta = grupos.length > 1
      ? (idx === 0 ? `${nombreMes(g.year, g.month)} <span class="pill">inicio</span>` : `${nombreMes(g.year, g.month)} <span class="pill warn-pill">cruce</span>`)
      : nombreMes(g.year, g.month);
    tr.innerHTML = `<td>${etiqueta}</td><td>${g.dias}</td><td>${fmt(interesGrupo)}</td>`;
    tbody.appendChild(tr);
  });

  const notaEl = document.getElementById('cruceNota');
  if (grupos.length > 1) {
    notaEl.classList.remove('hidden');
    document.getElementById('cruceNotaTexto').textContent =
      `El préstamo inicia en ${nombreMes(grupos[0].year, grupos[0].month)} con ${grupos[0].dias} día(s) de interés en ese mes. Como no completa los ${plazoDias} días dentro del mes, los ${plazoDias - grupos[0].dias} día(s) restantes se calculan en el mes siguiente hasta completar el plazo.`;
  } else {
    notaEl.classList.add('hidden');
  }

  const impuestoTotal = interesTotal * impuestoPct;
  const interesNeto = interesTotal - impuestoTotal;
  const totalPagar = capital + interesTotal;

  document.getElementById('tasaDiaria').textContent = (tasaDiaria * 100).toLocaleString('es-PE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + '%';
  document.getElementById('fechaFin').textContent = fechaLegible(ultimoDia);
  document.getElementById('interesTotal').textContent = fmt(interesTotal);
  document.getElementById('impPctLbl').textContent = (impuestoPct * 100).toLocaleString('es-PE');
  document.getElementById('impuestoTotal').textContent = fmt(impuestoTotal);
  document.getElementById('interesNeto').textContent = fmt(interesNeto);
  document.getElementById('totalPagar').textContent = fmt(totalPagar);

  document.getElementById('resultados').classList.remove('hidden');
  document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // --- Construir registro para el tablero acumulado (factura 1 y, si aplica, factura 2) ---
  const tramo1 = grupos[0];
  const interes1 = capital * tasaDiaria * tramo1.dias;
  const impuesto1 = interes1 * impuestoPct;

  let fechaFactura2 = null, interes2 = null, impuesto2 = null;
  if (grupos.length > 1) {
    const diasTramo2 = grupos.slice(1).reduce((acc, g) => acc + g.dias, 0);
    interes2 = capital * tasaDiaria * diasTramo2;
    impuesto2 = interes2 * impuestoPct;
    const segundo = grupos[1];
    fechaFactura2 = fechaCorta(new Date(segundo.year, segundo.month, 1));
  }

  agregarAlLedger({
    id: Date.now() + Math.floor(Math.random() * 1000),
    fechaInicioISO: fechaInicioStr,
    fechaFactura1: fechaCorta(fechaInicioObj),
    capital: capital,
    interes1: interes1,
    impuesto1: impuesto1,
    fechaFactura2: fechaFactura2,
    interes2: interes2,
    impuesto2: impuesto2
  });
  renderLedger();
}

// ---------- Inicialización ----------
(function initDefaultDate() {
  const today = new Date();
  const iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  document.getElementById('fechaInicio').value = iso;
})();

renderLedger();
