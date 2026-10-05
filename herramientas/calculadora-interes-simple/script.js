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
      // Migración: los registros antiguos no tienen interesDiario.
      // Se reconstruye como interés total / plazo (24 días si el
      // registro no guarda el plazo), sin tocar el resto de sus datos.
      if (typeof r.interesDiario !== 'number') {
        const interesTotal = r.interes1 + (r.interes2 || 0);
        const plazo = (typeof r.plazoDias === 'number' && r.plazoDias > 0) ? r.plazoDias : 24;
        r.interesDiario = interesTotal / plazo;
        huboMigracion = true;
      }
      // Migración: los registros antiguos no tienen los días de cada tramo.
      // Se reconstruyen como interes1 / interesDiario (y interes2 / interesDiario),
      // que por interés simple es exactamente el número de días de cada tramo.
      if (typeof r.diasTramo1 !== 'number') {
        r.diasTramo1 = r.interesDiario > 0 ? Math.round(r.interes1 / r.interesDiario) : 24;
        huboMigracion = true;
      }
      if (typeof r.diasTramo2 !== 'number') {
        r.diasTramo2 = (r.interes2 != null && r.interesDiario > 0)
          ? Math.round(r.interes2 / r.interesDiario) : 0;
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

// ---------- Días de pago por contrato ----------
// Reconstruye la lista de días de pago de un registro a partir de los
// datos ya guardados (fechaInicioISO, diasTramo1 + diasTramo2 e
// interesDiario), así no hace falta guardar los 24 días en localStorage.
// Cada día consume un N° de contrato correlativo: si el préstamo empieza
// con el 257, sus días van del 257 al 257 + plazo - 1.
function construirDiasPago(r) {
  const dias = [];
  const plazo = (r.diasTramo1 || 0) + (r.diasTramo2 || 0) || 24;
  const capitalDia = r.capital / plazo;
  const [y, m, d] = r.fechaInicioISO.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  for (let i = 1; i <= plazo; i++) {
    dias.push({
      numeroContrato: r.numeroContrato + (i - 1),
      n: i,
      fecha: fechaCorta(fecha),
      sinInteres: capitalDia,
      conInteres: capitalDia + r.interesDiario,
      interes: r.interesDiario,
      acumulado: r.interesDiario * i
    });
    fecha.setDate(fecha.getDate() + 1);
  }
  return dias;
}

function toggleDiasPago(id, btn) {
  const existente = document.getElementById('dias-' + id);
  if (existente) {
    existente.remove();
    btn.querySelector('i').className = 'fas fa-chevron-right';
    return;
  }
  const r = leerLedger().find(x => x.id === id);
  if (!r) return;
  const dias = construirDiasPago(r);
  const tr = document.createElement('tr');
  tr.id = 'dias-' + id;
  tr.className = 'dias-row';
  tr.innerHTML = `
    <td colspan="16">
      <div class="dias-scroll">
        <table class="dias-table">
          <thead>
            <tr><th>N° Contrato</th><th>Día</th><th>Fecha</th><th class="num">Sin interés</th><th class="num">Con interés</th><th class="num">Interés del día</th><th class="num">Interés acumulado</th></tr>
          </thead>
          <tbody>
            ${dias.map(d => `<tr><td class="col-nro">${d.numeroContrato}</td><td>${d.n}</td><td>${d.fecha}</td><td class="num">${fmt(d.sinInteres)}</td><td class="num">${fmt(d.conInteres)}</td><td class="num">${fmt(d.interes)}</td><td class="num">${fmt(d.acumulado)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </td>`;
  btn.closest('tr').after(tr);
  btn.querySelector('i').className = 'fas fa-chevron-down';
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
        <td class="col-nro">${r.diasTramo1}</td>
        <td>${r.fechaFactura1}</td>
        <td class="num">${fmt(r.capital)}</td>
        <td class="num">${fmt(r.interesDiario)}</td>
        <td class="num">${fmt(r.interes1)}</td>
        <td class="num">${fmt(r.impuesto1)}</td>
        <td class="col-nro">${r.diasTramo2 || '-'}</td>
        <td>${r.fechaFactura2 || '-'}</td>
        <td class="num">${r.interes2 != null ? fmt(r.interes2) : '-'}</td>
        <td class="num">${r.impuesto2 != null ? fmt(r.impuesto2) : '-'}</td>
        <td class="num">${fmt(r.interes1 + (r.interes2 || 0))}</td>
        <td class="num">${fmt(r.impuesto1 + (r.impuesto2 || 0))}</td>
        <td class="center"><button class="ledger-toggle" onclick="toggleDiasPago(${r.id}, this)" aria-label="Ver días de pago" title="Ver días de pago"><i class="fas fa-chevron-right"></i> Ver</button></td>
        <td class="center"><button class="ledger-delete" onclick="eliminarDelLedger(${r.id})" aria-label="Eliminar registro"><i class="fas fa-trash"></i></button></td>
      </tr>`;
  }).join('');

  cont.innerHTML = `
    <div class="table-wrap">
      <table class="ledger-table">
        <thead>
          <tr>
            <th class="center" title="Número de fila en la tabla">N°</th>
            <th class="center" title="Número de contrato (correlativo permanente)">N° Contrato</th>
            <th class="center" title="Días de interés del primer mes">Días M1</th>
            <th title="Fecha factura 1">Fecha F1</th>
            <th class="num" title="Monto prestado">Monto</th>
            <th class="num" title="Interés diario (monto × tasa diaria)">Int. diario</th>
            <th class="num" title="Interés 1">Int. 1</th>
            <th class="num" title="Impuesto 1">Imp. 1</th>
            <th class="center" title="Días de interés del segundo tramo">Días M2</th>
            <th title="Fecha factura 2">Fecha F2</th>
            <th class="num" title="Interés 2">Int. 2</th>
            <th class="num" title="Impuesto 2">Imp. 2</th>
            <th class="num" title="Interés total">Int. total</th>
            <th class="num" title="Impuesto total">Imp. total</th>
            <th class="center" title="Ver los días de pago de este contrato">Ver</th>
            <th class="center" title="Quitar registro">Quitar</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
        <tfoot>
          <tr>
            <td class="center">Σ</td>
            <td class="center"></td>
            <td class="center"></td>
            <td>Totales</td>
            <td class="num">${fmt(totalMonto)}</td>
            <td></td>
            <td class="num">${fmt(totalInt1)}</td>
            <td class="num">${fmt(totalImp1)}</td>
            <td class="center"></td>
            <td></td>
            <td class="num">${fmt(totalInt2)}</td>
            <td class="num">${fmt(totalImp2)}</td>
            <td class="num">${fmt(totalIntGen)}</td>
            <td class="num">${fmt(totalImpGen)}</td>
            <td class="center"></td>
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

function exportarExcel() {
  const lista = leerLedger().slice().sort((a, b) => a.fechaInicioISO.localeCompare(b.fechaInicioISO));
  if (!lista.length) {
    alert('No hay registros en el tablero para exportar.');
    return;
  }
  if (typeof XLSX === 'undefined') {
    alert('No se pudo cargar la librería de Excel. Revisa tu conexión a internet e intenta de nuevo.');
    return;
  }

  const red = n => Math.round(n * 100) / 100;

  const encabezado = [
    'N°', 'N° Contrato', 'Días mes 1', 'Fecha factura 1', 'Monto', 'Interés diario',
    'Interés 1', 'Impuesto 1', 'Días mes 2', 'Fecha factura 2', 'Interés 2', 'Impuesto 2',
    'Interés total', 'Impuesto total'
  ];

  let totalMonto = 0, totalInt1 = 0, totalImp1 = 0, totalInt2 = 0, totalImp2 = 0, totalIntGen = 0, totalImpGen = 0;

  const filas = lista.map((r, idx) => {
    totalMonto += r.capital;
    totalInt1 += r.interes1;
    totalImp1 += r.impuesto1;
    totalInt2 += r.interes2 || 0;
    totalImp2 += r.impuesto2 || 0;
    totalIntGen += r.interes1 + (r.interes2 || 0);
    totalImpGen += r.impuesto1 + (r.impuesto2 || 0);

    return [
      idx + 1,
      r.numeroContrato,
      r.diasTramo1,
      r.fechaFactura1,
      red(r.capital),
      red(r.interesDiario),
      red(r.interes1),
      red(r.impuesto1),
      r.diasTramo2 || '',
      r.fechaFactura2 || '-',
      r.interes2 != null ? red(r.interes2) : '-',
      r.impuesto2 != null ? red(r.impuesto2) : '-',
      red(r.interes1 + (r.interes2 || 0)),
      red(r.impuesto1 + (r.impuesto2 || 0))
    ];
  });

  const filaTotales = [
    'Σ', '', '', 'Totales',
    red(totalMonto), '', red(totalInt1), red(totalImp1),
    '', '', red(totalInt2), red(totalImp2),
    red(totalIntGen), red(totalImpGen)
  ];

  const ws = XLSX.utils.aoa_to_sheet([encabezado, ...filas, filaTotales]);
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 9 }, { wch: 16 }, { wch: 12 }, { wch: 13 },
    { wch: 11 }, { wch: 11 }, { wch: 9 }, { wch: 16 }, { wch: 11 }, { wch: 11 },
    { wch: 13 }, { wch: 13 }
  ];

  // Hoja 2: detalle de los días de pago de todos los contratos.
  const encabezadoDias = ['N° Contrato', 'Día', 'Fecha', 'Sin interés', 'Con interés', 'Interés del día', 'Interés acumulado'];
  const filasDias = [];
  lista.forEach(r => {
    construirDiasPago(r).forEach(d => {
      filasDias.push([d.numeroContrato, d.n, d.fecha, red(d.sinInteres), red(d.conInteres), red(d.interes), red(d.acumulado)]);
    });
  });
  const wsDias = XLSX.utils.aoa_to_sheet([encabezadoDias, ...filasDias]);
  wsDias['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 17 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tablero');
  XLSX.utils.book_append_sheet(wb, wsDias, 'Días de pago');

  const hoy = new Date();
  const iso = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  XLSX.writeFile(wb, `tablero-interes-simple-${iso}.xlsx`);
}

// ---------- Cálculo principal ----------
function calcular() {
  const capitalInput = document.getElementById('capital').value;
  const fechaInicioStr = document.getElementById('fechaInicio').value;
  const tasaInput = document.getElementById('tasa').value;
  const plazoInput = document.getElementById('plazo').value;
  const impuestoInput = document.getElementById('impuesto').value;
  const contratoInput = document.getElementById('numeroContrato').value.trim();

  if (!capitalInput || !fechaInicioStr || !tasaInput || !plazoInput || !impuestoInput) {
    alert('Por favor completa todos los campos.');
    return;
  }

  // --- N° de contrato: lo pone el usuario; si lo deja vacío, sigue el correlativo ---
  let numeroContrato;
  if (contratoInput === '') {
    numeroContrato = siguienteNumeroContrato();
  } else {
    numeroContrato = parseInt(contratoInput, 10);
    if (!Number.isFinite(numeroContrato) || numeroContrato <= 0) {
      alert('El N° de contrato debe ser un número entero mayor a cero.');
      return;
    }
    if (leerLedger().some(r => r.numeroContrato === numeroContrato)) {
      alert('El N° de contrato ' + numeroContrato + ' ya está en el tablero. Usa otro número.');
      return;
    }
  }

  const capital = parseFloat(capitalInput);
  const tasaTotal = parseFloat(tasaInput) / 100;
  const plazoDias = parseInt(plazoInput, 10);
  const impuestoPct = parseFloat(impuestoInput) / 100;

  if (capital <= 0 || plazoDias <= 0) {
    alert('Revisa que el monto y el plazo sean mayores a cero.');
    return;
  }

  // Los N° de contrato se consumen uno por día: un préstamo de N días que
  // empieza en X usa los números X a X+N-1, y el correlativo continúa en X+N.
  const ultimoNumeroUsado = numeroContrato + plazoDias - 1;
  if (ultimoNumeroUsado > leerContador()) {
    guardarContador(ultimoNumeroUsado);
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

  // Factura 1: se cobra al terminar los días de interés del primer mes
  // (fecha de inicio + días del tramo 1 - 1).
  const f1 = new Date(fechaInicioObj);
  f1.setDate(f1.getDate() + tramo1.dias - 1);
  const fechaFactura1 = fechaCorta(f1);

  let fechaFactura2 = null, interes2 = null, impuesto2 = null, diasTramo2 = 0;
  if (grupos.length > 1) {
    diasTramo2 = grupos.slice(1).reduce((acc, g) => acc + g.dias, 0);
    interes2 = capital * tasaDiaria * diasTramo2;
    impuesto2 = interes2 * impuestoPct;
    // Factura 2: se cobra el último día con interés de todo el préstamo.
    fechaFactura2 = fechaCorta(ultimoDia);
  }

  agregarAlLedger({
    id: Date.now() + Math.floor(Math.random() * 1000),
    numeroContrato: numeroContrato,
    fechaInicioISO: fechaInicioStr,
    fechaFactura1: fechaFactura1,
    capital: capital,
    interesDiario: capital * tasaDiaria,
    interes1: interes1,
    impuesto1: impuesto1,
    diasTramo1: tramo1.dias,
    diasTramo2: diasTramo2,
    fechaFactura2: fechaFactura2,
    interes2: interes2,
    impuesto2: impuesto2
  });
  renderLedger();

  // Sugerir el siguiente correlativo para el próximo préstamo.
  document.getElementById('numeroContrato').value = leerContador() + 1;
}

// ---------- Inicialización ----------
(function initDefaultDate() {
  const today = new Date();
  const iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  document.getElementById('fechaInicio').value = iso;
  // Sugerir el siguiente N° de contrato correlativo (editable por el usuario).
  // leerLedger() corre primero para migrar registros antiguos y así
  // asegurar que la sugerencia no choque con un número ya usado.
  leerLedger();
  document.getElementById('numeroContrato').value = leerContador() + 1;
})();

renderLedger();
