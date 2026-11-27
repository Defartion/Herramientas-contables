/* Ratios financieros con una interpretación general (referencial, depende del sector). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.Ratios = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const ok = n => U.esNumero(n);
  const div = (a, b) => (ok(a) && ok(b) && b !== 0 ? a / b : NaN);

  /** Busca el nivel según límites: [[hasta, nivel, texto], ...] (el último sin límite). */
  function nivel(valor, escala) {
    for (const [hasta, n, texto] of escala) {
      if (hasta === null || valor < hasta) return { nivel: n, texto };
    }
    return { nivel: 'info', texto: '' };
  }

  const DEFINICIONES = [
    { id: 'liquidez', grupo: 'Liquidez', nombre: 'Liquidez corriente', formula: 'Activo corriente ÷ Pasivo corriente', unidad: 'veces',
      calc: e => div(e.activoCorriente, e.pasivoCorriente),
      escala: [[1, 'mal', 'Podría no cubrir sus deudas de corto plazo.'], [1.5, 'warn', 'Liquidez ajustada.'],
        [2.5, 'ok', 'Liquidez adecuada.'], [null, 'info', 'Liquidez alta: puede haber recursos sin usar.']] },
    { id: 'acida', grupo: 'Liquidez', nombre: 'Prueba ácida', formula: '(Activo corriente − Inventarios) ÷ Pasivo corriente', unidad: 'veces',
      calc: e => div(e.activoCorriente - (ok(e.inventarios) ? e.inventarios : 0), e.pasivoCorriente),
      escala: [[0.8, 'warn', 'Depende de vender inventario para pagar sus deudas.'], [null, 'ok', 'Cubre sus deudas sin vender inventario.']] },
    { id: 'defensiva', grupo: 'Liquidez', nombre: 'Prueba defensiva', formula: 'Efectivo ÷ Pasivo corriente', unidad: '%',
      calc: e => div(e.efectivo, e.pasivoCorriente) * 100,
      escala: [[20, 'warn', 'Poco efectivo disponible frente a sus deudas.'], [null, 'ok', 'Efectivo suficiente para el día a día.']] },
    { id: 'capitalTrabajo', grupo: 'Liquidez', nombre: 'Capital de trabajo', formula: 'Activo corriente − Pasivo corriente', unidad: 'S/',
      calc: e => (ok(e.activoCorriente) && ok(e.pasivoCorriente) ? e.activoCorriente - e.pasivoCorriente : NaN),
      escala: [[0, 'mal', 'Las deudas de corto plazo superan los activos corrientes.'], [null, 'ok', 'Tiene un colchón para operar.']] },

    { id: 'endeudamiento', grupo: 'Endeudamiento', nombre: 'Endeudamiento del activo', formula: 'Pasivo total ÷ Activo total', unidad: '%',
      calc: e => div(e.pasivoTotal, e.activoTotal) * 100,
      escala: [[50, 'ok', 'La mayor parte de los activos se financia con recursos propios.'], [70, 'warn', 'Endeudamiento moderado.'],
        [null, 'mal', 'Muy endeudada: los acreedores financian la mayor parte.']] },
    { id: 'patrimonial', grupo: 'Endeudamiento', nombre: 'Endeudamiento patrimonial', formula: 'Pasivo total ÷ Patrimonio', unidad: 'veces',
      calc: e => div(e.pasivoTotal, e.patrimonio),
      escala: [[0, 'mal', 'Patrimonio negativo.'], [1, 'ok', 'Las deudas son menores que el patrimonio.'], [2, 'warn', 'Las deudas superan al patrimonio.'],
        [null, 'mal', 'Las deudas duplican o más al patrimonio.']] },
    { id: 'cobertura', grupo: 'Endeudamiento', nombre: 'Cobertura de intereses', formula: 'Utilidad operativa ÷ Gastos financieros', unidad: 'veces',
      calc: e => div(e.utilidadOperativa, e.gastosFinancieros),
      escala: [[1.5, 'mal', 'La operación apenas cubre los intereses.'], [3, 'warn', 'Cobertura ajustada.'], [null, 'ok', 'Cubre holgadamente sus intereses.']] },

    { id: 'margenBruto', grupo: 'Rentabilidad', nombre: 'Margen bruto', formula: '(Ventas − Costo de ventas) ÷ Ventas', unidad: '%',
      calc: e => div(e.ventas - e.costoVentas, e.ventas) * 100,
      escala: [[0, 'mal', 'Vende por debajo de su costo.'], [null, 'info', 'Compáralo con empresas de su mismo rubro.']] },
    { id: 'margenOperativo', grupo: 'Rentabilidad', nombre: 'Margen operativo', formula: 'Utilidad operativa ÷ Ventas', unidad: '%',
      calc: e => div(e.utilidadOperativa, e.ventas) * 100,
      escala: [[0, 'mal', 'La operación genera pérdida.'], [null, 'info', 'Ganancia de la operación por cada sol vendido.']] },
    { id: 'margenNeto', grupo: 'Rentabilidad', nombre: 'Margen neto', formula: 'Utilidad neta ÷ Ventas', unidad: '%',
      calc: e => div(e.utilidadNeta, e.ventas) * 100,
      escala: [[0, 'mal', 'Pérdida en el periodo.'], [null, 'info', 'Ganancia final por cada sol vendido.']] },
    { id: 'roa', grupo: 'Rentabilidad', nombre: 'Rentabilidad del activo (ROA)', formula: 'Utilidad neta ÷ Activo total', unidad: '%',
      calc: e => div(e.utilidadNeta, e.activoTotal) * 100,
      escala: [[0, 'mal', 'Los activos no están generando ganancia.'], [null, 'info', 'Ganancia por cada sol invertido en activos.']] },
    { id: 'roe', grupo: 'Rentabilidad', nombre: 'Rentabilidad del patrimonio (ROE)', formula: 'Utilidad neta ÷ Patrimonio', unidad: '%',
      calc: e => div(e.utilidadNeta, e.patrimonio) * 100,
      escala: [[0, 'mal', 'Los dueños están perdiendo.'], [null, 'info', 'Ganancia para los dueños por cada sol aportado.']] },

    { id: 'rotacionActivos', grupo: 'Gestión', nombre: 'Rotación de activos', formula: 'Ventas ÷ Activo total', unidad: 'veces',
      calc: e => div(e.ventas, e.activoTotal), escala: [[null, 'info', 'Ventas generadas por cada sol de activos.']] },
    { id: 'diasInventario', grupo: 'Gestión', nombre: 'Días de inventario', formula: '360 ÷ (Costo de ventas ÷ Inventarios)', unidad: 'días',
      calc: e => div(360, div(e.costoVentas, e.inventarios)), escala: [[null, 'info', 'Días que el inventario tarda en venderse.']] },
    { id: 'diasCobro', grupo: 'Gestión', nombre: 'Periodo promedio de cobro', formula: 'Cuentas por cobrar ÷ Ventas × 360', unidad: 'días',
      calc: e => div(e.cuentasCobrar, e.ventas) * 360,
      escala: [[60, 'ok', 'Cobra en un plazo razonable.'], [90, 'warn', 'Cobranza algo lenta.'], [null, 'mal', 'Cobranza lenta: revisa los créditos a clientes.']] }
  ];

  function calcular(e) {
    return DEFINICIONES.map(d => {
      const valor = d.calc(e);
      if (!Number.isFinite(valor)) return null;
      return { id: d.id, grupo: d.grupo, nombre: d.nombre, formula: d.formula, unidad: d.unidad, valor, ...nivel(valor, d.escala) };
    }).filter(Boolean);
  }

  function validar(e) {
    const err = {};
    ['activoCorriente', 'efectivo', 'cuentasCobrar', 'inventarios', 'activoTotal', 'pasivoCorriente', 'pasivoTotal', 'ventas',
      'costoVentas', 'gastosFinancieros'].forEach(c => {
      if (U.esNumero(e[c]) && e[c] < 0) err[c] = 'Ingresa el monto en positivo.';
    });
    if (U.esNumero(e.activoTotal) && U.esNumero(e.activoCorriente) && e.activoCorriente > e.activoTotal) {
      err.activoCorriente = 'El activo corriente no puede ser mayor que el activo total.';
    }
    return err;
  }

  return { DEFINICIONES, calcular, validar };
});
