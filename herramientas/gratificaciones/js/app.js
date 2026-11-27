(function () {
  'use strict';
  const C = window.CalcGratificacion;
  const P = window.Parametros;
  const U = window.Util;
  const $ = HC.$;
  const hoy = U.hoy();
  const periodoDefecto = hoy.getMonth() < 6 || (hoy.getMonth() === 6 && hoy.getDate() <= 15) ? 'julio' : 'diciembre';

  const f = HC.formulario('form', [
    { grupo: [
      { id: 'periodo', etiqueta: 'Gratificación', tipo: 'select', valor: periodoDefecto,
        opciones: [['julio', 'Julio (enero–junio)'], ['diciembre', 'Diciembre (julio–diciembre)']] },
      { id: 'anio', etiqueta: 'Año', tipo: 'entero', valor: hoy.getFullYear() }
    ] },
    { grupo: [
      { id: 'fechaIngreso', etiqueta: 'Fecha de ingreso', tipo: 'fecha', valor: '2020-01-02' },
      { id: 'fechaCese', etiqueta: 'Fecha de cese (opcional)', tipo: 'fecha', valor: '', ayuda: 'Solo si dejó de trabajar en el semestre.' }
    ] },
    { id: 'regimen', etiqueta: 'Régimen laboral', tipo: 'select', valor: 'general', opciones: P.laboral.regimenes.map(r => [r.id, r.nombre]) },
    { seccion: 'Remuneración' },
    { id: 'sueldo', etiqueta: 'Sueldo básico mensual', tipo: 'dinero', valor: 3000, min: 0 },
    { id: 'asignacion', etiqueta: `Recibe asignación familiar (${P.asignacionFamiliarPct} % de la RMV)`, tipo: 'check', valor: false },
    { id: 'variables', etiqueta: 'Promedio de pagos variables regulares', tipo: 'dinero', valor: '',
      ayuda: 'Horas extra o comisiones recibidas en al menos 3 meses del semestre.' },
    { id: 'salud', etiqueta: 'Seguro de salud', tipo: 'segmento', valor: 'essalud',
      opciones: [['essalud', `EsSalud (${P.bonificacionExtraordinaria.essalud} %)`], ['eps', `EPS (${HC.numeroCorto(P.bonificacionExtraordinaria.eps)} %)`]] },
    { seccion: 'Valores vigentes' },
    { id: 'rmv', etiqueta: 'Remuneración mínima', tipo: 'dinero', valor: P.rmv.valor, parametro: true, ayuda: P.rmv.fuente }
  ], { clave: 'gratificaciones' });

  f.alCambiar(v => {
    const errs = C.validar(v);
    if (!(v.rmv > 0)) errs.rmv = 'Ingresa la RMV.';
    if (!f.errores(errs)) {
      $('resultado').innerHTML = HC.vacio('Completa los datos para calcular la gratificación.', 'fa-gift');
      return;
    }
    const regimen = P.laboral.regimenes.find(r => r.id === v.regimen);
    if (regimen.factorGrati === 0) {
      $('resultado').innerHTML = HC.nota('Los trabajadores de la microempresa inscrita en el REMYPE no tienen derecho a gratificaciones legales.', 'warn') +
        HC.fuente('Fuente: ' + P.laboral.fuente + '.');
      return;
    }
    const bonif = v.salud === 'eps' ? P.bonificacionExtraordinaria.eps : P.bonificacionExtraordinaria.essalud;
    const r = C.calcular(v, { rmv: v.rmv, asignacionPct: P.asignacionFamiliarPct, factor: regimen.factorGrati, bonificacionPct: bonif });
    const trunca = !!v.fechaCese;

    if (r.meses === 0) {
      $('resultado').innerHTML = HC.nota('No hay meses calendario completos laborados en el semestre: no corresponde gratificación.', 'warn');
      return;
    }
    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: trunca ? 'Gratificación trunca' : 'Gratificación', valor: HC.dinero(r.monto) },
        { etiqueta: `Bonificación (${HC.numeroCorto(bonif)} %)`, valor: HC.dinero(r.bonificacion) },
        { etiqueta: 'Total a pagar', valor: HC.dinero(r.total), acento: true, nota: trunca ? 'Se paga con la liquidación' : 'Hasta el ' + HC.fecha(r.limite) }
      ]) +
      HC.lineas([
        { etiqueta: 'Sueldo básico', valor: HC.dinero(v.sueldo) },
        r.asignacion > 0 ? { etiqueta: 'Asignación familiar', valor: HC.dinero(r.asignacion) } : null,
        r.variables > 0 ? { etiqueta: 'Promedio de variables', valor: HC.dinero(r.variables) } : null,
        { etiqueta: 'Remuneración computable', valor: HC.dinero(r.computable), clase: 'fuerte' },
        { etiqueta: 'Gratificación', valor: HC.dinero(r.monto), clase: 'sub',
          detalle: `${HC.dinero(r.computable)}${regimen.factorGrati !== 1 ? ' × ' + regimen.factorGrati : ''} ÷ 6 × ${r.meses} meses completos` },
        { etiqueta: `Bonificación extraordinaria (${HC.numeroCorto(bonif)} %)`, valor: HC.dinero(r.bonificacion), clase: 'sub' },
        { etiqueta: 'Total a pagar', valor: HC.dinero(r.total), clase: 'big' }
      ]) +
      HC.nota('La gratificación y su bonificación no tienen descuentos de AFP, ONP ni EsSalud, pero sí se consideran para la renta de 5.ª categoría.') +
      (regimen.factorGrati !== 1 ? HC.nota('En la pequeña empresa la gratificación es de media remuneración.') : '') +
      HC.fuente(`Fuente: ${P.laboral.fuente}; ${P.bonificacionExtraordinaria.fuente}.`);
  });
})();
