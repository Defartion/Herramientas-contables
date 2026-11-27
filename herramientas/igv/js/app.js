(function () {
  'use strict';
  const C = window.CalcIGV;
  const P = window.Parametros;
  const $ = HC.$;
  const G = P.igv.general;
  const R = P.igv.restaurantesMype;

  const f = HC.formulario('form', [
    { id: 'modo', etiqueta: '¿Qué monto tienes?', tipo: 'segmento', valor: 'agregar',
      opciones: [['agregar', 'Sin IGV (agregar)'], ['quitar', 'Con IGV (quitar)']] },
    { id: 'monto', etiqueta: 'Monto', tipo: 'dinero', valor: 1000, min: 0 },
    { id: 'tasaTipo', etiqueta: 'Tasa', tipo: 'select', valor: 'general', opciones: [
      ['general', `General: ${HC.numero(G.total, 0)} % (IGV ${HC.numero(G.igv, 1)} % + IPM ${HC.numero(G.ipm, 1)} %)`],
      ['restaurantes', `Restaurantes, hoteles y alojamientos MYPE: ${HC.numero(R.total, 1)} %`],
      ['otra', 'Otra tasa']
    ] },
    { id: 'tasaOtra', etiqueta: 'Tasa total', tipo: 'pct', valor: '', si: v => v.tasaTipo === 'otra' }
  ], { clave: 'igv' });

  f.alCambiar(v => {
    const comp = v.tasaTipo === 'general' ? G : v.tasaTipo === 'restaurantes' ? R : null;
    const e = {
      modo: v.modo,
      monto: v.monto,
      tasaTotal: comp ? comp.total : v.tasaOtra,
      igvPct: comp ? comp.igv : NaN,
      ipmPct: comp ? comp.ipm : NaN
    };
    const errs = C.validar(e);
    if (v.tasaTipo === 'otra' && errs.tasaTotal) errs.tasaOtra = errs.tasaTotal;
    if (!f.errores(errs) || errs.tasaTotal) {
      $('resultado').innerHTML = HC.vacio('Ingresa un monto para calcular el IGV.', 'fa-receipt');
      return;
    }
    const r = C.calcular(e);
    const etiquetaImp = `IGV (${HC.numero(e.tasaTotal, e.tasaTotal % 1 ? 1 : 0)} %)`;
    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'Valor de venta (base)', valor: HC.dinero(r.base) },
        { etiqueta: etiquetaImp, valor: HC.dinero(r.impuesto) },
        { etiqueta: 'Precio de venta (total)', valor: HC.dinero(r.total), acento: true }
      ]) +
      HC.lineas([
        { etiqueta: 'Valor de venta', valor: HC.dinero(r.base) },
        comp ? { etiqueta: `IGV ${HC.numero(comp.igv, 1)} %`, valor: HC.dinero(r.igv), clase: 'sub' } : null,
        comp ? { etiqueta: `IPM ${HC.numero(comp.ipm, 1)} %`, valor: HC.dinero(r.ipm), clase: 'sub' } : null,
        { etiqueta: etiquetaImp, valor: HC.dinero(r.impuesto), clase: 'fuerte' },
        { etiqueta: 'Precio de venta', valor: HC.dinero(r.total), clase: 'big' }
      ]) +
      (v.tasaTipo === 'restaurantes'
        ? HC.nota('La tasa especial es solo para micro y pequeñas empresas cuya actividad principal sea restaurantes, hoteles o alojamientos turísticos y que cumplan los requisitos de SUNAT. En 2027 sube a 15 %.', 'warn')
        : HC.nota('En el comprobante el impuesto se muestra como un solo monto de IGV. Desde 2026 la tasa de 18 % se reparte en 15,5 % de IGV y 2,5 % de Impuesto de Promoción Municipal (IPM).')) +
      HC.fuente('Fuente: ' + P.igv.fuente + '.');
  });
})();
