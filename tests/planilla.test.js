'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../compartido/util.js');
const L = require('../compartido/laboral.js');
const P = require('../compartido/parametros.js');
const GR = require('../herramientas/gratificaciones/js/calculo.js');
const CT = require('../herramientas/cts/js/calculo.js');
const PL = require('../herramientas/planilla/js/calculo.js');
const LQ = require('../herramientas/liquidacion/js/calculo.js');

const reg = id => P.laboral.regimenes.find(r => r.id === id);
const cerca = (a, b, tol = 0.011) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

test('tiempo computable: meses completos, días sueltos y faltas', () => {
  const d = U.desdeISO;
  assert.deepEqual(L.tiempoComputable(d('2025-11-01'), d('2026-04-30'), 0), { meses: 6, dias: 0 });
  assert.deepEqual(L.tiempoComputable(d('2025-12-15'), d('2026-04-30'), 0), { meses: 4, dias: 17 });
  assert.deepEqual(L.tiempoComputable(d('2026-05-01'), d('2026-09-15'), 0), { meses: 4, dias: 15 });
  assert.deepEqual(L.tiempoComputable(d('2025-11-01'), d('2026-04-30'), 3), { meses: 5, dias: 27 });
  assert.equal(U.aISO(L.periodoCtsEnCurso(d('2026-12-10')).inicio), '2026-11-01');
  assert.equal(U.aISO(L.periodoCtsEnCurso(d('2026-02-10')).inicio), '2025-11-01');
  assert.equal(U.aISO(L.periodoCtsEnCurso(d('2026-07-10')).inicio), '2026-05-01');
});

test('gratificación: completa, proporcional, MYPE y bonificación', () => {
  const p = { rmv: 1230, asignacionPct: 10, factor: 1, bonificacionPct: 9 };
  const g = GR.calcular({ sueldo: 3000, asignacion: true, periodo: 'diciembre', anio: 2026, fechaIngreso: '2020-01-01' }, p);
  assert.equal(g.computable, 3123);
  assert.equal(g.meses, 6);
  assert.equal(g.monto, 3123);
  assert.equal(g.bonificacion, 281.07);
  assert.equal(g.total, 3404.07);
  const prop = GR.calcular({ sueldo: 3000, asignacion: true, periodo: 'diciembre', anio: 2026, fechaIngreso: '2026-08-10' }, p);
  assert.equal(prop.meses, 4);
  assert.equal(prop.monto, 2082);
  const pequena = GR.calcular({ sueldo: 3000, periodo: 'julio', anio: 2026, fechaIngreso: '2020-01-01' }, { ...p, factor: 0.5 });
  assert.equal(pequena.monto, 1500);
  const eps = GR.calcular({ sueldo: 2000, periodo: 'julio', anio: 2026, fechaIngreso: '2020-01-01' }, { ...p, bonificacionPct: 6.75 });
  assert.equal(eps.bonificacion, 135);
  const trunca = GR.calcular({ sueldo: 3000, periodo: 'julio', anio: 2026, fechaIngreso: '2020-01-01', fechaCese: '2026-04-20' }, p);
  assert.equal(trunca.meses, 3);
  assert.equal(U.aISO(GR.calcular({ sueldo: 1, periodo: 'julio', anio: 2026, fechaIngreso: '2020-01-01' }, p).limite), '2026-07-15');
});

test('CTS: semestre completo, ingreso a mitad de periodo y MYPE', () => {
  const p = { rmv: 1230, asignacionPct: 10, factorCts: 1, factorGrati: 1 };
  const c = CT.calcular({ sueldo: 3000, deposito: 'mayo', anio: 2026, fechaIngreso: '2020-01-01', gratificacion: 3000 }, p);
  assert.equal(c.computable, 3500);
  assert.deepEqual(c.tiempo, { meses: 6, dias: 0 });
  assert.equal(c.monto, 1750);
  // Ingresó el 15/12/2025: 4 meses y 17 días; la gratificación de diciembre estimada es 0.
  const m = CT.calcular({ sueldo: 3000, deposito: 'mayo', anio: 2026, fechaIngreso: '2025-12-15' }, p);
  assert.equal(m.gratificacion, 0);
  assert.deepEqual(m.tiempo, { meses: 4, dias: 17 });
  cerca(m.monto, 3000 / 12 * 4 + 3000 / 360 * 17);
  const pequena = CT.calcular({ sueldo: 3000, deposito: 'noviembre', anio: 2026, fechaIngreso: '2020-01-01' }, { ...p, factorCts: 0.5, factorGrati: 0.5 });
  assert.equal(pequena.gratificacion, 1500);
  assert.equal(pequena.computable, 3250);
  assert.equal(pequena.monto, 812.5); // 3 250 × 0,5 ÷ 12 × 6
  const nueva = CT.calcular({ sueldo: 3000, deposito: 'noviembre', anio: 2026, fechaIngreso: '2026-10-20' }, p);
  assert.equal(nueva.monto, 0);
  assert.equal(nueva.motivo, 'menos-de-un-mes');
  assert.equal(U.aISO(c.limite), '2026-05-15');
});

