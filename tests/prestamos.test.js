'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../compartido/util.js');
const IC = require('../herramientas/interes-compuesto/js/calculo.js');
const CR = require('../herramientas/cronograma-cuotas/js/calculo.js');
const CT = require('../herramientas/conversor-tasas/js/calculo.js');
const MO = require('../herramientas/interes-moratorio/js/calculo.js');

const cerca = (a, b, tol = 0.005) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

test('util: tiempo de servicio, meses completos y redondeo', () => {
  assert.deepEqual(U.tiempoServicio(U.desdeISO('2020-03-15'), U.desdeISO('2026-11-26')), { anios: 6, meses: 8, dias: 12 });
  assert.deepEqual(U.tiempoServicio(U.desdeISO('2026-01-01'), U.desdeISO('2026-12-31')), { anios: 1, meses: 0, dias: 0 });
  assert.equal(U.mesesCompletos(U.desdeISO('2026-01-01'), U.desdeISO('2026-06-30')), 6);
  assert.equal(U.mesesCompletos(U.desdeISO('2026-02-15'), U.desdeISO('2026-06-30')), 4);
  assert.equal(U.mesesCompletos(U.desdeISO('2026-07-01'), U.desdeISO('2026-09-20')), 2);
  assert.equal(U.r2(1.005), 1.01);
  assert.equal(U.r2(-2.675), -2.68);
  assert.equal(U.sumarMeses(U.desdeISO('2026-01-31'), 1).getDate(), 28);
  assert.equal(U.aISO(U.sumarMeses(U.desdeISO('2026-01-31'), 2, 31)), '2026-03-31');
  const t = U.impuestoPorTramos(100, [{ hasta: 50, tasa: 10 }, { hasta: Infinity, tasa: 20 }]);
  assert.equal(t.impuesto, 15);
});

test('interés compuesto: fórmula cerrada', () => {
  const anual = IC.calcular({ capital: 1000, tasa: 10, tipoTasa: 'efectiva', anios: 2, frecuencia: '1', aporte: NaN });
  cerca(anual.valorFinal, 1210);
  const mensual = IC.calcular({ capital: 1000, tasa: 12, tipoTasa: 'nominal', anios: 1, frecuencia: '12', aporte: NaN });
  cerca(mensual.valorFinal, 1000 * Math.pow(1.01, 12));
  // Con aportes al final: VF = C(1+i)^n + A((1+i)^n − 1)/i
  const i = 0.01, n = 24;
  const conAportes = IC.calcular({ capital: 500, tasa: 12, tipoTasa: 'nominal', anios: 2, frecuencia: '12', aporte: 100, momentoAporte: 'fin' });
  cerca(conAportes.valorFinal, 500 * Math.pow(1 + i, n) + 100 * (Math.pow(1 + i, n) - 1) / i);
  const anticipado = IC.calcular({ capital: 0, tasa: 12, tipoTasa: 'nominal', anios: 2, frecuencia: '12', aporte: 100, momentoAporte: 'inicio' });
  cerca(anticipado.valorFinal, 100 * (Math.pow(1 + i, n) - 1) / i * (1 + i));
  assert.equal(conAportes.porAnio.length, 2);
  assert.ok(IC.validar({ capital: 0, tasa: 5, anios: 1, frecuencia: '12', aporte: NaN }).capital);
});

test('cronograma francés: cuota fija y saldo final cero', () => {
  const tea = (Math.pow(1.01, 12) - 1) * 100; // TEM exacta de 1 %
  const r = CR.calcular({ monto: 10000, tea, cuotas: 12, fechaDesembolso: '2026-01-31', metodo: 'frances' });
  cerca(r.temPct, 1, 1e-9);
  cerca(r.filas[0].cuota, 888.49, 0.01);
  assert.equal(r.filas.length, 12);
  assert.equal(r.totales.amortizacion, 10000);
  assert.equal(r.filas[11].saldoFinal, 0);
  assert.equal(U.aISO(r.filas[0].fecha), '2026-02-28');
  assert.equal(U.aISO(r.filas[1].fecha), '2026-03-31');
  cerca(r.tceaPct, tea, 0.05); // sin seguros ni comisiones, TCEA ≈ TEA
});

test('cronograma alemán, gracia, seguro y comisión', () => {
  const tea = (Math.pow(1.01, 12) - 1) * 100;
  const r = CR.calcular({ monto: 12000, tea, cuotas: 12, fechaDesembolso: '2026-05-10', metodo: 'aleman', gracia: 2, seguro: 0.1, comision: 5 });
  assert.equal(r.filas.length, 14);
  assert.equal(r.filas[0].amortizacion, 0);
  assert.equal(r.filas[0].interes, 120);
  assert.equal(r.filas[2].amortizacion, 1000);
  assert.equal(r.filas[2].cuota, 1120);
  assert.equal(r.filas[2].seguro, 12);
  assert.equal(r.filas[2].total, 1137);
  assert.equal(r.totales.amortizacion, 12000);
  assert.ok(r.tceaPct > tea, 'los cargos elevan la TCEA');
});

test('conversor de tasas', () => {
  const r = CT.calcular({ valor: 12, tipo: 'efectiva', periodo: 'anual', base: '360' });
  cerca(r.efectivas.find(x => x.periodo === 'mensual').tasa, 0.948879, 1e-5);
  cerca(r.efectivas.find(x => x.periodo === 'diaria').tasa, 0.031485, 1e-5);
  const nominal = CT.calcular({ valor: 12, tipo: 'nominal', periodo: 'anual', capitalizacion: 'mensual', base: '360' });
  cerca(nominal.teaPct, 12.682503, 1e-5);
  cerca(nominal.nominales.find(x => x.capitalizacion === 'mensual').tasa, 12, 1e-9);
  const tem = CT.calcular({ valor: 2, tipo: 'efectiva', periodo: 'mensual', base: '360', diasPersonalizado: 45 });
  cerca(tem.teaPct, (Math.pow(1.02, 12) - 1) * 100, 1e-9);
  cerca(tem.personalizada.tasa, (Math.pow(1.02, 1.5) - 1) * 100, 1e-9);
  assert.ok(CT.validar({ valor: 10, tipo: 'nominal', periodo: 'mensual', capitalizacion: 'anual' }).capitalizacion);
});

test('interés moratorio: TIM lineal y tasa compuesta', () => {
  const tim = MO.calcular({ monto: 10000, fechaVencimiento: '2026-01-31', fechaPago: '2026-03-02', tipoTasa: 'tim', tasa: 0.9, penalidadTipo: 'ninguna' });
  assert.equal(tim.dias, 30);
  assert.equal(tim.interes, 90); // 10 000 × 0,03 % × 30
  const anual = MO.calcular({ monto: 1000, fechaVencimiento: '2026-01-01', fechaPago: '2026-12-27', tipoTasa: 'anual', tasa: 20, penalidadTipo: 'porcentaje', penalidad: 2 });
  assert.equal(anual.dias, 360);
  assert.equal(anual.interes, 200);
  assert.equal(anual.penalidad, 20);
  assert.equal(anual.total, 1220);
  const sinAtraso = MO.calcular({ monto: 1000, fechaVencimiento: '2026-05-10', fechaPago: '2026-05-01', tipoTasa: 'tim', tasa: 0.9, penalidadTipo: 'fija', penalidad: 50 });
  assert.equal(sinAtraso.dias, 0);
  assert.equal(sinAtraso.total, 1000);
});
