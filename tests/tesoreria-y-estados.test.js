'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../compartido/parametros.js');
const TC = require('../herramientas/tipo-cambio/js/calculo.js');
const FC = require('../herramientas/flujo-caja/js/calculo.js');
const DP = require('../herramientas/depreciacion/js/calculo.js');
const ER = require('../herramientas/estado-resultados/js/calculo.js');
const RT = require('../herramientas/ratios/js/calculo.js');

test('tipo de cambio: compra al vender dólares, venta al comprarlos', () => {
  const a = TC.convertir({ monto: 1000, direccion: 'usd-pen', compra: 3.35, venta: 3.36, tipoUsado: 'auto' });
  assert.equal(a.tipo, 'compra');
  assert.equal(a.resultado, 3350);
  assert.equal(a.alternativo, 3360);
  const b = TC.convertir({ monto: 3360, direccion: 'pen-usd', compra: 3.35, venta: 3.36, tipoUsado: 'auto' });
  assert.equal(b.tipo, 'venta');
  assert.equal(b.resultado, 1000);
  assert.equal(TC.convertir({ monto: 100, direccion: 'usd-pen', compra: 3.35, venta: 3.36, tipoUsado: 'venta' }).resultado, 336);
});

test('flujo de caja: totales, saldo acumulado y meses negativos', () => {
  const r = FC.calcular({
    saldoInicial: 1000, n: 2,
    ingresos: [{ concepto: 'Ventas', valores: [500, 500] }, { concepto: 'Otros', valores: [null, 100] }],
    egresos: [{ concepto: 'Compras', valores: [2000, 100] }]
  });
  assert.deepEqual(r.totalIngresos, [500, 600]);
  assert.deepEqual(r.neto, [-1500, 500]);
  assert.deepEqual(r.saldoFinal, [-500, 0]);
  assert.deepEqual(r.negativos, [0]);
  assert.equal(r.saldoMinimo, -500);
  assert.deepEqual(r.totalesIngresos, [1000, 100]);
  assert.deepEqual(FC.meses('2026-11', 3).map(m => m.corto), ['nov 26', 'dic 26', 'ene 27']);
});

test('depreciación: desde el mes de inicio de uso hasta el costo total', () => {
  const a = { costo: 12000, tasa: 10, inicio: '2024-03-15' };
  assert.equal(DP.enEjercicio(a, 2023).delEjercicio, 0);
  assert.equal(DP.enEjercicio(a, 2024).delEjercicio, 1000);
  const r25 = DP.enEjercicio(a, 2025);
  assert.equal(r25.acumuladaInicio, 1000);
  assert.equal(r25.delEjercicio, 1200);
  assert.equal(r25.valorNeto, 9800);
  const c = DP.cronograma(a);
  assert.equal(c[0].anio, 2024);
  assert.equal(c[c.length - 1].anio, 2034);
  assert.equal(c[c.length - 1].delEjercicio, 200);
  assert.equal(c.reduce((s, x) => s + x.delEjercicio, 0), 12000);
  const laptop = DP.enEjercicio({ costo: 4500, tasa: 25, inicio: '2025-03-15' }, 2026);
  assert.equal(laptop.acumuladaCierre, 2062.5);
  const res = DP.resumen([a, { costo: 4500, tasa: 25, inicio: '2025-03-15' }, { costo: 100, tasa: 10, inicio: '2030-01-01' }], 2026);
  assert.equal(res.filas.length, 2);
  assert.equal(res.totales.delEjercicio, 1200 + 1125);
  assert.ok(P.depreciacion.tipos.find(t => t.id === 'edificios').tasa === 5);
});

test('estado de resultados: MYPE, general, participación y tramo de 15 UIT', () => {
  const p = { general: 29.5, mype: { limiteUIT: 15, tasaHastaLimite: 10, tasaExceso: 29.5 }, uit: 5500 };
  const base = { ventas: 250000, costoVentas: 150000, gastosAdm: 40000, gastosVentas: 20000, gastosFin: 5000 };
  const mype = ER.calcular({ ...base, regimen: 'mype' }, p);
  assert.equal(mype.utilidadBruta, 100000);
  assert.equal(mype.utilidadOperativa, 40000);
  assert.equal(mype.resultadoAntes, 35000);
  assert.equal(mype.impuesto, 3500);
  assert.equal(mype.utilidadNeta, 31500);
  assert.equal(ER.calcular({ ...base, regimen: 'general' }, p).impuesto, 10325);
  const conPart = ER.calcular({ ...base, regimen: 'mype', participacionPct: 5 }, p);
  assert.equal(conPart.participacion, 1750);
  assert.equal(conPart.impuesto, 3325);
  const grande = ER.calcular({ ventas: 100000, regimen: 'mype' }, p);
  assert.equal(grande.impuesto, 8250 + 5162.5);
  const perdida = ER.calcular({ ventas: 1000, costoVentas: 5000, regimen: 'general' }, p);
  assert.equal(perdida.impuesto, 0);
  assert.equal(perdida.utilidadNeta, -4000);
});

test('ratios: valores y lecturas', () => {
  const r = RT.calcular({ activoCorriente: 180000, efectivo: 40000, cuentasCobrar: 60000, inventarios: 70000, activoTotal: 400000,
    pasivoCorriente: 100000, pasivoTotal: 180000, patrimonio: 220000, ventas: 250000, costoVentas: 150000,
    utilidadOperativa: 40000, utilidadNeta: 25000, gastosFinancieros: 5000 });
  const v = id => r.find(x => x.id === id);
  assert.equal(v('liquidez').valor, 1.8);
  assert.equal(v('liquidez').nivel, 'ok');
  assert.ok(Math.abs(v('acida').valor - 1.1) < 1e-9);
  assert.equal(v('endeudamiento').valor, 45);
  assert.equal(v('cobertura').valor, 8);
  assert.equal(v('roa').valor, 6.25);
  assert.ok(Math.abs(v('diasCobro').valor - 86.4) < 1e-9);
  assert.equal(v('diasCobro').nivel, 'warn');
  assert.equal(RT.calcular({ activoCorriente: 50, pasivoCorriente: 100 }).find(x => x.id === 'liquidez').nivel, 'mal');
  assert.equal(RT.calcular({}).length, 0);
});
