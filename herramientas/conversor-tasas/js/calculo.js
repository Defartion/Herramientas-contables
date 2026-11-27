/* Conversión entre tasas efectivas y nominales. Todo pasa primero a TEA. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.ConversorTasas = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  /** Veces que entra cada periodo en un año. */
  const VECES = { anual: 1, semestral: 2, trimestral: 4, bimestral: 6, mensual: 12, quincenal: 24, diaria: null };
  const NOMBRES = { anual: 'anual', semestral: 'semestral', trimestral: 'trimestral', bimestral: 'bimestral',
    mensual: 'mensual', quincenal: 'quincenal', diaria: 'diaria' };

  /** Días de un periodo según la base (360 o 365). */
  const dias = (periodo, base) => (periodo === 'diaria' ? 1 : base / VECES[periodo]);

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.valor) || e.valor <= -100) err.valor = 'Ingresa una tasa válida.';
    if (!(e.periodo in VECES)) err.periodo = 'Elige el periodo.';
    if (e.tipo === 'nominal') {
      if (!(e.capitalizacion in VECES)) err.capitalizacion = 'Elige la capitalización.';
      else if (dias(e.capitalizacion, 360) > dias(e.periodo, 360)) err.capitalizacion = 'La capitalización no puede ser más larga que el periodo de la tasa.';
    }
    if (U.esNumero(e.diasPersonalizado) && (!Number.isInteger(e.diasPersonalizado) || e.diasPersonalizado < 1)) err.diasPersonalizado = 'Ingresa un número entero de días.';
    return err;
  }

  /** Convierte la tasa ingresada (en %) a TEA (fracción). */
  function aTea(e) {
    const base = Number(e.base) || 360;
    const r = e.valor / 100;
    if (e.tipo === 'nominal') {
      // Tasa nominal del periodo dividida entre los subperiodos de capitalización.
      const efectivaCap = r * dias(e.capitalizacion, base) / dias(e.periodo, base);
      return Math.pow(1 + efectivaCap, base / dias(e.capitalizacion, base)) - 1;
    }
    return Math.pow(1 + r, base / dias(e.periodo, base)) - 1;
  }

  /** Tasa efectiva (fracción) para un número de días a partir de la TEA. */
  const efectivaParaDias = (tea, d, base) => Math.pow(1 + tea, d / base) - 1;

  function calcular(e) {
    const base = Number(e.base) || 360;
    const tea = aTea(e);
    const periodos = ['anual', 'semestral', 'trimestral', 'mensual', 'quincenal', 'diaria'];
    const efectivas = periodos.map(p => ({
      periodo: p, nombre: 'Efectiva ' + NOMBRES[p], dias: dias(p, base),
      tasa: efectivaParaDias(tea, dias(p, base), base) * 100
    }));
    const nominales = ['mensual', 'trimestral', 'semestral', 'diaria'].map(c => ({
      capitalizacion: c, nombre: 'Nominal anual con capitalización ' + NOMBRES[c],
      tasa: efectivaParaDias(tea, dias(c, base), base) * (base / dias(c, base)) * 100
    }));
    const personalizada = U.esNumero(e.diasPersonalizado) && e.diasPersonalizado > 0
      ? { dias: e.diasPersonalizado, tasa: efectivaParaDias(tea, e.diasPersonalizado, base) * 100 }
      : null;
    return { base, teaPct: tea * 100, efectivas, nominales, personalizada };
  }

  return { VECES, validar, aTea, efectivaParaDias, calcular };
});
