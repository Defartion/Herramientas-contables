(function () {
  'use strict';
  const C = window.RentaCuarta;
  const P = window.Parametros;
  const $ = HC.$;
  const RC = P.rentaCuarta;
  const RT = P.rentaTrabajo;

  const f = HC.formulario('form', [
    { id: 'modo', etiqueta: '¿Qué monto tienes?', tipo: 'segmento', valor: 'recibo',
      opciones: [['recibo', 'Monto del recibo'], ['neto', 'Neto que quiero recibir']] },
    { id: 'monto', etiqueta: 'Monto', tipo: 'dinero', valor: 3000, min: 0 },
    { id: 'clienteAgente', etiqueta: 'El cliente es una empresa o entidad (agente de retención)', tipo: 'check', valor: true },
    { id: 'suspension', etiqueta: 'Tengo constancia de suspensión de retenciones', tipo: 'check', valor: false },
    { seccion: 'Proyección del año (opcional)' },
    { id: 'ingresosAnuales', etiqueta: 'Ingresos del año por recibos por honorarios', tipo: 'dinero', valor: '',
      ayuda: 'Total del año, real o proyectado.' },
    { grupo: [
      { id: 'gastosDeducibles', etiqueta: 'Gastos deducibles adicionales', tipo: 'dinero', valor: '',
        ayuda: `Alquiler, restaurantes, etc. Tope ${RT.deduccionAdicionalUIT} UIT.` },
      { id: 'retencionesAnio', etiqueta: 'Retenciones y pagos a cuenta del año', tipo: 'dinero', valor: '',
        ayuda: 'Si lo dejas vacío, se estima con el 8 %.' }
    ] },
    { seccion: 'Valores vigentes' },
    { grupo: [
      { id: 'tasa', etiqueta: 'Tasa de retención', tipo: 'pct', valor: RC.tasaRetencion, parametro: true },
      { id: 'minimo', etiqueta: 'Retienen si el recibo supera', tipo: 'dinero', valor: RC.montoMinimoRecibo, parametro: true },
      { id: 'uit', etiqueta: 'UIT', tipo: 'dinero', valor: P.uit.valor, parametro: true, ayuda: P.uit.fuente }
    ] }
  ], { clave: 'renta-cuarta' });

  f.alCambiar(v => {
    const errs = C.validar(v);
    if (!U_ok(v.tasa) || v.tasa > 100) errs.tasa = 'Ingresa la tasa.';
    if (!U_ok(v.minimo)) errs.minimo = 'Ingresa el monto mínimo.';
    if (!U_ok(v.uit) || v.uit <= 0) errs.uit = 'Ingresa la UIT.';
    if (!f.errores(errs)) {
      $('resultado').innerHTML = HC.vacio('Ingresa el monto del recibo.', 'fa-file-signature');
      return;
    }
    const p = { tasa: v.tasa, minimo: v.minimo, clienteAgente: v.clienteAgente, suspension: v.suspension };
    const r = v.modo === 'neto' ? C.desdeNeto(v.monto, p) : C.recibo(v.monto, p);

    let motivo = '';
    if (!r.aplica) {
      motivo = !v.clienteAgente ? 'Las personas naturales sin negocio no retienen.'
        : v.suspension ? 'Con la constancia de suspensión no te retienen.'
          : `Solo se retiene si el recibo supera ${HC.dinero(v.minimo)}.`;
    }

    let html =
      HC.stats([
        { etiqueta: 'Monto del recibo', valor: HC.dinero(r.monto), acento: v.modo === 'neto' },
        { etiqueta: `Retención (${HC.numero(v.tasa, 0)} %)`, valor: HC.dinero(r.retencion) },
        { etiqueta: 'Neto a recibir', valor: HC.dinero(r.neto), acento: v.modo !== 'neto' }
      ]) +
      (r.aplica
        ? HC.nota('La retención es un pago a cuenta de tu impuesto anual: se descuenta en la declaración de renta.')
        : HC.nota('No hay retención. ' + motivo, 'ok'));

    if (U_ok(v.ingresosAnuales) && v.ingresosAnuales > 0) {
      const a = C.anual({
        ingresos: v.ingresosAnuales,
        gastosDeducibles: v.gastosDeducibles,
        retenido: U_ok(v.retencionesAnio) ? v.retencionesAnio : v.ingresosAnuales * v.tasa / 100,
        uit: v.uit,
        deduccionPct: RC.deduccionPct,
        deduccionTopeUIT: RC.deduccionTopeUIT,
        deduccionUIT: RT.deduccionUIT,
        deduccionAdicionalUIT: RT.deduccionAdicionalUIT,
        tramosUIT: RT.tramosUIT,
        limiteSuspension: RC.limiteSuspension
      });
      html += '<h3>Impuesto anual estimado</h3>' +
        HC.lineas([
          { etiqueta: 'Ingresos del año', valor: HC.dinero(a.ingresos) },
          { etiqueta: `Deducción de ${RC.deduccionPct} % (tope ${RC.deduccionTopeUIT} UIT)`, valor: '−' + HC.dinero(a.deduccion20), clase: 'sub' },
          { etiqueta: `Deducción de ${RT.deduccionUIT} UIT`, valor: '−' + HC.dinero(a.deduccion7), clase: 'sub' },
          a.gastos > 0 ? { etiqueta: 'Gastos deducibles', valor: '−' + HC.dinero(a.gastos), clase: 'sub' } : null,
          { etiqueta: 'Renta neta imponible', valor: HC.dinero(a.base), clase: 'fuerte' },
          { etiqueta: 'Impuesto (tramos de 8 % a 30 %)', valor: HC.dinero(a.impuesto) },
          { etiqueta: U_ok(v.retencionesAnio) ? 'Retenciones y pagos a cuenta' : 'Retenciones estimadas (8 %)', valor: '−' + HC.dinero(a.retenido) },
          { etiqueta: a.saldo >= 0 ? 'Saldo por pagar' : 'Saldo a favor (devolución)', valor: HC.dinero(Math.abs(a.saldo)), clase: 'big',
            claseValor: a.saldo >= 0 ? '' : 'positivo' }
        ]) +
        (a.puedeSuspender
          ? HC.nota(`Con ingresos de hasta ${HC.dinero(RC.limiteSuspension)} al año puedes pedir la suspensión de retenciones y pagos a cuenta (${HC.dinero(RC.limiteSuspensionDirectores)} si eres director, síndico o similar).`, 'ok')
          : HC.nota(`Tus ingresos superan ${HC.dinero(RC.limiteSuspension)}: no corresponde la suspensión de retenciones este año.`, 'warn')) +
        HC.nota('Cálculo solo con rentas de 4.ª categoría. Si también tienes sueldo en planilla (5.ª categoría), ambas se suman en una sola base.');
    }
    $('resultado').innerHTML = html + HC.fuente('Fuente: ' + RC.fuente + '; ' + RT.fuente + '.');
  });

  function U_ok(n) { return typeof n === 'number' && Number.isFinite(n) && n >= 0; }
})();
