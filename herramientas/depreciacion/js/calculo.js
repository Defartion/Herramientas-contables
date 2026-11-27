/* Depreciación tributaria por línea recta, desde el mes en que el activo empieza a usarse. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.Depreciacion = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const valido = a => U.esNumero(a.costo) && a.costo > 0 && U.esNumero(a.tasa) && a.tasa > 0 && a.tasa <= 100 && !!U.desdeISO(a.inicio);

  /** Meses depreciados desde el inicio hasta el fin del año indicado (incluido). */
  function mesesHastaFinDe(anio, inicio) {
    return Math.max(0, (anio - inicio.getFullYear() + 1) * 12 - inicio.getMonth());
  }

  /** Depreciación de un activo en un ejercicio. a: { costo, tasa (%), inicio 'AAAA-MM-DD' } */
  function enEjercicio(a, anio) {
    const inicio = U.desdeISO(a.inicio);
    const mensual = a.costo * a.tasa / 100 / 12;
    const acumulada = meses => U.r2(Math.min(a.costo, mensual * meses));
    const antes = acumulada(mesesHastaFinDe(anio - 1, inicio));
    const alCierre = acumulada(mesesHastaFinDe(anio, inicio));
    const mesesTotales = Math.ceil(1200 / a.tasa - 1e-9);
    const fin = U.sumarMeses(new Date(inicio.getFullYear(), inicio.getMonth(), 1), mesesTotales - 1, 1);
    return {
      mensual: U.r2(mensual),
      acumuladaInicio: antes,
      delEjercicio: U.r2(alCierre - antes),
      acumuladaCierre: alCierre,
      valorNeto: U.r2(a.costo - alCierre),
      totalmenteDepreciado: alCierre >= a.costo,
      ultimoMes: fin
    };
  }

  /** Cronograma anual completo del activo. */
  function cronograma(a) {
    const inicio = U.desdeISO(a.inicio);
    const filas = [];
    for (let anio = inicio.getFullYear(); filas.length < 200; anio++) {
      const r = enEjercicio(a, anio);
      filas.push({ anio, ...r });
      if (r.totalmenteDepreciado) break;
    }
    return filas;
  }

  /** Resumen de varios activos para un ejercicio. */
  function resumen(activos, anio) {
    const filas = activos.filter(valido).map(a => ({ activo: a, ...enEjercicio(a, anio) }))
      .filter(f => U.desdeISO(f.activo.inicio).getFullYear() <= anio);
    const suma = c => U.r2(filas.reduce((s, f) => s + (c === 'costo' ? f.activo.costo : f[c]), 0));
    return {
      filas,
      totales: {
        costo: suma('costo'), acumuladaInicio: suma('acumuladaInicio'), delEjercicio: suma('delEjercicio'),
        acumuladaCierre: suma('acumuladaCierre'), valorNeto: suma('valorNeto')
      }
    };
  }

  return { valido, enEjercicio, cronograma, resumen };
});
