(function () {
  'use strict';
  const C = window.FlujoCaja;
  const $ = HC.$;
  const CLAVE = 'hc:flujo-caja:filas';

  const PREDETERMINADO = {
    ingresos: ['Ventas al contado', 'Cobranza de ventas al crédito', 'Préstamos recibidos', 'Otros ingresos'],
    egresos: ['Compras de mercadería e insumos', 'Sueldos y cargas sociales', 'Alquiler', 'Servicios (luz, agua, internet)',
      'Impuestos (IGV y renta)', 'Pago de préstamos', 'Otros gastos']
  };
  const nuevo = () => ({
    ingresos: PREDETERMINADO.ingresos.map(c => ({ concepto: c, valores: [] })),
    egresos: PREDETERMINADO.egresos.map(c => ({ concepto: c, valores: [] }))
  });

  let datos = HC.leerJSON(CLAVE, null);
  if (!datos || !Array.isArray(datos.ingresos) || !Array.isArray(datos.egresos)) datos = nuevo();
  const guardar = () => HC.guardarJSON(CLAVE, datos);

  const f = HC.formulario('form', [
    { id: 'inicio', etiqueta: 'Mes inicial', tipo: 'mes', valor: 'mes-actual' },
    { grupo: [
      { id: 'n', etiqueta: 'Número de meses', tipo: 'entero', valor: 12, min: 1, max: 24 },
      { id: 'saldoInicial', etiqueta: 'Saldo inicial de caja', tipo: 'dinero', valor: 0 }
    ] }
  ], { clave: 'flujo-caja' });

  let config = { n: 12, inicio: '', saldoInicial: 0 };
  let meses = [];
  let ultimo = null;

  const numero = v => (v === '' || v == null ? '' : v);
  const celdaMonto = (tipo, i, m, v) =>
    `<td><input type="number" step="0.01" inputmode="decimal" data-tipo="${tipo}" data-i="${i}" data-m="${m}" value="${numero(v)}" aria-label="Monto"></td>`;

  function filasSeccion(tipo) {
    return datos[tipo].map((fila, i) => `
      <tr>
        <td class="fija"><input type="text" class="col-concepto" data-tipo="${tipo}" data-i="${i}" data-campo="concepto" value="${HC.esc(fila.concepto)}" aria-label="Concepto"></td>
        ${meses.map((_, m) => celdaMonto(tipo, i, m, fila.valores[m])).join('')}
        <td class="num" id="tot-${tipo}-${i}"></td>
        <td class="center" style="white-space:nowrap">
          <button type="button" class="icon-btn" data-accion="repetir" data-tipo="${tipo}" data-i="${i}" title="Copiar el monto del primer mes a todos los meses" aria-label="Repetir el primer mes"><i class="fas fa-arrow-right-long" aria-hidden="true"></i></button>
          <button type="button" class="icon-btn danger" data-accion="eliminar" data-tipo="${tipo}" data-i="${i}" title="Quitar fila" aria-label="Quitar fila"><i class="fas fa-trash" aria-hidden="true"></i></button>
        </td>
      </tr>`).join('');
  }

  const filaTotal = (titulo, prefijo, clase) =>
    `<tr class="${clase || 'subtotal'}"><td class="fija">${titulo}</td>${meses.map((_, m) => `<td class="num" id="${prefijo}-${m}"></td>`).join('')}<td class="num" id="${prefijo}-t"></td><td></td></tr>`;

  const filaAgregar = (tipo, texto) =>
    `<tr><td class="fija" colspan="${meses.length + 3}"><button type="button" class="btn btn-sm" data-accion="agregar" data-tipo="${tipo}"><i class="fas fa-plus" aria-hidden="true"></i> ${texto}</button></td></tr>`;

  function construirTabla() {
    meses = C.meses(config.inicio, config.n);
    const encabezado = `<tr><th class="fija">Concepto</th>${meses.map(m => `<th class="num">${m.corto}</th>`).join('')}<th class="num">Total</th><th></th></tr>`;
    const titulo = t => `<tr><td class="fija" colspan="${meses.length + 3}"><strong>${t}</strong></td></tr>`;
    $('detalleContenido').innerHTML = `
      <div class="table-wrap"><table class="tabla tabla-editable">
        <thead>${encabezado}</thead>
        <tbody>
          ${titulo('Ingresos')}${filasSeccion('ingresos')}${filaAgregar('ingresos', 'Agregar ingreso')}${filaTotal('Total ingresos', 'ti')}
          ${titulo('Egresos')}${filasSeccion('egresos')}${filaAgregar('egresos', 'Agregar egreso')}${filaTotal('Total egresos', 'te')}
          ${filaTotal('Flujo neto del mes', 'fn')}
          ${filaTotal('Saldo inicial', 'si', '')}
          ${filaTotal('Saldo final', 'sf')}
        </tbody>
      </table></div>
      <p class="hint">Escribe los montos sin signo. La flecha copia el monto del primer mes a todos los meses. Los datos se guardan en este navegador.</p>`;
    $('detalle').hidden = false;
    actualizar();
  }

  function poner(id, valor, negativo) {
    const el = $(id);
    if (!el) return;
    el.textContent = HC.numero(valor);
    el.classList.toggle('negativo', !!negativo);
  }

  function actualizar() {
    const r = C.calcular({ saldoInicial: config.saldoInicial, n: config.n, ingresos: datos.ingresos, egresos: datos.egresos });
    ultimo = r;
    r.totalesIngresos.forEach((t, i) => poner(`tot-ingresos-${i}`, t));
    r.totalesEgresos.forEach((t, i) => poner(`tot-egresos-${i}`, t));
    meses.forEach((_, m) => {
      poner(`ti-${m}`, r.totalIngresos[m]);
      poner(`te-${m}`, r.totalEgresos[m]);
      poner(`fn-${m}`, r.neto[m], r.neto[m] < 0);
      poner(`si-${m}`, r.saldoInicialMes[m], r.saldoInicialMes[m] < 0);
      poner(`sf-${m}`, r.saldoFinal[m], r.saldoFinal[m] < 0);
    });
    poner('ti-t', r.sumaIngresos);
    poner('te-t', r.sumaEgresos);
    poner('fn-t', r.sumaNeto, r.sumaNeto < 0);
    poner('si-t', config.saldoInicial);
    poner('sf-t', r.saldoFinalPeriodo, r.saldoFinalPeriodo < 0);

    const nombresNeg = r.negativos.map(m => meses[m].corto);
    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'Ingresos del periodo', valor: HC.dinero(r.sumaIngresos) },
        { etiqueta: 'Egresos del periodo', valor: HC.dinero(r.sumaEgresos) },
        { etiqueta: 'Saldo final', valor: HC.dinero(r.saldoFinalPeriodo), acento: true, nota: meses.length ? 'Al cierre de ' + meses[meses.length - 1].corto : '' }
      ]) +
      HC.lineas([
        { etiqueta: 'Saldo inicial', valor: HC.dinero(config.saldoInicial) },
        { etiqueta: 'Flujo neto del periodo', valor: HC.dinero(r.sumaNeto), claseValor: r.sumaNeto < 0 ? 'negativo' : '' },
        { etiqueta: 'Saldo más bajo', valor: HC.dinero(r.saldoMinimo), detalle: meses[r.mesSaldoMinimo] ? 'En ' + meses[r.mesSaldoMinimo].corto : '',
          claseValor: r.saldoMinimo < 0 ? 'negativo' : '' }
      ]) +
      (r.sumaIngresos === 0 && r.sumaEgresos === 0
        ? HC.nota('Llena los montos de cada mes en la tabla de abajo.')
        : nombresNeg.length
          ? HC.nota(`La caja queda en negativo en ${nombresNeg.length} mes(es): ${nombresNeg.join(', ')}. Necesitarás financiamiento o mover pagos.`, 'warn')
          : HC.nota('La caja no queda en negativo en ningún mes del periodo.', 'ok'));
  }

  // Edición de la tabla (delegación de eventos).
  $('detalleContenido').addEventListener('input', e => {
    const el = e.target;
    if (!el.dataset.tipo) return;
    const fila = datos[el.dataset.tipo][Number(el.dataset.i)];
    if (el.dataset.campo === 'concepto') {
      fila.concepto = el.value;
    } else {
      const m = Number(el.dataset.m);
      fila.valores[m] = el.value === '' ? null : Number(el.value);
      actualizar();
    }
    guardar();
  });

  $('detalleContenido').addEventListener('click', e => {
    const b = e.target.closest('button[data-accion]');
    if (!b) return;
    const tipo = b.dataset.tipo;
    const i = Number(b.dataset.i);
    if (b.dataset.accion === 'agregar') {
      datos[tipo].push({ concepto: '', valores: [] });
      guardar();
      construirTabla();
      const inputs = $('detalleContenido').querySelectorAll(`input[data-tipo="${tipo}"][data-campo="concepto"]`);
      if (inputs.length) inputs[inputs.length - 1].focus();
    } else if (b.dataset.accion === 'eliminar') {
      datos[tipo].splice(i, 1);
      guardar();
      construirTabla();
    } else if (b.dataset.accion === 'repetir') {
      const fila = datos[tipo][i];
      const primero = fila.valores[0];
      for (let m = 0; m < config.n; m++) fila.valores[m] = primero == null ? null : primero;
      guardar();
      construirTabla();
    }
  });

  // Botón para empezar de nuevo.
  const acciones = $('detalle').querySelector('.acciones');
  const vaciar = document.createElement('button');
  vaciar.type = 'button';
  vaciar.className = 'btn btn-danger-ghost';
  vaciar.innerHTML = '<i class="fas fa-eraser" aria-hidden="true"></i> Empezar de nuevo';
  vaciar.addEventListener('click', () => {
    if (!window.confirm('¿Borrar todos los montos y volver a los conceptos iniciales?')) return;
    datos = nuevo();
    guardar();
    construirTabla();
    HC.toast('Se reinició la tabla.');
  });
  acciones.prepend(vaciar);

  f.alCambiar(v => {
    const errs = {};
    if (!Number.isInteger(v.n) || v.n < 1 || v.n > 24) errs.n = 'Entre 1 y 24 meses.';
    if (!/^\d{4}-\d{2}$/.test(v.inicio)) errs.inicio = 'Elige el mes inicial (AAAA-MM).';
    if (!f.errores(errs)) return;
    const saldoInicial = Number.isFinite(v.saldoInicial) ? v.saldoInicial : 0;
    const cambioEstructura = v.n !== config.n || v.inicio !== config.inicio || !meses.length;
    config = { n: v.n, inicio: v.inicio, saldoInicial };
    if (cambioEstructura) construirTabla(); else actualizar();
  });

  HC.excel.conectarBoton('btnExcel', 'flujo-de-caja', () => {
    if (!ultimo) return null;
    const X = HC.excel;
    const r = ultimo;
    const filaMontos = (titulo, valores, total) => [titulo, ...valores.map(x => X.dinero(x)), X.dinero(total)];
    const filasDe = (tipo, totales) => datos[tipo].map((fila, i) =>
      filaMontos(fila.concepto || '(sin nombre)', meses.map((_, m) => Number.isFinite(fila.valores[m]) ? fila.valores[m] : 0), totales[i]));
    return [{
      nombre: 'Flujo de caja',
      anchos: [34, ...meses.map(() => 12), 14],
      filas: [
        ['Flujo de caja proyectado'],
        [],
        ['Concepto', ...meses.map(m => m.corto), 'Total'],
        ['Ingresos'],
        ...filasDe('ingresos', r.totalesIngresos),
        filaMontos('Total ingresos', r.totalIngresos, r.sumaIngresos),
        [],
        ['Egresos'],
        ...filasDe('egresos', r.totalesEgresos),
        filaMontos('Total egresos', r.totalEgresos, r.sumaEgresos),
        [],
        filaMontos('Flujo neto', r.neto, r.sumaNeto),
        ['Saldo inicial', ...r.saldoInicialMes.map(x => X.dinero(x))],
        filaMontos('Saldo final', r.saldoFinal, r.saldoFinalPeriodo)
      ]
    }];
  });
})();
