/* Interés compuesto: valor futuro con capitalización y aportes periódicos. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.InteresCompuesto = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const FRECUENCIAS = { 360: 'Diaria', 12: 'Mensual', 4: 'Trimestral', 2: 'Semestral', 1: 'Anual' };
  const PERIODO = { 360: 'día', 12: 'mes', 4: 'trimestre', 2: 'semestre', 1: 'año' };

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.capital) || e.capital < 0) err.capital = 'Ingresa un capital de 0 o más.';
    if (!U.esNumero(e.tasa) || e.tasa <= -100) err.tasa = 'Ingresa una tasa válida.';
    if (!U.esNumero(e.anios) || e.anios <= 0) err.anios = 'El plazo debe ser mayor a cero.';
    else if (e.anios > 100) err.anios = 'El plazo máximo es 100 años.';
    if (!FRECUENCIAS[e.frecuencia]) err.frecuencia = 'Elige la capitalización.';
    if (U.esNumero(e.aporte) && e.aporte < 0) err.aporte = 'El aporte no puede ser negativo.';
    if (!err.capital && !(e.capital > 0) && !(e.aporte > 0)) err.capital = 'Ingresa un capital o un aporte periódico.';
    return err;
  }

  /** Tasa efectiva por periodo de capitalización. */
  function tasaPorPeriodo(tasaPct, tipo, m) {
    const t = tasaPct / 100;
    return tipo === 'nominal' ? t / m : Math.pow(1 + t, 1 / m) - 1;
  }

  function calcular(e) {
    const m = Number(e.frecuencia);
    const i = tasaPorPeriodo(e.tasa, e.tipoTasa, m);
    const n = Math.max(1, Math.round(e.anios * m));
    const aporte = U.esNumero(e.aporte) ? e.aporte : 0;
    const anticipado = e.momentoAporte === 'inicio';

    let saldo = e.capital;
    let totalAportes = 0;
    let totalIntereses = 0;
    const periodos = [];
    for (let k = 1; k <= n; k++) {
      const inicial = saldo;
      let interes;
      if (anticipado) {
        saldo += aporte;
        interes = saldo * i;
        saldo += interes;
      } else {
        interes = saldo * i;
        saldo += interes + aporte;
      }
      totalAportes += aporte;
      totalIntereses += interes;
      periodos.push({ n: k, inicial, aporte, interes, final: saldo });
    }

    const porAnio = [];
    for (let desde = 0; desde < n; desde += m) {
      const tramo = periodos.slice(desde, Math.min(n, desde + m));
      porAnio.push({
        anio: porAnio.length + 1,
        aportes: tramo.reduce((s, p) => s + p.aporte, 0),
        intereses: tramo.reduce((s, p) => s + p.interes, 0),
        final: tramo[tramo.length - 1].final
      });
    }

    return {
      m, n, i,
      nombreFrecuencia: FRECUENCIAS[m],
      nombrePeriodo: PERIODO[m],
      tasaPeriodoPct: i * 100,
      teaPct: (Math.pow(1 + i, m) - 1) * 100,
      capital: e.capital,
      totalAportes,
      totalInvertido: e.capital + totalAportes,
      totalIntereses,
      valorFinal: saldo,
      periodos,
      porAnio
    };
  }

  return { FRECUENCIAS, validar, tasaPorPeriodo, calcular };
});
