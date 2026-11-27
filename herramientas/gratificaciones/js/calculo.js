/* Gratificación de julio o diciembre (también trunca si hay fecha de cese). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica(require('../../../compartido/util.js'), require('../../../compartido/laboral.js'));
  } else {
    raiz.CalcGratificacion = fabrica(raiz.Util, raiz.Laboral);
  }
})(typeof self !== 'undefined' ? self : this, function (U, L) {
  'use strict';

  function validar(e) {
    const err = {};
    if (!U.esNumero(e.sueldo) || e.sueldo <= 0) err.sueldo = 'Ingresa el sueldo mensual.';
    if (!Number.isInteger(e.anio) || e.anio < 2000 || e.anio > 2100) err.anio = 'Ingresa un año válido.';
    const ingreso = U.desdeISO(e.fechaIngreso);
    if (!ingreso) err.fechaIngreso = 'Ingresa la fecha de ingreso.';
    if (e.fechaCese) {
      const cese = U.desdeISO(e.fechaCese);
      if (!cese) err.fechaCese = 'Ingresa una fecha válida o déjala vacía.';
      else if (ingreso && cese < ingreso) err.fechaCese = 'La fecha de cese es anterior al ingreso.';
    }
    if (U.esNumero(e.variables) && e.variables < 0) err.variables = 'No puede ser negativo.';
    return err;
  }

  /** p: { rmv, asignacionPct, factor, bonificacionPct } */
  function calcular(e, p) {
    const asignacion = e.asignacion ? U.r2(p.rmv * p.asignacionPct / 100) : 0;
    const variables = U.esNumero(e.variables) ? e.variables : 0;
    const computable = U.r2(e.sueldo + asignacion + variables);
    const periodo = L.periodoGratificacion(e.periodo, e.anio);
    const g = L.gratificacion({
      computable,
      ingreso: U.desdeISO(e.fechaIngreso),
      cese: e.fechaCese ? U.desdeISO(e.fechaCese) : null,
      periodo,
      factor: p.factor,
      bonificacionPct: p.bonificacionPct
    });
    return { asignacion, variables, computable, periodo, limite: U.siguienteHabil(periodo.limite), ...g };
  }

  return { validar, calcular };
});
