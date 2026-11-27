/* Interés moratorio por días de atraso, con penalidad opcional. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.Moratorio = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.monto) || e.monto <= 0) err.monto = 'Ingresa un monto mayor a cero.';
    if (!U.desdeISO(e.fechaVencimiento)) err.fechaVencimiento = 'Ingresa una fecha válida.';
    if (!U.desdeISO(e.fechaPago)) err.fechaPago = 'Ingresa una fecha válida.';
    if (!U.esNumero(e.tasa) || e.tasa < 0) err.tasa = 'Ingresa una tasa de 0 o más.';
    if (e.penalidadTipo !== 'ninguna' && U.esNumero(e.penalidad) && e.penalidad < 0) err.penalidad = 'Ingresa un valor de 0 o más.';
    return err;
  }

  /**
   * tipoTasa:
   *  - 'tim' o 'mensual': tasa mensual lineal (sin capitalizar), como la TIM de SUNAT:
   *     interés = monto × (tasa ÷ 30) × días
   *  - 'anual': tasa efectiva anual, compuesta: monto × ((1 + TEA)^(días/360) − 1)
   * Los días se cuentan desde el día siguiente al vencimiento hasta la fecha de pago.
   */
  function calcular(e) {
    const venc = U.desdeISO(e.fechaVencimiento);
    const pago = U.desdeISO(e.fechaPago);
    const dias = Math.max(0, U.diasEntre(venc, pago));
    const t = e.tasa / 100;
    let interes;
    let tasaDiaria;
    if (e.tipoTasa === 'anual') {
      tasaDiaria = Math.pow(1 + t, 1 / 360) - 1;
      interes = e.monto * (Math.pow(1 + t, dias / 360) - 1);
    } else {
      tasaDiaria = t / 30;
      interes = e.monto * tasaDiaria * dias;
    }
    interes = U.r2(interes);
    const valorPenalidad = U.esNumero(e.penalidad) ? e.penalidad : 0;
    let penalidad = 0;
    if (dias > 0 && e.penalidadTipo === 'fija') penalidad = U.r2(valorPenalidad);
    if (dias > 0 && e.penalidadTipo === 'porcentaje') penalidad = U.r2(e.monto * valorPenalidad / 100);
    return {
      dias,
      tasaDiariaPct: tasaDiaria * 100,
      interes,
      penalidad,
      total: U.r2(e.monto + interes + penalidad),
      desde: dias > 0 ? U.sumarDias(venc, 1) : null
    };
  }

  return { validar, calcular };
});
