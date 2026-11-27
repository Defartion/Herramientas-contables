// Pruebas de la lógica de cálculo. Ejecutar con:  npm test   (o: node --test)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../herramientas/calculadora-interes-simple/js/calculo.js');

const centimos = n => Math.round(n * 100) / 100;

// Copia fiel del cálculo de la versión 1 (antes de la reorganización), para
// comprobar que la versión actual da exactamente los mismos números.
function calculoVersion1(capital, tasaPct, plazoDias, impuestoPct, fechaInicioStr) {
  const tasaTotal = tasaPct / 100;
  const impuestoP = impuestoPct / 100;
  const tasaDiaria = tasaTotal / plazoDias;
  const [y, m, d] = fechaInicioStr.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  const fechaInicioObj = new Date(y, m - 1, d);
  const grupos = [];
  let ultimoDia = new Date(cursor);
  for (let i = 0; i < plazoDias; i++) {
    const yy = cursor.getFullYear();
    const mm = cursor.getMonth();
    let grupo = grupos.find(g => g.year === yy && g.month === mm);
    if (!grupo) { grupo = { year: yy, month: mm, dias: 0 }; grupos.push(grupo); }
    grupo.dias += 1;
    ultimoDia = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  let interesTotal = 0;
  grupos.forEach(g => { interesTotal += capital * tasaDiaria * g.dias; });
  const corta = f => String(f.getDate()).padStart(2, '0') + '/' + String(f.getMonth() + 1).padStart(2, '0') + '/' + f.getFullYear();
  const tramo1 = grupos[0];
  const interes1 = capital * tasaDiaria * tramo1.dias;
  const f1 = new Date(fechaInicioObj);
  f1.setDate(f1.getDate() + tramo1.dias - 1);
  let fechaFactura2 = null, interes2 = null, impuesto2 = null, diasTramo2 = 0;
  if (grupos.length > 1) {
    diasTramo2 = grupos.slice(1).reduce((acc, g) => acc + g.dias, 0);
    interes2 = capital * tasaDiaria * diasTramo2;
    impuesto2 = interes2 * impuestoP;
    fechaFactura2 = corta(ultimoDia);
  }
  return {
    interesTotal,
    impuestoTotal: interesTotal * impuestoP,
    totalPagar: capital + interesTotal,
    registro: {
      fechaInicioISO: fechaInicioStr,
      fechaFactura1: corta(f1),
      capital,
      interesDiario: capital * tasaDiaria,
      interes1,
      impuesto1: interes1 * impuestoP,
      diasTramo1: tramo1.dias,
      diasTramo2,
      fechaFactura2,
      interes2,
      impuesto2
    }
  };
}

function prestamo(capital, fechaInicioISO, tasaPct = 10, plazoDias = 24, impuestoPct = 5) {
  return C.calcularPrestamo({ capital, fechaInicioISO, tasaPct, plazoDias, impuestoPct });
}

test('ejemplo documentado: S/ 1000 desde el 20/11/2026', () => {
  const r = prestamo(1000, '2026-11-20');
  assert.equal(r.meses.length, 2);
  assert.equal(r.factura1.dias, 11);
  assert.equal(r.factura2.dias, 13);
  assert.equal(C.fechaCorta(r.factura1.fecha), '30/11/2026');
  assert.equal(C.fechaCorta(r.factura2.fecha), '13/12/2026');
  assert.equal(centimos(r.interesDiario), 4.17);
  assert.equal(centimos(r.factura1.interes), 45.83);
  assert.equal(centimos(r.factura1.impuesto), 2.29);
  assert.equal(centimos(r.factura2.interes), 54.17);
  assert.equal(centimos(r.factura2.impuesto), 2.71);
  assert.equal(centimos(r.interesTotal), 100);
  assert.equal(centimos(r.impuestoTotal), 5);
  assert.equal(centimos(r.totalPagar), 1100);
});

test('préstamo dentro de un solo mes no tiene factura 2', () => {
  const r = prestamo(500, '2026-03-01');
  assert.equal(r.meses.length, 1);
  assert.equal(r.factura2, null);
  assert.equal(r.factura1.dias, 24);
  assert.equal(C.fechaCorta(r.factura1.fecha), '24/03/2026');
  const reg = C.crearRegistro(r, 7, 123);
  assert.equal(reg.diasTramo2, 0);
  assert.equal(reg.fechaFactura2, null);
  assert.equal(reg.interes2, null);
});

test('cruce de año y año bisiesto', () => {
  const r1 = prestamo(1000, '2026-12-20');
  assert.equal(C.fechaCorta(r1.factura1.fecha), '31/12/2026');
  assert.equal(C.fechaCorta(r1.factura2.fecha), '12/01/2027');
  const r2 = prestamo(1000, '2028-02-20'); // 2028 es bisiesto
  assert.equal(r2.factura1.dias, 10);      // 20 al 29 de febrero
  const r3 = prestamo(1000, '2027-02-20');
  assert.equal(r3.factura1.dias, 9);       // 20 al 28 de febrero
});

test('plazo que abarca tres meses: la factura 2 agrupa los meses siguientes', () => {
  const r = prestamo(1000, '2026-01-25', 10, 40);
  assert.equal(r.meses.length, 3);
  assert.equal(r.factura1.dias, 7);
  assert.equal(r.factura2.dias, 33);
});

test('mismos resultados que la versión 1 en 2000 casos aleatorios', () => {
  let semilla = 42;
  const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 2000; i++) {
    const capital = Math.round(azar() * 500000) / 100 + 1;
    const tasa = Math.round(azar() * 3000) / 100;
    const plazo = 1 + Math.floor(azar() * 120);
    const imp = Math.round(azar() * 2000) / 100;
    const inicio = new Date(2024, 0, 1);
    inicio.setDate(inicio.getDate() + Math.floor(azar() * 1500));
    const iso = C.fechaAISO(inicio);

    const v1 = calculoVersion1(capital, tasa, plazo, imp, iso);
    const r = C.calcularPrestamo({ capital, tasaPct: tasa, plazoDias: plazo, impuestoPct: imp, fechaInicioISO: iso });
    const reg = C.crearRegistro(r, 1, 1);
    for (const campo of Object.keys(v1.registro)) {
      assert.equal(reg[campo], v1.registro[campo], `campo ${campo} con ${JSON.stringify({ capital, tasa, plazo, imp, iso })}`);
    }
    assert.equal(r.interesTotal, v1.interesTotal);
    assert.equal(r.impuestoTotal, v1.impuestoTotal);
    assert.equal(r.totalPagar, v1.totalPagar);
  }
});

