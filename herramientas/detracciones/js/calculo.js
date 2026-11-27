/* Detracciones (SPOT), retenciones y percepciones del IGV. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.Detracciones = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.importe) || e.importe <= 0) err.importe = 'Ingresa el importe total de la operación.';
    if (!U.esNumero(e.tasa) || e.tasa < 0 || e.tasa > 100) err.tasa = 'Ingresa una tasa entre 0 y 100 %.';
    return err;
  }

  /** El depósito de la detracción se hace sin decimales (redondeo al entero). */
  function detraccion({ importe, tasa, montoMinimo }) {
    const aplica = importe > montoMinimo;
    const exacto = importe * tasa / 100;
    const deposito = aplica ? Math.round(exacto + 1e-9) : 0;
    return { aplica, exacto: U.r2(exacto), deposito, neto: U.r2(importe - deposito) };
  }

  function retencion({ importe, tasa, montoMinimo, esAgente }) {
    const aplica = !!esAgente && importe > montoMinimo;
    const monto = aplica ? U.r2(importe * tasa / 100) : 0;
    return { aplica, monto, neto: U.r2(importe - monto) };
  }

  function percepcion({ importe, tasa }) {
    const monto = U.r2(importe * tasa / 100);
    return { aplica: monto > 0, monto, total: U.r2(importe + monto) };
  }

  return { validar, detraccion, retencion, percepcion };
});