test('sueldo neto: AFP con tope, ONP, renta de 5.ª y costo empresa', () => {
  const base = {
    rmv: 1230, asignacionPct: 10, uit: 5500, deduccionUIT: 7, tramosUIT: P.rentaTrabajo.tramosUIT, onpPct: 13,
    afp: { aportePct: 10, primaPct: 1.37, rma: 12732.70, comisionPct: 1.55 }, essaludPct: 9, bonificacionPct: 9,
    regimen: reg('general')
  };
  const afp = PL.calcular({ sueldo: 5000, sistema: 'afp', comisionTipo: 'flujo' }, base);
  assert.equal(afp.pension.aporte, 500);
  assert.equal(afp.pension.prima, 68.5);
  assert.equal(afp.pension.comision, 77.5);
  // Renta: 5000 × 14 × … = 70 000 + bonificación 900 = 70 900 − 38 500 = 32 400 → 27 500 × 8 % + 4 900 × 14 % = 2 886
  assert.equal(afp.renta.anual, 2886);
  assert.equal(afp.renta.mensual, 240.5);
  assert.equal(afp.neto, 5000 - 646 - 240.5);
  const alto = PL.calcular({ sueldo: 20000, sistema: 'afp', comisionTipo: 'saldo' }, base);
  assert.equal(alto.pension.prima, U.r2(12732.70 * 0.0137));
  assert.equal(alto.pension.comision, 0);
  const onp = PL.calcular({ sueldo: 1230, asignacion: true, sistema: 'onp' }, base);
  assert.equal(onp.bruto, 1353);
  assert.equal(onp.pension.onp, 175.89);
  assert.equal(onp.renta.anual, 0);
  assert.equal(onp.empresa.essalud, 121.77);
});

test('liquidación: renuncia y despido arbitrario', () => {
  const p = { rmv: 1230, asignacionPct: 10, bonificacionPct: 9, regimen: reg('general') };
  const e = { fechaIngreso: '2023-03-01', fechaCese: '2026-09-15', motivo: 'renuncia', sueldo: 2500 };
  const r = LQ.calcular(e, p);
  const c = id => r.conceptos.find(x => x.id === id);
  assert.equal(r.ultimaGrati, 2500);
  cerca(c('cts').monto, 2916.6667 / 12 * 4 + 2916.6667 / 360 * 15);
  assert.equal(c('grati').monto, 833.33);
  assert.equal(c('bonif').monto, 75);
  cerca(c('vac-truncas').monto, 1250 + 2500 / 360 * 15);
  assert.equal(c('indemnizacion'), undefined);
  const d = LQ.calcular({ ...e, motivo: 'despido', vacacionesPendientes: 15 }, p);
  cerca(d.conceptos.find(x => x.id === 'indemnizacion').monto, 3750 * (3 + 6 / 12 + 15 / 360));
  assert.equal(d.conceptos.find(x => x.id === 'vac-pendientes').monto, 1250);
  // Tope de 12 remuneraciones
  const largo = LQ.calcular({ ...e, fechaIngreso: '2010-01-01', motivo: 'despido' }, p);
  assert.equal(largo.indemnizacion.monto, 30000);
  // Microempresa: sin CTS ni gratificación, 10 remuneraciones diarias por año
  const micro = LQ.calcular({ ...e, motivo: 'despido' }, { ...p, regimen: reg('micro') });
  assert.equal(micro.conceptos.find(x => x.id === 'cts').monto, 0);
  assert.equal(micro.conceptos.find(x => x.id === 'grati').monto, 0);
  cerca(micro.indemnizacion.monto, 2500 / 30 * 10 * (3 + 6 / 12 + 15 / 360));
  // Despido en periodo de prueba
  const prueba = LQ.calcular({ ...e, fechaIngreso: '2026-08-01', motivo: 'despido' }, p);
  assert.equal(prueba.indemnizacion.monto, 0);
});
