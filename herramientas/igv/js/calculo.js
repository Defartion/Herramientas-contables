/* IGV: agregar o quitar el impuesto de un monto. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.CalcIGV = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.monto) || e.monto <= 0) err.monto = 'Ingresa un monto mayor a cero.';
    if (!U.esNumero(e.tasaTotal) || e.tasaTotal < 0 || e.tasaTotal > 100) err.tasaTotal = 'Ingresa una tasa entre 0 y 100 %.';
    return err;
  }

  /**
   * modo 'agregar': el monto es el valor de venta (sin IGV).
   * modo 'quitar': el monto es el precio de venta (con IGV).
   * igvPct / ipmPct: composición de la tasa total (por ejemplo 15,5 + 2,5 = 18).
   */
  function calcular(e) {
    const t = e.tasaTotal / 100;
    let base, impuesto, total;
    if (e.modo === 'quitar') {
      total = U.r2(e.monto);
      base = U.r2(total / (1 + t));
      impuesto = U.r2(total - base);
    } else {
      base = U.r2(e.monto);
      impuesto = U.r2(base * t);
      total = U.r2(base + impuesto);
    }
    let igv = impuesto;
    let ipm = 0;
    if (U.esNumero(e.igvPct) && U.esNumero(e.ipmPct) && e.tasaTotal > 0) {
      igv = U.r2(impuesto * e.igvPct / e.tasaTotal);
      ipm = U.r2(impuesto - igv);
    }
    return { base, impuesto, total, igv, ipm };
  }

  return { validar, calcular };
});
