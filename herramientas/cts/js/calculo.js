/* CTS: depósito de mayo (nov–abr) o noviembre (may–oct). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica(require('../../../compartido/util.js'), require('../../../compartido/laboral.js'));
  } else {
    raiz.CalcCTS = fabrica(raiz.Util, raiz.Laboral);
  }
})(typeof self !== 'undefined' ? self : this, function (U, L) {
  'use strict';

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.sueldo) || e.sueldo <= 0) err.sueldo = 'Ingresa el sueldo mensual.';
    if (!Number.isInteger(e.anio) || e.anio < 2000 || e.anio > 2100) err.anio = 'Ingresa un año válido.';
    if (!U.desdeISO(e.fechaIngreso)) err.fechaIngreso = 'Ingresa la fecha de ingreso.';
    if (U.esNumero(e.variables) && e.variables < 0) err.variables = 'No puede ser negativo.';
    if (U.esNumero(e.gratificacion) && e.gratificacion < 0) err.gratificacion = 'No puede ser negativa.';
    if (U.esNumero(e.faltas) && (!Number.isInteger(e.faltas) || e.faltas < 0)) err.faltas = 'Ingresa un número entero de días.';
    return err;
  }

  /** p: { rmv, asignacionPct, factorCts, factorGrati } */
  function calcular(e, p) {
    const asignacion = e.asignacion ? U.r2(p.rmv * p.asignacionPct / 100) : 0;
    const variables = U.esNumero(e.variables) ? e.variables : 0;
    const remuneracion = U.r2(e.sueldo + asignacion + variables);
    const ingreso = U.desdeISO(e.fechaIngreso);
    const periodo = L.periodoCts(e.deposito, e.anio);

    // Gratificación del semestre: diciembre para el depósito de mayo, julio para el de noviembre.
    const periodoGrati = e.deposito === 'mayo'
      ? L.periodoGratificacion('diciembre', e.anio - 1)
      : L.periodoGratificacion('julio', e.anio);
    const gratiEstimada = L.gratificacion({
      computable: remuneracion, ingreso, cese: null, periodo: periodoGrati, factor: p.factorGrati, bonificacionPct: 0
    }).monto;
    const usaEstimada = !U.esNumero(e.gratificacion);
    const gratificacion = usaEstimada ? gratiEstimada : e.gratificacion;
    const computable = U.r2(L.computableCts(remuneracion, gratificacion));

    const base = { asignacion, variables, remuneracion, gratificacion, usaEstimada, periodoGrati, computable, periodo,
      limite: U.siguienteHabil(periodo.limite) };

    if (ingreso > periodo.fin) return { ...base, motivo: 'posterior', desde: null, tiempo: { meses: 0, dias: 0 }, monto: 0 };
    const servicio = U.tiempoServicio(ingreso, periodo.fin);
    if (servicio.anios * 12 + servicio.meses < 1) {
      return { ...base, motivo: 'menos-de-un-mes', desde: ingreso, tiempo: { meses: 0, dias: 0 }, monto: 0 };
    }
    const desde = ingreso > periodo.inicio ? ingreso : periodo.inicio;
    const tiempo = L.tiempoComputable(desde, periodo.fin, U.esNumero(e.faltas) ? e.faltas : 0);
    const monto = L.cts({ computable, meses: tiempo.meses, dias: tiempo.dias, factor: p.factorCts });
    return { ...base, motivo: null, desde, tiempo, monto };
  }

  return { validar, calcular };
});
