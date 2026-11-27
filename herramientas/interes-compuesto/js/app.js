(function () {
  'use strict';
  const C = window.InteresCompuesto;
  const $ = HC.$;

  const f = HC.formulario('form', [
    { id: 'capital', etiqueta: 'Capital inicial', tipo: 'dinero', valor: 10000, min: 0 },
    { grupo: [
      { id: 'tasa', etiqueta: 'Tasa anual', tipo: 'pct', valor: 8 },
      { id: 'tipoTasa', etiqueta: 'Tipo de tasa', tipo: 'select', valor: 'efectiva',
        opciones: [['efectiva', 'Efectiva (TEA)'], ['nominal', 'Nominal (TNA)']] }
    ] },
    { grupo: [
      { id: 'anios', etiqueta: 'Plazo (años)', tipo: 'numero', valor: 5, min: 0 },
      { id: 'frecuencia', etiqueta: 'Capitalización', tipo: 'select', valor: '12',
        opciones: [['12', 'Mensual'], ['4', 'Trimestral'], ['2', 'Semestral'], ['1', 'Anual'], ['360', 'Diaria']] }
    ] },
    { seccion: 'Aportes periódicos (opcional)' },
    { id: 'aporte', etiqueta: 'Aporte en cada periodo', tipo: 'dinero', valor: '', min: 0,
      ayuda: 'Se suma una vez en cada periodo de capitalización.' },
    { id: 'momentoAporte', etiqueta: 'El aporte se hace', tipo: 'segmento', valor: 'fin',
      opciones: [['fin', 'Al final del periodo'], ['inicio', 'Al inicio']], si: v => v.aporte > 0 }
  ], { clave: 'interes-compuesto' });

  let ultimo = null;

  f.alCambiar(v => {
    if (!f.errores(C.validar(v))) {
      ultimo = null;
      $('resultado').innerHTML = HC.vacio('Completa los datos para ver el cálculo.');
      $('detalle').hidden = true;
      return;
    }
    const r = C.calcular(v);
    ultimo = r;

    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'Valor final', valor: HC.dinero(r.valorFinal), acento: true },
        { etiqueta: 'Intereses ganados', valor: HC.dinero(r.totalIntereses) },
        { etiqueta: 'Total invertido', valor: HC.dinero(r.totalInvertido) }
      ]) +
      HC.lineas([
        { etiqueta: 'Capital inicial', valor: HC.dinero(r.capital) },
        r.totalAportes > 0 ? { etiqueta: `Aportes (${r.n} × ${HC.dinero(v.aporte)})`, valor: HC.dinero(r.totalAportes) } : null,
        { etiqueta: 'Intereses', valor: HC.dinero(r.totalIntereses) },
        { etiqueta: 'Valor final', valor: HC.dinero(r.valorFinal), clase: 'big' }
      ]) +
      HC.nota(`Capitalización ${r.nombreFrecuencia.toLowerCase()}: ${r.n} periodos con una tasa de ${HC.pct(r.tasaPeriodoPct, 4)} por ${r.nombrePeriodo}` +
        (v.tipoTasa === 'nominal' ? ` (equivale a una TEA de ${HC.pct(r.teaPct)}).` : '.'));

    $('detalle').hidden = false;
    $('detalleContenido').innerHTML = HC.tabla({
      columnas: [
        { titulo: 'Año', campo: 'anio', tipo: 'entero' },
        { titulo: 'Aportes del año', campo: 'aportes', tipo: 'dinero' },
        { titulo: 'Intereses del año', campo: 'intereses', tipo: 'dinero' },
        { titulo: 'Saldo al cierre', campo: 'final', tipo: 'dinero' }
      ],
      filas: r.porAnio,
      pie: { anio: null, aportes: r.totalAportes, intereses: r.totalIntereses, final: r.valorFinal },
      alto: r.porAnio.length > 15
    });
  });

  HC.excel.conectarBoton('btnExcel', 'interes-compuesto', () => {
    if (!ultimo) return null;
    const X = HC.excel;
    const r = ultimo;
    return [
      {
        nombre: 'Resumen por año',
        anchos: [8, 16, 16, 18],
        filas: [
          ['Interés compuesto'],
          ['Capital inicial', X.dinero(r.capital)],
          ['TEA equivalente', X.pct(r.teaPct)],
          [],
          ['Año', 'Aportes', 'Intereses', 'Saldo al cierre'],
          ...r.porAnio.map(a => [a.anio, X.dinero(a.aportes), X.dinero(a.intereses), X.dinero(a.final)]),
          ['Total', X.dinero(r.totalAportes), X.dinero(r.totalIntereses), X.dinero(r.valorFinal)]
        ]
      },
      {
        nombre: 'Detalle por periodo',
        anchos: [10, 16, 14, 14, 16],
        filas: [
          ['Periodo', 'Saldo inicial', 'Aporte', 'Interés', 'Saldo final'],
          ...r.periodos.map(p => [p.n, X.dinero(p.inicial), X.dinero(p.aporte), X.dinero(p.interes), X.dinero(p.final)])
        ]
      }
    ];
  });
})();
