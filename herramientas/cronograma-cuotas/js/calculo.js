/* Cronograma de cuotas mensuales: método francés (cuota fija) o alemán (amortización constante). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.Cronograma = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const opcional = n => (U.esNumero(n) ? n : 0);

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.monto) || e.monto <= 0) err.monto = 'Ingresa un monto mayor a cero.';
    if (!U.esNumero(e.tea) || e.tea < 0) err.tea = 'Ingresa una TEA de 0 o más.';
    if (!Number.isInteger(e.cuotas) || e.cuotas < 1 || e.cuotas > 600) err.cuotas = 'Entre 1 y 600 cuotas.';
    if (!U.desdeISO(e.fechaDesembolso)) err.fechaDesembolso = 'Ingresa una fecha válida.';
    if (U.esNumero(e.gracia) && (!Number.isInteger(e.gracia) || e.gracia < 0 || e.gracia > 60)) err.gracia = 'Entre 0 y 60 meses.';
    if (U.esNumero(e.seguro) && e.seguro < 0) err.seguro = 'No puede ser negativo.';
    if (U.esNumero(e.comision) && e.comision < 0) err.comision = 'No puede ser negativa.';
    return err;
  }

  /** TEA (%) → tasa efectiva mensual (fracción). */
  const temDesdeTea = teaPct => Math.pow(1 + teaPct / 100, 1 / 12) - 1;

  function calcular(e) {
    const i = temDesdeTea(e.tea);
    const n = e.cuotas;
    const gracia = opcional(e.gracia);
    const tasaSeguro = opcional(e.seguro) / 100;
    const comision = opcional(e.comision);
    const desembolso = U.desdeISO(e.fechaDesembolso);
    const dia = desembolso.getDate();

    let saldo = U.r2(e.monto);
    const filas = [];
    const fila = (k, amortizacion, interes) => {
      const seguro = U.r2(saldo * tasaSeguro);
      const cuota = U.r2(amortizacion + interes);
      const saldoFinal = U.r2(saldo - amortizacion);
      filas.push({
        n: k, fecha: U.sumarMeses(desembolso, k, dia), saldoInicial: saldo, amortizacion, interes,
        cuota, seguro, comision, total: U.r2(cuota + seguro + comision), saldoFinal, gracia: k <= gracia
      });
      saldo = saldoFinal;
    };

    // Periodo de gracia: solo se pagan intereses.
    for (let k = 1; k <= gracia; k++) fila(k, 0, U.r2(saldo * i));

    const cuotaFija = i === 0 ? U.r2(saldo / n) : U.r2(saldo * i / (1 - Math.pow(1 + i, -n)));
    const amortizacionFija = U.r2(saldo / n);
    for (let j = 1; j <= n; j++) {
      const interes = U.r2(saldo * i);
      let amortizacion = e.metodo === 'aleman' ? amortizacionFija : U.r2(cuotaFija - interes);
      if (j === n || amortizacion > saldo) amortizacion = saldo; // la última cuota cierra el saldo
      fila(gracia + j, amortizacion, interes);
    }

    const suma = campo => U.r2(filas.reduce((s, f) => s + f[campo], 0));
    const flujos = [-U.r2(e.monto), ...filas.map(f => f.total)];
    const tirMensual = U.tir(flujos);

    return {
      temPct: i * 100,
      cuotaReferencial: e.metodo === 'aleman' ? filas[gracia].total : U.r2(cuotaFija + U.r2(filas[gracia].seguro) + comision),
      filas,
      totales: {
        amortizacion: suma('amortizacion'),
        interes: suma('interes'),
        seguro: suma('seguro'),
        comision: suma('comision'),
        cuota: suma('cuota'),
        total: suma('total')
      },
      tceaPct: Number.isFinite(tirMensual) ? (Math.pow(1 + tirMensual, 12) - 1) * 100 : NaN,
      ultimaFecha: filas[filas.length - 1].fecha
    };
  }

  return { validar, temDesdeTea, calcular };
});
