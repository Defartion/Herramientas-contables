/*
 * Reglas laborales compartidas (régimen general y MYPE): gratificaciones,
 * CTS, vacaciones truncas, indemnización y renta de 5.ª categoría.
 * Funciones puras: se usan en el navegador (global `Laboral`) y en las pruebas.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./util.js'));
  else raiz.Laboral = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';

  const max = (a, b) => (a > b ? a : b);
  const min = (a, b) => (a < b ? a : b);

  // ---------- Gratificaciones ----------

  /** Semestre de cada gratificación y su fecha límite de pago. */
  function periodoGratificacion(tipo, anio) {
    return tipo === 'julio'
      ? { tipo, inicio: new Date(anio, 0, 1), fin: new Date(anio, 5, 30), limite: new Date(anio, 6, 15) }
      : { tipo, inicio: new Date(anio, 6, 1), fin: new Date(anio, 11, 31), limite: new Date(anio, 11, 15) };
  }

  /**
   * Gratificación por meses calendario completos laborados en el semestre.
   * g: { computable, ingreso, cese|null, periodo, factor (1 general, 0,5 pequeña, 0 micro), bonificacionPct }
   */
  function gratificacion(g) {
    const desde = max(g.ingreso, g.periodo.inicio);
    const hasta = g.cese ? min(g.cese, g.periodo.fin) : g.periodo.fin;
    const meses = hasta < desde ? 0 : Math.min(6, U.mesesCompletos(desde, hasta));
    const monto = U.r2(g.computable * g.factor * meses / 6);
    const bonificacion = U.r2(monto * g.bonificacionPct / 100);
    return { meses, monto, bonificacion, total: U.r2(monto + bonificacion), desde, hasta };
  }

  /** Gratificación previa a una fecha (la de julio o la de diciembre anterior). */
  function ultimaGratificacionAntesDe(fecha) {
    return fecha.getMonth() >= 6
      ? periodoGratificacion('julio', fecha.getFullYear())
      : periodoGratificacion('diciembre', fecha.getFullYear() - 1);
  }

  // ---------- CTS ----------

  /** Periodo que cubre cada depósito de CTS y su fecha límite. */
  function periodoCts(deposito, anio) {
    return deposito === 'mayo'
      ? { deposito, inicio: new Date(anio - 1, 10, 1), fin: new Date(anio, 3, 30), limite: new Date(anio, 4, 15) }
      : { deposito, inicio: new Date(anio, 4, 1), fin: new Date(anio, 9, 31), limite: new Date(anio, 10, 15) };
  }

  /** Periodo de CTS en curso a una fecha (para la CTS trunca). */
  function periodoCtsEnCurso(fecha) {
    const m = fecha.getMonth();
    const y = fecha.getFullYear();
    if (m >= 4 && m <= 9) return periodoCts('noviembre', y);
    return periodoCts('mayo', m >= 10 ? y + 1 : y);
  }

  /**
   * Meses y días computables entre dos fechas (incluidas): meses calendario
   * completos más los días sueltos; las faltas se descuentan por treintavos.
   */
  function tiempoComputable(desde, hasta, faltas) {
    if (hasta < desde) return { meses: 0, dias: 0 };
    const meses = U.mesesCompletos(desde, hasta);
    const diasTotales = U.diasEntre(desde, hasta) + 1;
    // Días que caen dentro de los meses completos.
    let diasEnMeses = 0;
    let m = desde.getDate() === 1 ? U.inicioDeMes(desde) : U.sumarMeses(U.inicioDeMes(desde), 1);
    for (let k = 0; k < meses; k++) {
      diasEnMeses += U.diasDelMes(m.getFullYear(), m.getMonth());
      m = U.sumarMeses(m, 1);
    }
    let total = meses * 30 + (diasTotales - diasEnMeses) - (faltas || 0);
    total = Math.max(0, total);
    return { meses: Math.floor(total / 30), dias: total % 30 };
  }

  /** Remuneración computable de CTS: incluye 1/6 de la gratificación del semestre. */
  const computableCts = (remuneracion, gratificacionSemestre) => remuneracion + (gratificacionSemestre || 0) / 6;

  function cts({ computable, meses, dias, factor }) {
    return U.r2(computable * factor / 12 * meses + computable * factor / 360 * dias);
  }

  // ---------- Vacaciones ----------

  /**
   * Vacaciones truncas: desde el último aniversario hasta el cese, por dozavos
   * y treintavos. Requiere al menos un mes de servicios.
   */
  function vacacionesTruncas({ remuneracion, ingreso, cese, diasPorAnio }) {
    const t = U.tiempoServicio(ingreso, cese);
    const aniversario = U.sumarMeses(ingreso, t.anios * 12, ingreso.getDate());
    const record = U.tiempoServicio(aniversario, cese);
    const totalMeses = t.anios * 12 + t.meses;
    if (totalMeses < 1) return { meses: 0, dias: 0, monto: 0, desde: aniversario };
    const factor = diasPorAnio / 30;
    const monto = U.r2(remuneracion * factor * (record.meses / 12 + record.dias / 360));
    return { meses: record.meses, dias: record.dias, monto, desde: aniversario };
  }

  // ---------- Indemnización por despido arbitrario ----------

  /**
   * regimen.indemnizacion: { tipo: 'remuneraciones'|'dias', porAnio, tope }
   * Fracciones de año por dozavos (meses) y treintavos (días).
   */
  function indemnizacion({ remuneracion, tiempo, regla }) {
    const anios = tiempo.anios + tiempo.meses / 12 + tiempo.dias / 360;
    let monto, tope;
    if (regla.tipo === 'remuneraciones') {
      monto = remuneracion * regla.porAnio * anios;
      tope = remuneracion * regla.tope;
    } else {
      const diaria = remuneracion / 30;
      monto = diaria * regla.porAnio * anios;
      tope = diaria * regla.tope;
    }
    return { monto: U.r2(Math.min(monto, tope)), topeAplicado: monto > tope, tope: U.r2(tope) };
  }

  // ---------- Renta de 5.ª categoría (estimado) ----------

  /**
   * Impuesto anual proyectado y retención mensual promedio.
   * r: { ingresoAnual, uit, deduccionUIT, tramosUIT }
   */
  function rentaQuinta(r) {
    const deduccion = r.deduccionUIT * r.uit;
    const base = Math.max(0, r.ingresoAnual - deduccion);
    const { impuesto } = U.impuestoPorTramos(base, U.tramosEnSoles(r.tramosUIT, r.uit));
    return { ingresoAnual: r.ingresoAnual, deduccion, base, anual: U.r2(impuesto), mensual: U.r2(impuesto / 12) };
  }

  return {
    periodoGratificacion, gratificacion, ultimaGratificacionAntesDe,
    periodoCts, periodoCtsEnCurso, tiempoComputable, computableCts, cts,
    vacacionesTruncas, indemnizacion, rentaQuinta
  };
});
