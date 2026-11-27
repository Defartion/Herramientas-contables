/* Renta de 4.ª categoría: retención por recibo e impuesto anual estimado. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.RentaCuarta = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.monto) || e.monto <= 0) err.monto = 'Ingresa un monto mayor a cero.';
    if (U.esNumero(e.ingresosAnuales) && e.ingresosAnuales < 0) err.ingresosAnuales = 'No puede ser negativo.';
    if (U.esNumero(e.gastosDeducibles) && e.gastosDeducibles < 0) err.gastosDeducibles = 'No puede ser negativo.';
    if (U.esNumero(e.retencionesAnio) && e.retencionesAnio < 0) err.retencionesAnio = 'No puede ser negativo.';
    return err;
  }

  const correspondeRetener = (monto, p) => !!p.clienteAgente && !p.suspension && monto > p.minimo;

  /** Retención de un recibo por honorarios. p: { tasa, minimo, clienteAgente, suspension } */
  function recibo(monto, p) {
    const aplica = correspondeRetener(monto, p);
    const retencion = aplica ? U.r2(monto * p.tasa / 100) : 0;
    return { monto: U.r2(monto), aplica, retencion, neto: U.r2(monto - retencion) };
  }

  /** Monto del recibo que hay que emitir para recibir un neto deseado. */
  function desdeNeto(neto, p) {
    if (!p.clienteAgente || p.suspension || neto <= p.minimo) return recibo(neto, p);
    const monto = Math.ceil(neto / (1 - p.tasa / 100) * 100 - 1e-6) / 100;
    return recibo(monto, p);
  }

  /**
   * Impuesto anual de rentas de trabajo (solo 4.ª categoría).
   * a: { ingresos, gastosDeducibles, retenido, uit, deduccionPct, deduccionTopeUIT,
   *      deduccionUIT, deduccionAdicionalUIT, tramosUIT, limiteSuspension }
   */
  function anual(a) {
    const deduccion20 = Math.min(a.ingresos * a.deduccionPct / 100, a.deduccionTopeUIT * a.uit);
    const rentaNeta = a.ingresos - deduccion20;
    const deduccion7 = Math.min(a.deduccionUIT * a.uit, rentaNeta);
    const gastos = Math.min(U.esNumero(a.gastosDeducibles) ? a.gastosDeducibles : 0, a.deduccionAdicionalUIT * a.uit,
      rentaNeta - deduccion7);
    const base = Math.max(0, rentaNeta - deduccion7 - gastos);
    const { impuesto, detalle } = U.impuestoPorTramos(base, U.tramosEnSoles(a.tramosUIT, a.uit));
    const retenido = U.esNumero(a.retenido) ? a.retenido : 0;
    return {
      ingresos: a.ingresos,
      deduccion20: U.r2(deduccion20),
      rentaNeta: U.r2(rentaNeta),
      deduccion7: U.r2(deduccion7),
      gastos: U.r2(Math.max(0, gastos)),
      base: U.r2(base),
      impuesto: U.r2(impuesto),
      detalle,
      retenido: U.r2(retenido),
      saldo: U.r2(impuesto - retenido),
      puedeSuspender: a.ingresos <= a.limiteSuspension
    };
  }

  return { validar, recibo, desdeNeto, anual };
});
