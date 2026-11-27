/* Liquidación de beneficios sociales al cese. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica(require('../../../compartido/util.js'), require('../../../compartido/laboral.js'));
  } else {
    raiz.Liquidacion = fabrica(raiz.Util, raiz.Laboral);
  }
})(typeof self !== 'undefined' ? self : this, function (U, L) {
  'use strict';

  function validar(e) {
    const err = {};
    const ingreso = U.desdeISO(e.fechaIngreso);
    const cese = U.desdeISO(e.fechaCese);
    if (!ingreso) err.fechaIngreso = 'Ingresa la fecha de ingreso.';
    if (!cese) err.fechaCese = 'Ingresa la fecha de cese.';
    else if (ingreso && cese < ingreso) err.fechaCese = 'La fecha de cese es anterior al ingreso.';
    if (!U.esNumero(e.sueldo) || e.sueldo <= 0) err.sueldo = 'Ingresa el sueldo mensual.';
    if (U.esNumero(e.variables) && e.variables < 0) err.variables = 'No puede ser negativo.';
    if (U.esNumero(e.vacacionesPendientes) && e.vacacionesPendientes < 0) err.vacacionesPendientes = 'No puede ser negativo.';
    if (U.esNumero(e.ultimaGratificacion) && e.ultimaGratificacion < 0) err.ultimaGratificacion = 'No puede ser negativa.';
    return err;
  }

  /**
   * p: { rmv, asignacionPct, bonificacionPct,
   *      regimen: { factorCts, factorGrati, vacacionesDias, indemnizacion } }
   */
  function calcular(e, p) {
    const ingreso = U.desdeISO(e.fechaIngreso);
    const cese = U.desdeISO(e.fechaCese);
    const asignacion = e.asignacion ? U.r2(p.rmv * p.asignacionPct / 100) : 0;
    const variables = U.esNumero(e.variables) ? e.variables : 0;
    const remuneracion = U.r2(e.sueldo + asignacion + variables);
    const servicio = U.tiempoServicio(ingreso, cese);
    const mesesServicio = servicio.anios * 12 + servicio.meses;
    const R = p.regimen;
    const conceptos = [];

    // CTS trunca (con 1/6 de la última gratificación).
    const periodoGrati = L.ultimaGratificacionAntesDe(cese);
    const gratiEstimada = L.gratificacion({
      computable: remuneracion, ingreso, cese: null, periodo: periodoGrati, factor: R.factorGrati, bonificacionPct: 0
    }).monto;
    const ultimaGrati = U.esNumero(e.ultimaGratificacion) ? e.ultimaGratificacion : gratiEstimada;
    const periodoCts = L.periodoCtsEnCurso(cese);
    const desdeCts = ingreso > periodoCts.inicio ? ingreso : periodoCts.inicio;
    const tiempoCts = L.tiempoComputable(desdeCts, cese, 0);
    const computableCts = U.r2(L.computableCts(remuneracion, ultimaGrati));
    const cts = mesesServicio >= 1 ? L.cts({ computable: computableCts, meses: tiempoCts.meses, dias: tiempoCts.dias, factor: R.factorCts }) : 0;
    conceptos.push({
      id: 'cts', concepto: 'CTS trunca', monto: cts, afecto: false,
      detalle: `${tiempoCts.meses} meses y ${tiempoCts.dias} días desde el ${U.corta(desdeCts)}`
    });

    // Gratificación trunca del semestre en curso.
    const semestre = cese.getMonth() <= 5
      ? L.periodoGratificacion('julio', cese.getFullYear())
      : L.periodoGratificacion('diciembre', cese.getFullYear());
    const gt = L.gratificacion({ computable: remuneracion, ingreso, cese, periodo: semestre, factor: R.factorGrati, bonificacionPct: p.bonificacionPct });
    conceptos.push({ id: 'grati', concepto: 'Gratificación trunca', monto: gt.monto, afecto: false,
      detalle: `${gt.meses} meses completos del semestre ${semestre.tipo === 'julio' ? 'enero–junio' : 'julio–diciembre'}` });
    conceptos.push({ id: 'bonif', concepto: 'Bonificación extraordinaria', monto: gt.bonificacion, afecto: false,
      detalle: `${p.bonificacionPct} % de la gratificación trunca` });

    // Vacaciones truncas y pendientes.
    const vt = L.vacacionesTruncas({ remuneracion, ingreso, cese, diasPorAnio: R.vacacionesDias });
    conceptos.push({ id: 'vac-truncas', concepto: 'Vacaciones truncas', monto: vt.monto, afecto: true,
      detalle: `${vt.meses} meses y ${vt.dias} días desde el ${U.corta(vt.desde)} (${R.vacacionesDias} días por año)` });
    const diasPendientes = U.esNumero(e.vacacionesPendientes) ? e.vacacionesPendientes : 0;
    if (diasPendientes > 0) {
      conceptos.push({ id: 'vac-pendientes', concepto: 'Vacaciones pendientes (no gozadas)', afecto: true,
        monto: U.r2(remuneracion / 30 * diasPendientes), detalle: `${diasPendientes} días × remuneración diaria` });
    }

    // Indemnización por despido arbitrario.
    let indemnizacion = null;
    if (e.motivo === 'despido') {
      if (R.indemnizacion.tipo === 'remuneraciones' && mesesServicio < 3) {
        indemnizacion = { monto: 0, enPrueba: true };
      } else {
        indemnizacion = L.indemnizacion({ remuneracion, tiempo: servicio, regla: R.indemnizacion });
      }
      conceptos.push({ id: 'indemnizacion', concepto: 'Indemnización por despido arbitrario', monto: indemnizacion.monto, afecto: false,
        detalle: indemnizacion.enPrueba ? 'No corresponde dentro del periodo de prueba (3 meses)'
          : `${servicio.anios} años, ${servicio.meses} meses y ${servicio.dias} días de servicio${indemnizacion.topeAplicado ? ' (se aplicó el tope)' : ''}` });
    }

    const total = U.r2(conceptos.reduce((s, c) => s + c.monto, 0));
    const afecto = U.r2(conceptos.filter(c => c.afecto).reduce((s, c) => s + c.monto, 0));
    return {
      asignacion, remuneracion, computableCts, servicio, ultimaGrati, gratiEstimada, usaEstimada: !U.esNumero(e.ultimaGratificacion),
      periodoGrati, conceptos, total, afecto, indemnizacion,
      limitePago: U.sumarDias(cese, 2)
    };
  }

  return { validar, calcular };
});
