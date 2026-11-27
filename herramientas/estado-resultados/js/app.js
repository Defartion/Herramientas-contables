(function () {
  'use strict';
  const C = window.EstadoResultados;
  const P = window.Parametros;
  const $ = HC.$;
  const RE = P.rentaEmpresas;
  const PU = P.participacionUtilidades;

  const dinero = (id, etiqueta, valor, ayuda) => ({ id, etiqueta, tipo: 'dinero', valor: valor == null ? '' : valor, min: 0, ayuda });

  const f = HC.formulario('form', [
    { seccion: 'Ingresos' },
    dinero('ventas', 'Ventas netas', 250000, 'Sin IGV, después de descuentos y devoluciones.'),
    dinero('otrosIngresosOp', 'Otros ingresos operativos'),
    { seccion: 'Costos y gastos (en positivo)' },
    dinero('costoVentas', 'Costo de ventas', 150000),
    { grupo: [dinero('gastosAdm', 'Gastos de administración', 40000), dinero('gastosVentas', 'Gastos de ventas', 20000)] },
    dinero('otrosGastosOp', 'Otros gastos operativos'),
    { seccion: 'Financieros y otros' },
    { grupo: [dinero('ingresosFin', 'Ingresos financieros'), dinero('gastosFin', 'Gastos financieros', 5000)] },
    { grupo: [dinero('otrosIngresos', 'Otros ingresos'), dinero('otrosGastos', 'Otros gastos')] },
    { seccion: 'Participación e impuesto' },
    { id: 'participacion', etiqueta: 'Participación de los trabajadores', tipo: 'select', valor: 'no-aplica',
      opciones: PU.tipos.map(t => [t.id, `${t.nombre}${t.pct ? ` (${t.pct} %)` : ''}`]) },
    { id: 'regimen', etiqueta: 'Régimen tributario', tipo: 'select', valor: 'mype', opciones: [
      ['mype', `Régimen MYPE Tributario (${RE.mype.tasaHastaLimite} % hasta ${RE.mype.limiteUIT} UIT, ${HC.numeroCorto(RE.mype.tasaExceso)} % el exceso)`],
      ['general', `Régimen General (${HC.numeroCorto(RE.general)} %)`],
      ['otra', 'Otra tasa']
    ] },
    { id: 'tasaOtra', etiqueta: 'Tasa del impuesto', tipo: 'pct', valor: '', si: v => v.regimen === 'otra' },
    { id: 'uit', etiqueta: 'UIT', tipo: 'dinero', valor: P.uit.valor, parametro: true, ayuda: P.uit.fuente, si: v => v.regimen === 'mype' }
  ], { clave: 'estado-resultados' });

  let ultimo = null;

  f.alCambiar(v => {
    const errs = C.validar(v);
    if (v.regimen === 'mype' && !(v.uit > 0)) errs.uit = 'Ingresa la UIT.';
    if (!f.errores(errs)) {
      ultimo = null;
      $('resultado').innerHTML = HC.vacio('Ingresa al menos las ventas netas.', 'fa-chart-column');
      $('detalle').hidden = true;
      return;
    }
    const participacionPct = PU.tipos.find(t => t.id === v.participacion).pct;
    const r = C.calcular({ ...v, participacionPct }, { general: RE.general, mype: RE.mype, uit: v.uit });
    ultimo = r;
    // Se guarda para que la herramienta de ratios pueda usarlo.
    HC.guardarJSON('hc:estado-resultados:ultimo', {
      fecha: new Date().toISOString(), ventas: r.ventas, costoVentas: r.costoVentas,
      utilidadOperativa: r.utilidadOperativa, utilidadNeta: r.utilidadNeta, gastosFin: r.gastosFin
    });

    const neg = n => (n < 0 ? 'negativo' : '');
    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: r.utilidadNeta >= 0 ? 'Utilidad neta' : 'Pérdida neta', valor: HC.dinero(r.utilidadNeta), acento: true },
        { etiqueta: 'Margen neto', valor: HC.pct(r.margenNeto) },
        { etiqueta: 'Impuesto a la renta', valor: HC.dinero(r.impuesto), nota: r.impuesto > 0 ? `Tasa efectiva ${HC.pct(r.tasaEfectiva)}` : '' }
      ]) +
      HC.lineas([
        { etiqueta: 'Utilidad bruta', valor: HC.dinero(r.utilidadBruta), detalle: `Margen ${HC.pct(r.margenBruto)}`, claseValor: neg(r.utilidadBruta) },
        { etiqueta: 'Utilidad operativa', valor: HC.dinero(r.utilidadOperativa), detalle: `Margen ${HC.pct(r.margenOperativo)}`, claseValor: neg(r.utilidadOperativa) },
        { etiqueta: 'Resultado antes de participaciones e impuestos', valor: HC.dinero(r.resultadoAntes), claseValor: neg(r.resultadoAntes) },
        r.participacion > 0 ? { etiqueta: `Participación de trabajadores (${participacionPct} %)`, valor: '−' + HC.dinero(r.participacion) } : null,
        { etiqueta: 'Impuesto a la renta', valor: '−' + HC.dinero(r.impuesto) },
        { etiqueta: 'Utilidad neta', valor: HC.dinero(r.utilidadNeta), clase: 'big', claseValor: neg(r.utilidadNeta) }
      ]) +
      HC.nota('El impuesto se calcula sobre la utilidad contable. La renta neta imponible real puede ser distinta por adiciones y deducciones tributarias (gastos no deducibles, pérdidas de años anteriores, etc.).') +
      HC.fuente(`Fuentes: ${RE.fuente}; ${PU.fuente}.`);

    $('detalle').hidden = false;
    $('detalleContenido').innerHTML = HC.tabla({
      columnas: [
        { titulo: 'Concepto', campo: 'concepto' },
        { titulo: 'Monto', campo: 'monto', tipo: 'dinero' },
        { titulo: '% de ventas', campo: 'pct', tipo: 'pct' }
      ],
      filas: r.lineas,
      claseFila: l => (l.subtotal ? 'subtotal' : '')
    });
  });

  HC.excel.conectarBoton('btnExcel', 'estado-de-resultados', () => {
    if (!ultimo) return null;
    const X = HC.excel;
    return [{
      nombre: 'Estado de resultados',
      anchos: [46, 16, 12],
      filas: [
        ['Estado de resultados'],
        [],
        ['Concepto', 'Monto', '% de ventas'],
        ...ultimo.lineas.map(l => [l.concepto, X.dinero(l.monto), X.pct(l.pct)])
      ]
    }];
  });
})();