test('validación de datos', () => {
  const ok = { capital: 100, fechaInicioISO: '2026-05-10', tasaPct: 10, plazoDias: 24, impuestoPct: 5 };
  assert.deepEqual(C.validarEntrada(ok), {});
  assert.ok(C.validarEntrada({ ...ok, capital: 0 }).capital);
  assert.ok(C.validarEntrada({ ...ok, capital: NaN }).capital);
  assert.ok(C.validarEntrada({ ...ok, fechaInicioISO: '2026-02-31' }).fechaInicioISO);
  assert.ok(C.validarEntrada({ ...ok, plazoDias: 2.5 }).plazoDias);
  assert.ok(C.validarEntrada({ ...ok, impuestoPct: 120 }).impuestoPct);
  assert.throws(() => C.calcularPrestamo({ ...ok, plazoDias: 0 }));
});

test('migración de registros de la primera versión', () => {
  const antiguos = [
    // Sin numeroContrato, interesDiario ni días por tramo.
    { id: 1, fechaInicioISO: '2026-09-20', fechaFactura1: '30/09/2026', capital: 1000,
      interes1: 1000 * 0.1 / 24 * 11, impuesto1: 1000 * 0.1 / 24 * 11 * 0.05,
      fechaFactura2: '13/10/2026', interes2: 1000 * 0.1 / 24 * 13, impuesto2: 1000 * 0.1 / 24 * 13 * 0.05 },
    { id: 2, numeroContrato: 5, fechaInicioISO: '2026-09-01', fechaFactura1: '24/09/2026', capital: 200,
      interes1: 20, impuesto1: 1, fechaFactura2: null, interes2: null, impuesto2: null }
  ];
  const copia = JSON.parse(JSON.stringify(antiguos));
  const { lista, contador, cambio } = C.migrarRegistros(antiguos, 0);
  assert.deepEqual(antiguos, copia, 'no debe modificar la lista original');
  assert.equal(cambio, true);
  assert.equal(lista[0].numeroContrato, 6);
  assert.equal(contador, 6);
  assert.equal(lista[0].diasTramo1, 11);
  assert.equal(lista[0].diasTramo2, 13);
  assert.equal(centimos(lista[0].interesDiario), 4.17);
  assert.equal(lista[1].diasTramo1, 24);
  assert.equal(lista[1].diasTramo2, 0);

  const otraVez = C.migrarRegistros(lista, contador);
  assert.equal(otraVez.cambio, false, 'migrar dos veces no cambia nada');
});

test('cronograma de pagos diarios', () => {
  const reg = C.crearRegistro(prestamo(1200, '2026-11-20'), 3, 9);
  const dias = C.construirDiasPago(reg);
  assert.equal(dias.length, 24);
  assert.equal(dias[0].fecha, '20/11/2026');
  assert.equal(dias[23].fecha, '13/12/2026');
  assert.equal(dias[0].sinInteres, 50);
  assert.equal(centimos(dias[23].acumulado), 120);
});

test('resumen mensual por fecha de factura', () => {
  const a = C.crearRegistro(prestamo(1000, '2026-11-20'), 1, 1); // F1 nov, F2 dic
  const b = C.crearRegistro(prestamo(1000, '2026-12-01'), 2, 2); // solo dic
  const res = C.resumenMensual([a, b]);
  assert.deepEqual(res.map(m => m.clave), ['2026-11', '2026-12']);
  assert.equal(res[0].facturas, 1);
  assert.equal(res[1].facturas, 2);
  assert.equal(centimos(res[0].interes), 45.83);
  assert.equal(centimos(res[1].interes), centimos(54.1666667 + 100));
  const tot = C.totalesTablero([a, b]);
  assert.equal(centimos(tot.interes), 200);
  assert.equal(centimos(tot.impuesto), 10);
});

test('validación de registros importados', () => {
  const reg = C.crearRegistro(prestamo(1000, '2026-11-20'), 1, 1);
  assert.equal(C.esRegistroValido(reg), true);
  assert.equal(C.esRegistroValido({ ...reg, capital: 'mil' }), false);
  assert.equal(C.esRegistroValido(null), false);
});
