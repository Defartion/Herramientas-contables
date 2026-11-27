(function () {
  'use strict';
  const C = window.Detracciones;
  const P = window.Parametros;
  const $ = HC.$;
  const D = P.detracciones;
  const R = P.retencionIgv;

  const f = HC.formulario('form', [
    { id: 'operacion', etiqueta: '¿Qué quieres calcular?', tipo: 'segmento', valor: 'detraccion',
      opciones: [['detraccion', 'Detracción'], ['retencion', 'Retención'], ['percepcion', 'Percepción']] },
    { id: 'importe', etiqueta: 'Importe total de la operación (con IGV)', tipo: 'dinero', valor: 2360, min: 0 },
    { id: 'servicio', etiqueta: 'Bien o servicio', tipo: 'select', valor: 'empresariales',
      opciones: [...D.servicios.map(s => [s.id, `${s.nombre} (${HC.numero(s.tasa, 0)} %)`]), ['otro', 'Otro (ingresar porcentaje)']],
      si: v => v.operacion === 'detraccion' },
    { id: 'tasaDetraccion', etiqueta: 'Porcentaje de detracción', tipo: 'pct', valor: '',
      si: v => v.operacion === 'detraccion' && v.servicio === 'otro',
      ayuda: 'Para bienes de los Anexos 1 y 2 de SUNAT, ingresa el porcentaje que corresponda.' },
    { id: 'esAgente', etiqueta: 'El cliente es agente de retención designado por SUNAT', tipo: 'check', valor: true,
      si: v => v.operacion === 'retencion' },
    { id: 'tipoPercepcion', etiqueta: 'Tipo de percepción', tipo: 'select', valor: 'general',
      opciones: [...P.percepciones.tipos.map(t => [t.id, `${t.nombre} (${HC.numero(t.tasa, t.tasa % 1 ? 1 : 0)} %)`]), ['otra', 'Otra tasa']],
      si: v => v.operacion === 'percepcion' },
    { id: 'tasaPercepcion', etiqueta: 'Porcentaje de percepción', tipo: 'pct', valor: '',
      si: v => v.operacion === 'percepcion' && v.tipoPercepcion === 'otra' }
  ], { clave: 'detracciones' });

  const pill = (aplica, si, no) => `<span class="pill ${aplica ? 'pill-warn' : 'pill-ok'}">${aplica ? si : no}</span>`;

  f.alCambiar(v => {
    let tasa;
    let campoTasa = null;
    if (v.operacion === 'detraccion') {
      if (v.servicio === 'otro') { tasa = v.tasaDetraccion; campoTasa = 'tasaDetraccion'; }
      else tasa = D.servicios.find(s => s.id === v.servicio).tasa;
    } else if (v.operacion === 'retencion') {
      tasa = R.tasa;
    } else if (v.tipoPercepcion === 'otra') {
      tasa = v.tasaPercepcion; campoTasa = 'tasaPercepcion';
    } else {
      tasa = P.percepciones.tipos.find(t => t.id === v.tipoPercepcion).tasa;
    }

    const errs = C.validar({ importe: v.importe, tasa });
    if (campoTasa && errs.tasa) errs[campoTasa] = errs.tasa;
    if (!f.errores(errs) || errs.tasa) {
      $('resultado').innerHTML = HC.vacio('Ingresa el importe de la operación.', 'fa-hand-holding-dollar');
      return;
    }

    let html = '';
    if (v.operacion === 'detraccion') {
      const r = C.detraccion({ importe: v.importe, tasa, montoMinimo: D.montoMinimo });
      html = `<p>${pill(r.aplica, 'Sujeta a detracción', 'No llega al mínimo')}</p>` +
        HC.stats([
          { etiqueta: `Depósito (${HC.numero(tasa, tasa % 1 ? 1 : 0)} %)`, valor: HC.dinero(r.deposito), acento: true, nota: 'Sin decimales' },
          { etiqueta: 'Se paga al proveedor', valor: HC.dinero(r.neto) }
        ]) +
        HC.lineas([
          { etiqueta: 'Importe total', valor: HC.dinero(v.importe) },
          { etiqueta: 'Detracción calculada', valor: HC.dinero(r.exacto), detalle: r.aplica ? 'El depósito se redondea al entero' : '' },
          { etiqueta: 'Depósito en el Banco de la Nación', valor: HC.dinero(r.deposito), clase: 'fuerte' },
          { etiqueta: 'Neto a pagar al proveedor', valor: HC.dinero(r.neto), clase: 'big' }
        ]) +
        HC.nota(r.aplica
          ? 'El depósito va a la cuenta de detracciones del proveedor en el Banco de la Nación. Si la factura está en dólares, conviértela con el tipo de cambio del día para el depósito.'
          : `Las operaciones de ${HC.dinero(D.montoMinimo)} o menos no están sujetas a detracción (regla general del Anexo 3).`) +
        HC.fuente('Fuente: ' + D.fuente + '.');
    } else if (v.operacion === 'retencion') {
      const r = C.retencion({ importe: v.importe, tasa, montoMinimo: R.montoMinimo, esAgente: v.esAgente });
      html = `<p>${pill(r.aplica, 'Sujeta a retención', 'No corresponde retener')}</p>` +
        HC.stats([
          { etiqueta: `Retención (${HC.numero(tasa, 0)} %)`, valor: HC.dinero(r.monto), acento: true },
          { etiqueta: 'Se paga al proveedor', valor: HC.dinero(r.neto) }
        ]) +
        HC.lineas([
          { etiqueta: 'Importe total', valor: HC.dinero(v.importe) },
          { etiqueta: 'Retención del IGV', valor: HC.dinero(r.monto) },
          { etiqueta: 'Neto a pagar al proveedor', valor: HC.dinero(r.neto), clase: 'big' }
        ]) +
        HC.nota(!v.esAgente
          ? 'Solo retienen los clientes designados por SUNAT como agentes de retención.'
          : r.aplica
            ? 'El proveedor usa la retención como crédito contra su IGV del mes. No se retiene en operaciones sujetas a detracción.'
            : `No se retiene en operaciones de ${HC.dinero(R.montoMinimo)} o menos.`) +
        HC.fuente('Fuente: ' + R.fuente + '.');
    } else {
      const r = C.percepcion({ importe: v.importe, tasa });
      html = HC.stats([
        { etiqueta: `Percepción (${HC.numero(tasa, tasa % 1 ? 1 : 0)} %)`, valor: HC.dinero(r.monto) },
        { etiqueta: 'Total a cobrar al cliente', valor: HC.dinero(r.total), acento: true }
      ]) +
        HC.lineas([
          { etiqueta: 'Precio de venta (con IGV)', valor: HC.dinero(v.importe) },
          { etiqueta: 'Percepción', valor: HC.dinero(r.monto) },
          { etiqueta: 'Total a cobrar', valor: HC.dinero(r.total), clase: 'big' }
        ]) +
        HC.nota('La percepción la cobra el vendedor designado como agente de percepción, solo en la venta de los bienes incluidos en el régimen. El cliente la descuenta luego de su IGV.') +
        HC.fuente('Fuente: ' + P.percepciones.fuente + '.');
    }
    $('resultado').innerHTML = html;
  });
})();
