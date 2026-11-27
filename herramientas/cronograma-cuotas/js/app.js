(function () {
  'use strict';
  const C = window.Cronograma;
  const $ = HC.$;

  const f = HC.formulario('form', [
    { id: 'monto', etiqueta: 'Monto del préstamo', tipo: 'dinero', valor: 10000, min: 0 },
    { grupo: [
      { id: 'tea', etiqueta: 'TEA', tipo: 'pct', valor: 24, ayuda: 'Tasa efectiva anual.' },
      { id: 'cuotas', etiqueta: 'N.° de cuotas (meses)', tipo: 'entero', valor: 12, min: 1 }
    ] },
    { grupo: [
      { id: 'fechaDesembolso', etiqueta: 'Fecha de desembolso', tipo: 'fecha', valor: 'hoy',
        ayuda: 'Las cuotas vencen el mismo día de cada mes.' },
      { id: 'metodo', etiqueta: 'Tipo de cuota', tipo: 'select', valor: 'frances',
        opciones: [['frances', 'Fija (francés)'], ['aleman', 'Decreciente (alemán)']] }
    ] },
    { seccion: 'Opcional' },
    { grupo: [
      { id: 'gracia', etiqueta: 'Meses de gracia', tipo: 'entero', valor: 0, min: 0, ayuda: 'Solo se pagan intereses.' },
      { id: 'seguro', etiqueta: 'Seguro de desgravamen mensual', tipo: 'pct', valor: '', ayuda: 'Sobre el saldo, por ejemplo 0,08 %.' }
    ] },
    { id: 'comision', etiqueta: 'Comisión o gasto fijo por cuota', tipo: 'dinero', valor: '' }
  ], { clave: 'cronograma-cuotas' });

  let ultimo = null;

  f.alCambiar(v => {
    if (!f.errores(C.validar(v))) {
      ultimo = null;
      $('resultado').innerHTML = HC.vacio('Completa los datos para ver el cronograma.', 'fa-calendar-check');
      $('detalle').hidden = true;
      return;
    }
    const r = C.calcular(v);
    ultimo = { r, v };
    const t = r.totales;
    const extras = t.seguro > 0 || t.comision > 0;

    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: v.metodo === 'aleman' ? 'Primera cuota' : 'Cuota mensual', valor: HC.dinero(r.cuotaReferencial), acento: true,
          nota: v.metodo === 'aleman' ? 'Las siguientes bajan cada mes' : (extras ? 'Incluye seguro y comisión del 1.er mes' : '') },
        { etiqueta: 'TEM', valor: HC.pct(r.temPct, 4) },
        { etiqueta: 'TCEA', valor: HC.pct(r.tceaPct), nota: 'Costo efectivo anual' }
      ]) +
      HC.lineas([
        { etiqueta: 'Capital', valor: HC.dinero(t.amortizacion) },
        { etiqueta: 'Intereses', valor: HC.dinero(t.interes) },
        t.seguro > 0 ? { etiqueta: 'Seguro de desgravamen', valor: HC.dinero(t.seguro) } : null,
        t.comision > 0 ? { etiqueta: 'Comisiones', valor: HC.dinero(t.comision) } : null,
        { etiqueta: 'Total a pagar', valor: HC.dinero(t.total), clase: 'big' }
      ]) +
      HC.nota(`Última cuota: ${HC.fecha(r.ultimaFecha)}. Si el día de pago no existe en un mes (por ejemplo 31), la cuota vence el último día de ese mes.`);

    $('detalle').hidden = false;
    $('detalleContenido').innerHTML = HC.tabla({
      columnas: [
        { titulo: 'N.°', campo: 'n', tipo: 'entero' },
        { titulo: 'Vence', campo: 'fecha', tipo: 'fecha' },
        { titulo: 'Saldo inicial', campo: 'saldoInicial', tipo: 'dinero' },
        { titulo: 'Capital', campo: 'amortizacion', tipo: 'dinero' },
        { titulo: 'Interés', campo: 'interes', tipo: 'dinero' },
        ...(t.seguro > 0 ? [{ titulo: 'Seguro', campo: 'seguro', tipo: 'dinero' }] : []),
        ...(t.comision > 0 ? [{ titulo: 'Comisión', campo: 'comision', tipo: 'dinero' }] : []),
        { titulo: 'Cuota', campo: 'total', tipo: 'dinero' },
        { titulo: 'Saldo final', campo: 'saldoFinal', tipo: 'dinero' }
      ],
      filas: r.filas,
      pie: { n: null, fecha: null, saldoInicial: null, amortizacion: t.amortizacion, interes: t.interes, seguro: t.seguro, comision: t.comision, total: t.total, saldoFinal: null },
      claseFila: fila => (fila.gracia ? 'resaltada' : ''),
      alto: r.filas.length > 14
    }) + (v.gracia > 0 ? HC.nota('Las filas resaltadas son meses de gracia: solo se pagan intereses.') : '');
  });

  HC.excel.conectarBoton('btnExcel', 'cronograma-cuotas', () => {
    if (!ultimo) return null;
    const X = HC.excel;
    const { r, v } = ultimo;
    return [{
      nombre: 'Cronograma',
      anchos: [8, 12, 15, 14, 13, 12, 12, 14, 15],
      filas: [
        ['Cronograma de cuotas', v.metodo === 'aleman' ? 'Cuota decreciente (alemán)' : 'Cuota fija (francés)'],
        ['Monto', X.dinero(v.monto), 'TEA', X.pct(v.tea), 'TEM', X.pct(r.temPct, '0.0000%'), 'TCEA', X.pct(r.tceaPct)],
        [],
        ['N.°', 'Vence', 'Saldo inicial', 'Capital', 'Interés', 'Seguro', 'Comisión', 'Cuota total', 'Saldo final'],
        ...r.filas.map(x => [x.n, X.fecha(x.fecha), X.dinero(x.saldoInicial), X.dinero(x.amortizacion), X.dinero(x.interes),
          X.dinero(x.seguro), X.dinero(x.comision), X.dinero(x.total), X.dinero(x.saldoFinal)]),
        ['Total', null, null, X.dinero(r.totales.amortizacion), X.dinero(r.totales.interes), X.dinero(r.totales.seguro),
          X.dinero(r.totales.comision), X.dinero(r.totales.total)]
      ]
    }];
  });
})();
