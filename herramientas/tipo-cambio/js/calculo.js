/* Conversión soles ↔ dólares con tipo de cambio de compra y venta. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.TipoCambio = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.monto) || e.monto <= 0) err.monto = 'Ingresa un monto mayor a cero.';
    if (!U.esNumero(e.compra) || e.compra <= 0) err.compra = 'Ingresa el tipo de cambio de compra.';
    if (!U.esNumero(e.venta) || e.venta <= 0) err.venta = 'Ingresa el tipo de cambio de venta.';
    return err;
  }

  /**
   * direccion 'usd-pen': tienes dólares y recibes soles (el cambista te compra al tipo de compra).
   * direccion 'pen-usd': tienes soles y recibes dólares (te venden al tipo de venta).
   * tipoUsado: 'auto' (según la dirección), 'compra' o 'venta'.
   */
  function convertir(e) {
    const tipo = e.tipoUsado === 'compra' || e.tipoUsado === 'venta'
      ? e.tipoUsado
      : (e.direccion === 'usd-pen' ? 'compra' : 'venta');
    const tc = tipo === 'compra' ? e.compra : e.venta;
    const resultado = e.direccion === 'usd-pen' ? U.r2(e.monto * tc) : U.r2(e.monto / tc);
    const otroTipo = tipo === 'compra' ? 'venta' : 'compra';
    const otroTc = otroTipo === 'compra' ? e.compra : e.venta;
    const alternativo = e.direccion === 'usd-pen' ? U.r2(e.monto * otroTc) : U.r2(e.monto / otroTc);
    return {
      tipo, tc, resultado, otroTipo, otroTc, alternativo,
      spread: U.r2(e.venta - e.compra),
      spreadPct: (e.venta - e.compra) / ((e.venta + e.compra) / 2) * 100
    };
  }

  return { validar, convertir };
});
