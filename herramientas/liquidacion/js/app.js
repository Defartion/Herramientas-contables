(function () {
  'use strict';
  const C = window.Liquidacion;
  const P = window.Parametros;
  const $ = HC.$;

  const f = HC.formulario('form', [
    { grupo: [
      { id: 'fechaIngreso', etiqueta: 'Fecha de ingreso', tipo: 'fecha', valor: '2023-03-01' },
      { id: 'fechaCese', etiqueta: 'Fecha de cese', tipo: 'fecha', valor: 'hoy' }
    ] },
    { id: 'motivo', etiqueta: 'Motivo del cese', tipo: 'select', valor: 'renuncia', opciones: [
      ['renuncia', 'Renuncia'],
      ['despido', 'Despido arbitrario (sin causa)'],
      ['fin', 'Fin de contrato o mutuo acuerdo']
    ] },
    { id: 'regimen', etiqueta: 'Régimen laboral', tipo: 'select', valor: 'general', opciones: P.laboral.regimenes.map(r => [r.id, r.nombre]) },
    { seccion: 'Remuneración' },
    { id: 'sueldo', etiqueta: 'Sueldo básico mensual', tipo: 'dinero', valor: 2500, min: 0 },
    { id: 'asignacion', etiqueta: `Recibe asignación familiar (${P.asignacionFamiliarPct} % de la RMV)`, tipo: 'check', valor: false },
    { id: 'variables', etiqueta: 'Promedio de pagos variables regulares', tipo: 'dinero', valor: '' },
    { id: 'salud', etiqueta: 'Seguro de salud', tipo: 'segmento', valor: 'essalud', opciones: [['essalud', 'EsSalud'], ['eps', 'EPS']] },
    { seccion: 'Pendientes' },
    { id: 'vacacionesPendientes', etiqueta: 'Días de vacaciones ganadas y no gozadas', tipo: 'entero', valor: '', min: 0,
      ayuda: 'De periodos anteriores ya cumplidos. Las truncas del último periodo se calculan solas.' },
    { id: 'ultimaGratificacion', etiqueta: 'Última gratificación recibida (opcional)', tipo: 'dinero', valor: '',
      ayuda: 'Para el 1/6 de la CTS. Si la dejas vacía, se estima.' },
    { seccion: 'Valores vigentes' },
    { id: 'rmv', etiqueta: 'Remuneración mínima', tipo: 'dinero', valor: P.rmv.valor, parametro: true, ayuda: P.rmv.fuente }
  ], { clave: 'liquidacion' });

  f.alCambiar(v => {
    const errs = C.validar(v);
    if (!(v.rmv > 0)) errs.rmv = 'Ingresa la RMV.';
    if (!f.errores(errs)) {
      $('resultado').innerHTML = HC.vacio('Completa las fechas y el sueldo para calcular la liquidación.', 'fa-file-contract');
      return;
    }
    const regimen = P.laboral.regimenes.find(r => r.id === v.regimen);
    const bonif = v.salud === 'eps' ? P.bonificacionExtraordinaria.eps : P.bonificacionExtraordinaria.essalud;
    const r = C.calcular(v, { rmv: v.rmv, asignacionPct: P.asignacionFamiliarPct, bonificacionPct: bonif, regimen });
    const s = r.servicio;
    const tiempo = [s.anios ? `${s.anios} año${s.anios === 1 ? '' : 's'}` : '', s.meses ? `${s.meses} mes${s.meses === 1 ? '' : 'es'}` : '', `${s.dias} día${s.dias === 1 ? '' : 's'}`]
      .filter(Boolean).join(', ');

    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'Total de la liquidación', valor: HC.dinero(r.total), acento: true },
        { etiqueta: 'Tiempo de servicios', valor: tiempo },
        { etiqueta: 'Pagar hasta', valor: HC.fecha(r.limitePago), nota: '48 horas después del cese' }
      ]) +
      HC.tabla({
        columnas: [
          { titulo: 'Concepto', campo: 'concepto' },
          { titulo: 'Detalle', campo: 'detalle', clase: 'texto-largo muted' },
          { titulo: 'Monto', campo: 'monto', tipo: 'dinero' }
        ],
        filas: r.conceptos,
        pie: { concepto: 'Total', detalle: '', monto: r.total }
      }) +
      HC.lineas([
        { etiqueta: 'Remuneración computable mensual', valor: HC.dinero(r.remuneracion) },
        { etiqueta: 'Remuneración computable para CTS', valor: HC.dinero(r.computableCts),
          detalle: `Incluye 1/6 de ${r.usaEstimada ? 'la gratificación estimada' : 'la última gratificación'} (${HC.dinero(r.ultimaGrati)})` }
      ]) +
      (r.afecto > 0 ? HC.nota(`Las vacaciones (${HC.dinero(r.afecto)}) tienen descuentos de AFP u ONP y de renta de 5.ª. La CTS, la gratificación, la bonificación y la indemnización no tienen descuentos de pensiones.`) : '') +
      (v.motivo === 'fin' ? HC.nota('Si un contrato a plazo fijo se resuelve antes de su vencimiento sin causa, corresponde una indemnización de 1,5 remuneraciones por cada mes que faltaba (tope de 12); no está incluida aquí.', 'warn') : '') +
      (r.indemnizacion && r.indemnizacion.enPrueba ? HC.nota('El trabajador estaba en periodo de prueba (menos de 3 meses): no corresponde indemnización.', 'warn') : '') +
      (regimen.id === 'micro' ? HC.nota('En la microempresa no corresponden CTS ni gratificaciones; las vacaciones son de 15 días por año.', 'warn') : '') +
      HC.fuente('Fuente: ' + P.laboral.fuente + '.');
  });
})();
