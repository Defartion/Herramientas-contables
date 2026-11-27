(function () {
  'use strict';
  const C = window.Planilla;
  const P = window.Parametros;
  const $ = HC.$;
  const AFP = P.pensiones.afp;
  const ok = n => typeof n === 'number' && Number.isFinite(n) && n > 0;

  const f = HC.formulario('form', [
    { id: 'sueldo', etiqueta: 'Sueldo básico mensual', tipo: 'dinero', valor: 3000, min: 0 },
    { id: 'asignacion', etiqueta: `Recibe asignación familiar (${P.asignacionFamiliarPct} % de la RMV)`, tipo: 'check', valor: false },
    { id: 'otros', etiqueta: 'Otros ingresos mensuales regulares', tipo: 'dinero', valor: '',
      ayuda: 'Horas extra, comisiones o bonos que se pagan todos los meses.' },
    { id: 'regimen', etiqueta: 'Régimen laboral', tipo: 'select', valor: 'general',
      opciones: P.laboral.regimenes.map(r => [r.id, r.nombre]) },
    { seccion: 'Pensión y salud' },
    { id: 'sistema', etiqueta: 'Sistema de pensiones', tipo: 'select', valor: 'afp',
      opciones: [['afp', 'AFP'], ['onp', `ONP (${P.pensiones.onp} %)`], ['ninguno', 'Ninguno']] },
    { id: 'afp', etiqueta: 'AFP', tipo: 'select', valor: 'integra', si: v => v.sistema === 'afp',
      opciones: AFP.entidades.map(a => [a.id, `${a.nombre} (comisión ${HC.numero(a.comisionFlujo)} %)`]) },
    { id: 'comisionTipo', etiqueta: 'Tipo de comisión', tipo: 'segmento', valor: 'flujo', si: v => v.sistema === 'afp',
      opciones: [['flujo', 'Sobre el sueldo'], ['saldo', 'Sobre el saldo']],
      ayuda: 'Con comisión sobre el saldo no se descuenta comisión del sueldo.' },
    { id: 'salud', etiqueta: 'Seguro de salud', tipo: 'segmento', valor: 'essalud', opciones: [['essalud', 'EsSalud'], ['eps', 'EPS']] },
    { seccion: 'Valores vigentes' },
    { grupo: [
      { id: 'rmv', etiqueta: 'Remuneración mínima', tipo: 'dinero', valor: P.rmv.valor, parametro: true, ayuda: P.rmv.fuente },
      { id: 'uit', etiqueta: 'UIT', tipo: 'dinero', valor: P.uit.valor, parametro: true, ayuda: P.uit.fuente }
    ] }
  ], { clave: 'planilla' });

  f.alCambiar(v => {
    const errs = C.validar(v);
    if (!ok(v.rmv)) errs.rmv = 'Ingresa la RMV.';
    if (!ok(v.uit)) errs.uit = 'Ingresa la UIT.';
    if (!f.errores(errs)) {
      $('resultado').innerHTML = HC.vacio('Ingresa el sueldo para ver el cálculo.', 'fa-user-tie');
      return;
    }
    const regimen = P.laboral.regimenes.find(r => r.id === v.regimen);
    const entidad = AFP.entidades.find(a => a.id === v.afp) || AFP.entidades[0];
    const bonif = v.salud === 'eps' ? P.bonificacionExtraordinaria.eps : P.bonificacionExtraordinaria.essalud;
    const r = C.calcular(v, {
      rmv: v.rmv, asignacionPct: P.asignacionFamiliarPct, uit: v.uit,
      deduccionUIT: P.rentaTrabajo.deduccionUIT, tramosUIT: P.rentaTrabajo.tramosUIT, onpPct: P.pensiones.onp,
      afp: { aportePct: AFP.aporte, primaPct: AFP.prima, rma: AFP.rma, comisionPct: entidad.comisionFlujo },
      essaludPct: P.essalud, bonificacionPct: bonif, regimen
    });
    const pn = r.pension;

    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'Sueldo bruto', valor: HC.dinero(r.bruto) },
        { etiqueta: 'Descuentos', valor: HC.dinero(r.descuentos) },
        { etiqueta: 'Neto a pagar', valor: HC.dinero(r.neto), acento: true }
      ]) +
      '<h3>Ingresos</h3>' +
      HC.lineas([
        { etiqueta: 'Sueldo básico', valor: HC.dinero(v.sueldo) },
        r.asignacion > 0 ? { etiqueta: 'Asignación familiar', valor: HC.dinero(r.asignacion) } : null,
        r.otros > 0 ? { etiqueta: 'Otros ingresos', valor: HC.dinero(r.otros) } : null,
        { etiqueta: 'Total bruto', valor: HC.dinero(r.bruto), clase: 'fuerte' }
      ]) +
      '<h3>Descuentos al trabajador</h3>' +
      HC.lineas([
        v.sistema === 'onp' ? { etiqueta: `ONP (${P.pensiones.onp} %)`, valor: HC.dinero(pn.onp) } : null,
        v.sistema === 'afp' ? { etiqueta: `${entidad.nombre}: aporte obligatorio (${AFP.aporte} %)`, valor: HC.dinero(pn.aporte) } : null,
        v.sistema === 'afp' ? { etiqueta: `Prima de seguro (${HC.numero(AFP.prima)} %)`, valor: HC.dinero(pn.prima),
          detalle: r.bruto > AFP.rma ? `Con tope de ${HC.dinero(AFP.rma)}` : '' } : null,
        v.sistema === 'afp' ? { etiqueta: v.comisionTipo === 'saldo' ? 'Comisión (se cobra sobre el saldo)' : `Comisión sobre el sueldo (${HC.numero(entidad.comisionFlujo)} %)`, valor: HC.dinero(pn.comision) } : null,
        { etiqueta: 'Renta de 5.ª categoría (estimada)', valor: HC.dinero(r.renta.mensual),
          detalle: r.renta.anual > 0 ? `Impuesto anual proyectado ${HC.dinero(r.renta.anual)} ÷ 12` : 'Ingreso anual menor a 7 UIT' },
        { etiqueta: 'Total descuentos', valor: HC.dinero(r.descuentos), clase: 'fuerte' },
        { etiqueta: 'Neto a pagar', valor: HC.dinero(r.neto), clase: 'big' }
      ]) +
      '<h3>Costo mensual para la empresa</h3>' +
      HC.lineas([
        { etiqueta: 'Sueldo bruto', valor: HC.dinero(r.bruto) },
        { etiqueta: `EsSalud (${P.essalud} %)`, valor: HC.dinero(r.empresa.essalud), detalle: r.bruto < v.rmv ? 'Base mínima: la RMV' : '' },
        { etiqueta: 'Provisión de gratificaciones y bonificación', valor: HC.dinero(r.empresa.provGrati) },
        { etiqueta: 'Provisión de CTS', valor: HC.dinero(r.empresa.provCts) },
        { etiqueta: `Provisión de vacaciones (${regimen.vacacionesDias} días al año)`, valor: HC.dinero(r.empresa.provVacaciones) },
        { etiqueta: 'Costo total mensual', valor: HC.dinero(r.empresa.costoTotal), clase: 'big' }
      ]) +
      HC.nota('La renta de 5.ª es un promedio mensual: el empleador recalcula la retención cada mes según lo pagado y lo proyectado. Las gratificaciones no tienen descuentos de AFP, ONP ni EsSalud.') +
      (v.regimen === 'micro' ? HC.nota('En la microempresa el seguro de salud puede ser el SIS semicontributivo en lugar de EsSalud; revisa la condición de la empresa.', 'warn') : '') +
      HC.fuente(`Fuentes: ${P.pensiones.fuente} (tope de prima ${HC.dinero(AFP.rma)}, ${AFP.rmaPeriodo}); ${P.rentaTrabajo.fuente}; ${P.bonificacionExtraordinaria.fuente}.`);
  });
})();
