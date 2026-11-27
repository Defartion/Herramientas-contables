'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../compartido/parametros.js');
const IGV = require('../herramientas/igv/js/calculo.js');
const DT = require('../herramientas/detracciones/js/calculo.js');
const RC = require('../herramientas/renta-cuarta/js/calculo.js');

test('IGV: agregar y quitar, con composición IGV + IPM 2026', () => {
  const g = P.igv.general;
  assert.equal(g.igv + g.ipm, g.total);
  const a = IGV.calcular({ modo: 'agregar', monto: 1000, tasaTotal: 18, igvPct: 15.5, ipmPct: 2.5 });
  assert.deepEqual(a, { base: 1000, impuesto: 180, total: 1180, igv: 155, ipm: 25 });
  const q = IGV.calcular({ modo: 'quitar', monto: 1000, tasaTotal: 18 });
  assert.equal(q.base, 847.46);
  assert.equal(q.impuesto, 152.54);
  assert.equal(q.base + q.impuesto, 1000);
  const r = IGV.calcular({ modo: 'agregar', monto: 1000, tasaTotal: 10.5, igvPct: 8, ipmPct: 2.5 });
  assert.equal(r.impuesto, 105);
  assert.equal(r.igv, 80);
  assert.equal(r.ipm, 25);
  assert.ok(IGV.validar({ monto: 0, tasaTotal: 18 }).monto);
});

test('detracción: mínimo de S/ 700 y depósito sin decimales', () => {
  const d = DT.detraccion({ importe: 2360, tasa: 12, montoMinimo: 700 });
  assert.deepEqual(d, { aplica: true, exacto: 283.2, deposito: 283, neto: 2077 });
  assert.equal(DT.detraccion({ importe: 1004.5, tasa: 12, montoMinimo: 700 }).deposito, 121);
  assert.equal(DT.detraccion({ importe: 700, tasa: 12, montoMinimo: 700 }).aplica, false);
  assert.equal(DT.detraccion({ importe: 700, tasa: 12, montoMinimo: 700 }).neto, 700);
  assert.ok(P.detracciones.servicios.every(s => [4, 10, 12].includes(s.tasa)));
});

test('retención y percepción del IGV', () => {
  assert.deepEqual(DT.retencion({ importe: 1180, tasa: 3, montoMinimo: 700, esAgente: true }), { aplica: true, monto: 35.4, neto: 1144.6 });
  assert.equal(DT.retencion({ importe: 700, tasa: 3, montoMinimo: 700, esAgente: true }).monto, 0);
  assert.equal(DT.retencion({ importe: 5000, tasa: 3, montoMinimo: 700, esAgente: false }).monto, 0);
  assert.deepEqual(DT.percepcion({ importe: 1000, tasa: 2 }), { aplica: true, monto: 20, total: 1020 });
});

test('renta de 4.ª: retención por recibo y monto para un neto', () => {
  const p = { tasa: 8, minimo: 1500, clienteAgente: true, suspension: false };
  assert.deepEqual(RC.recibo(3000, p), { monto: 3000, aplica: true, retencion: 240, neto: 2760 });
  assert.equal(RC.recibo(1500, p).retencion, 0);
  assert.equal(RC.recibo(3000, { ...p, suspension: true }).retencion, 0);
  assert.equal(RC.recibo(3000, { ...p, clienteAgente: false }).retencion, 0);
  assert.equal(RC.desdeNeto(2760, p).monto, 3000);
  assert.equal(RC.desdeNeto(1450, p).monto, 1450);
  const x = RC.desdeNeto(1600, p);
  assert.equal(x.monto, 1739.14);
  assert.ok(x.neto >= 1600 && x.neto < 1600.02);
});

test('renta de 4.ª: impuesto anual con deducciones y tramos', () => {
  const base = { uit: 5500, deduccionPct: 20, deduccionTopeUIT: 24, deduccionUIT: 7, deduccionAdicionalUIT: 3,
    tramosUIT: P.rentaTrabajo.tramosUIT, limiteSuspension: 48125 };
  const a = RC.anual({ ...base, ingresos: 60000, retenido: 4800 });
  assert.equal(a.deduccion20, 12000);
  assert.equal(a.deduccion7, 38500);
  assert.equal(a.base, 9500);
  assert.equal(a.impuesto, 760);
  assert.equal(a.saldo, -4040);
  assert.equal(a.puedeSuspender, false);
  // Ingresos altos: tope de 24 UIT para el 20 % y varios tramos
  const b = RC.anual({ ...base, ingresos: 1000000, gastosDeducibles: 50000, retenido: 0 });
  assert.equal(b.deduccion20, 24 * 5500);
  assert.equal(b.gastos, 3 * 5500);
  const baseImp = 1000000 - 132000 - 38500 - 16500;
  const esperado = 27500 * 0.08 + 82500 * 0.14 + 82500 * 0.17 + 55000 * 0.20 + (baseImp - 247500) * 0.30;
  assert.ok(Math.abs(b.impuesto - esperado) < 0.01);
  assert.equal(RC.anual({ ...base, ingresos: 40000 }).puedeSuspender, true);
});
