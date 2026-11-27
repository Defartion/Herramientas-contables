/* Flujo de caja proyectado: totales por mes, flujo neto y saldo acumulado. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.FlujoCaja = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const v0 = n => (U.esNumero(n) ? n : 0);

  /** Nombres de los meses a partir de 'AAAA-MM'. */
  function meses(inicio, n) {
    const m = /^(\d{4})-(\d{2})$/.exec(inicio || '');
    const base = m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : U.inicioDeMes(U.hoy());
    return Array.from({ length: n }, (_, i) => {
      const f = U.sumarMeses(base, i, 1);
      return { anio: f.getFullYear(), mes: f.getMonth(), corto: U.nombreMes(f.getMonth()).slice(0, 3) + ' ' + String(f.getFullYear()).slice(2) };
    });
  }

  /**
   * d: { saldoInicial, n, ingresos: [{ concepto, valores: [] }], egresos: [...] }
   */
  function calcular(d) {
    const n = d.n;
    const sumar = filas => Array.from({ length: n }, (_, m) => U.r2(filas.reduce((s, f) => s + v0(f.valores[m]), 0)));
    const totalIngresos = sumar(d.ingresos);
    const totalEgresos = sumar(d.egresos);
    const neto = totalIngresos.map((x, m) => U.r2(x - totalEgresos[m]));
    const saldoInicialMes = [];
    const saldoFinal = [];
    let saldo = v0(d.saldoInicial);
    for (let m = 0; m < n; m++) {
      saldoInicialMes.push(saldo);
      saldo = U.r2(saldo + neto[m]);
      saldoFinal.push(saldo);
    }
    const totalFila = f => U.r2(f.valores.slice(0, n).reduce((s, x) => s + v0(x), 0));
    const suma = a => U.r2(a.reduce((s, x) => s + x, 0));
    const negativos = saldoFinal.map((s, m) => (s < 0 ? m : -1)).filter(m => m >= 0);
    return {
      totalIngresos, totalEgresos, neto, saldoInicialMes, saldoFinal,
      totalesIngresos: d.ingresos.map(totalFila),
      totalesEgresos: d.egresos.map(totalFila),
      sumaIngresos: suma(totalIngresos),
      sumaEgresos: suma(totalEgresos),
      sumaNeto: suma(neto),
      saldoFinalPeriodo: saldoFinal[n - 1],
      saldoMinimo: Math.min(...saldoFinal),
      mesSaldoMinimo: saldoFinal.indexOf(Math.min(...saldoFinal)),
      negativos
    };
  }

  return { meses, calcular };
});
