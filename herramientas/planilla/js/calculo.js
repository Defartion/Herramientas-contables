/* Sueldo neto: descuentos del trabajador, aportes y costo mensual para la empresa. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica(require('../../../compartido/util.js'), require('../../../compartido/laboral.js'));
  } else {
    raiz.Planilla = fabrica(raiz.Util, raiz.Laboral);
  }
})(typeof self !== 'undefined' ? self : this, function (U, L) {
  'use strict';

  const n0 = n => (U.esNumero(n) ? n : 0);

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.sueldo) || e.sueldo <= 0) err.sueldo = 'Ingresa el sueldo mensual.';
    if (U.esNumero(e.otros) && e.otros < 0) err.otros = 'No puede ser negativo.';
    return err;
  }

  /**
   * p: { rmv, asignacionPct, uit, deduccionUIT, tramosUIT, onpPct,
   *      afp: { aportePct, primaPct, rma, comisionPct }, essaludPct, bonificacionPct,
   *      regimen: { factorGrati, factorCts, vacacionesDias } }
   */
  function calcular(e, p) {
    const asignacion = e.asignacion ? U.r2(p.rmv * p.asignacionPct / 100) : 0;
    const otros = n0(e.otros);
    const bruto = U.r2(e.sueldo + asignacion + otros);
    const computable = bruto; // se asume que los otros ingresos son regulares

    // Pensiones
    const pension = { tipo: e.sistema, onp: 0, aporte: 0, prima: 0, comision: 0, total: 0 };
    if (e.sistema === 'onp') {
      pension.onp = U.r2(bruto * p.onpPct / 100);
    } else if (e.sistema === 'afp') {
      pension.aporte = U.r2(bruto * p.afp.aportePct / 100);
      pension.prima = U.r2(Math.min(bruto, p.afp.rma) * p.afp.primaPct / 100);
      pension.comision = e.comisionTipo === 'saldo' ? 0 : U.r2(bruto * p.afp.comisionPct / 100);
    }
    pension.total = U.r2(pension.onp + pension.aporte + pension.prima + pension.comision);

    // Renta de 5.ª: 12 sueldos + gratificaciones con su bonificación (proyección simple).
    const gratificacionesAnio = U.r2(2 * computable * p.regimen.factorGrati);
    const bonificacionesAnio = U.r2(gratificacionesAnio * p.bonificacionPct / 100);
    const renta = L.rentaQuinta({
      ingresoAnual: bruto * 12 + gratificacionesAnio + bonificacionesAnio,
      uit: p.uit, deduccionUIT: p.deduccionUIT, tramosUIT: p.tramosUIT
    });

    const descuentos = U.r2(pension.total + renta.mensual);
    const neto = U.r2(bruto - descuentos);

    // Empresa: EsSalud (base mínima: RMV) y provisiones mensuales de beneficios.
    const essalud = U.r2(Math.max(bruto, p.rmv) * p.essaludPct / 100);
    const provGrati = U.r2((gratificacionesAnio + bonificacionesAnio) / 12);
    const provCts = U.r2(p.regimen.factorCts * (computable + computable * p.regimen.factorGrati / 6) / 12);
    const provVacaciones = U.r2(computable * (p.regimen.vacacionesDias / 30) / 12);
    const costoTotal = U.r2(bruto + essalud + provGrati + provCts + provVacaciones);

    return {
      asignacion, otros, bruto, pension, renta, descuentos, neto,
      gratificacionesAnio, bonificacionesAnio,
      empresa: { essalud, provGrati, provCts, provVacaciones, costoTotal }
    };
  }

  return { validar, calcular };
});
