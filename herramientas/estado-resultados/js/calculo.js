/* Estado de resultados por función, con participación de trabajadores e impuesto a la renta. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.EstadoResultados = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const CAMPOS = ['ventas', 'otrosIngresosOp', 'costoVentas', 'gastosAdm', 'gastosVentas', 'otrosGastosOp',
    'ingresosFin', 'gastosFin', 'otrosIngresos', 'otrosGastos'];
  const v0 = n => (U.esNumero(n) ? n : 0);

  function validar(e) {
    const err = {};
    CAMPOS.forEach(c => { if (U.esNumero(e[c]) && e[c] < 0) err[c] = 'Ingresa el monto en positivo.'; });
    if (!(v0(e.ventas) > 0)) err.ventas = 'Ingresa las ventas netas.';
    if (e.regimen === 'otra' && (!U.esNumero(e.tasaOtra) || e.tasaOtra < 0 || e.tasaOtra > 100)) err.tasaOtra = 'Ingresa la tasa.';
    return err;
  }

  /** Impuesto a la renta según el régimen. p: { general, mype: { limiteUIT, tasaHastaLimite, tasaExceso }, uit } */
  function impuestoRenta(base, regimen, p, tasaOtra) {
    if (base <= 0) return 0;
    if (regimen === 'mype') {
      return U.impuestoPorTramos(base, [
        { hasta: p.mype.limiteUIT * p.uit, tasa: p.mype.tasaHastaLimite },
        { hasta: Infinity, tasa: p.mype.tasaExceso }
      ]).impuesto;
    }
    return base * (regimen === 'otra' ? tasaOtra : p.general) / 100;
  }

  function calcular(e, p) {
    const x = {};
    CAMPOS.forEach(c => { x[c] = v0(e[c]); });
    const utilidadBruta = x.ventas - x.costoVentas;
    const utilidadOperativa = utilidadBruta + x.otrosIngresosOp - x.gastosAdm - x.gastosVentas - x.otrosGastosOp;
    const resultadoAntes = utilidadOperativa + x.ingresosFin - x.gastosFin + x.otrosIngresos - x.otrosGastos;
    const participacion = resultadoAntes > 0 ? U.r2(resultadoAntes * v0(e.participacionPct) / 100) : 0;
    const baseImpuesto = resultadoAntes - participacion;
    const impuesto = U.r2(impuestoRenta(baseImpuesto, e.regimen, p, e.tasaOtra));
    const utilidadNeta = U.r2(baseImpuesto - impuesto);
    const pct = n => (x.ventas ? n / x.ventas * 100 : NaN);

    const lineas = [
      { concepto: 'Ventas netas', monto: x.ventas },
      { concepto: 'Costo de ventas', monto: -x.costoVentas },
      { concepto: 'Utilidad bruta', monto: utilidadBruta, subtotal: true },
      { concepto: 'Otros ingresos operativos', monto: x.otrosIngresosOp },
      { concepto: 'Gastos de administración', monto: -x.gastosAdm },
      { concepto: 'Gastos de ventas', monto: -x.gastosVentas },
      { concepto: 'Otros gastos operativos', monto: -x.otrosGastosOp },
      { concepto: 'Utilidad operativa', monto: utilidadOperativa, subtotal: true },
      { concepto: 'Ingresos financieros', monto: x.ingresosFin },
      { concepto: 'Gastos financieros', monto: -x.gastosFin },
      { concepto: 'Otros ingresos', monto: x.otrosIngresos },
      { concepto: 'Otros gastos', monto: -x.otrosGastos },
      { concepto: 'Resultado antes de participaciones e impuestos', monto: resultadoAntes, subtotal: true },
      { concepto: 'Participación de los trabajadores', monto: -participacion },
      { concepto: 'Impuesto a la renta', monto: -impuesto },
      { concepto: 'Utilidad (pérdida) neta', monto: utilidadNeta, subtotal: true, final: true }
    ].filter(l => l.subtotal || l.monto !== 0 || ['Ventas netas', 'Costo de ventas'].includes(l.concepto))
      .map(l => ({ ...l, pct: pct(l.monto) }));

    return {
      ...x, utilidadBruta, utilidadOperativa, resultadoAntes, participacion, baseImpuesto, impuesto, utilidadNeta,
      margenBruto: pct(utilidadBruta), margenOperativo: pct(utilidadOperativa), margenNeto: pct(utilidadNeta),
      tasaEfectiva: baseImpuesto > 0 ? impuesto / baseImpuesto * 100 : 0,
      lineas
    };
  }

  return { CAMPOS, validar, impuestoRenta, calcular };
});
