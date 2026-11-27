(function () {
  'use strict';
  const C = window.Moratorio;
  const P = window.Parametros;
  const $ = HC.$;

  const f = HC.formulario('form', [
    { id: 'monto', etiqueta: 'Monto adeudado', tipo: 'dinero', valor: 5000, min: 0 },
    { grupo: [
      { id: 'fechaVencimiento', etiqueta: 'Fecha de vencimiento', tipo: 'fecha', valor: '' },
      { id: 'fechaPago', etiqueta: 'Fecha de pago', tipo: 'fecha', valor: 'hoy' }
    ] },
    { id: 'tipoTasa', etiqueta: 'Tasa a aplicar', tipo: 'select', valor: 'tim', opciones: [
      ['tim', 'TIM de SUNAT (tributos en soles)'],
      ['mensual', 'Tasa mensual pactada (sin capitalizar)'],
      ['anual', 'Tasa efectiva anual pactada (compuesta)']
    ] },
    { id: 'tasa', etiqueta: 'Tasa', tipo: 'pct', valor: P.tim.mensualMN,
      ayuda: `TIM vigente: ${P.tim.mensualMN} % mensual en soles (${P.tim.fuente}). Si eliges otra tasa, escríbela aquí.` },
    { seccion: 'Penalidad (opcional)' },
    { id: 'penalidadTipo', etiqueta: 'Penalidad por atraso', tipo: 'segmento', valor: 'ninguna',
      opciones: [['ninguna', 'Ninguna'], ['fija', 'Monto fijo'], ['porcentaje', '% del monto']] },
    { id: 'penalidad', etiqueta: 'Valor de la penalidad', tipo: 'numero', valor: '', min: 0,
      si: v => v.penalidadTipo !== 'ninguna' }
  ], { clave: 'interes-moratorio' });

  // Al elegir la TIM se vuelve a poner la tasa vigente.
  let tipoAnterior = null;

  f.alCambiar(v => {
    if (v.tipoTasa === 'tim' && tipoAnterior && tipoAnterior !== 'tim') f.establecer('tasa', P.tim.mensualMN);
    tipoAnterior = v.tipoTasa;

    if (!f.errores(C.validar(v))) {
      $('resultado').innerHTML = HC.vacio('Ingresa el monto y las fechas para calcular el atraso.', 'fa-hourglass-half');
      return;
    }
    const r = C.calcular(v);
    if (r.dias === 0) {
      $('resultado').innerHTML = HC.nota('No hay atraso: la fecha de pago es igual o anterior al vencimiento.', 'ok') +
        HC.lineas([{ etiqueta: 'Total a pagar', valor: HC.dinero(v.monto), clase: 'big' }]);
      return;
    }
    const lineal = v.tipoTasa !== 'anual';
    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'Días de atraso', valor: HC.numero(r.dias, 0), nota: 'Desde el ' + HC.fecha(r.desde) },
        { etiqueta: 'Interés moratorio', valor: HC.dinero(r.interes) },
        { etiqueta: 'Total a pagar', valor: HC.dinero(r.total), acento: true }
      ]) +
      HC.lineas([
        { etiqueta: 'Monto adeudado', valor: HC.dinero(v.monto) },
        { etiqueta: 'Interés moratorio', detalle: `${HC.pct(r.tasaDiariaPct, 4)} diario × ${r.dias} días${lineal ? ' (sin capitalizar)' : ' (compuesto)'}`, valor: HC.dinero(r.interes) },
        r.penalidad > 0 ? { etiqueta: 'Penalidad', valor: HC.dinero(r.penalidad) } : null,
        { etiqueta: 'Total a pagar', valor: HC.dinero(r.total), clase: 'big' }
      ]) +
      (v.tipoTasa === 'tim'
        ? HC.nota('Para tributos SUNAT cobra el interés desde el día siguiente al vencimiento hasta el día de pago. Desde 2024, las multas tributarias usan la tasa de interés legal y no la TIM.')
        : '');
  });
})();
