(function () {
  'use strict';
  const C = window.TipoCambio;
  const $ = HC.$;

  const f = HC.formulario('form', [
    { id: 'direccion', etiqueta: 'Conversión', tipo: 'segmento', valor: 'usd-pen',
      opciones: [['usd-pen', 'Dólares → Soles'], ['pen-usd', 'Soles → Dólares']] },
    { id: 'monto', etiqueta: 'Monto a convertir', tipo: 'numero', valor: 1000, min: 0 },
    { seccion: 'Tipo de cambio del día' },
    { grupo: [
      { id: 'compra', etiqueta: 'Compra', tipo: 'numero', valor: '', min: 0, paso: '0.001', placeholder: 'Ej. 3.350' },
      { id: 'venta', etiqueta: 'Venta', tipo: 'numero', valor: '', min: 0, paso: '0.001', placeholder: 'Ej. 3.360' }
    ] },
    { id: 'tipoUsado', etiqueta: 'Tipo a usar', tipo: 'select', valor: 'auto', opciones: [
      ['auto', 'Automático (compra si vendes dólares, venta si los compras)'],
      ['compra', 'Siempre el de compra'],
      ['venta', 'Siempre el de venta']
    ] }
  ], { clave: 'tipo-cambio' });

  f.alCambiar(v => {
    if (!f.errores(C.validar(v))) {
      $('resultado').innerHTML = HC.vacio('Ingresa el tipo de cambio de compra y venta del día (lo publican la SBS y SUNAT, o el que te dé tu banco).', 'fa-money-bill-transfer');
      return;
    }
    const r = C.convertir(v);
    const origen = v.direccion === 'usd-pen' ? HC.dinero(v.monto, 'US$') : HC.dinero(v.monto);
    const destino = m => (v.direccion === 'usd-pen' ? HC.dinero(m) : HC.dinero(m, 'US$'));
    const montos = [1, 10, 100, 500, 1000, 5000, 10000];

    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: origen + ' equivalen a', valor: destino(r.resultado), acento: true, nota: `Al tipo de ${r.tipo}: ${HC.numero(r.tc, 3)}` },
        { etiqueta: `Con el tipo de ${r.otroTipo}`, valor: destino(r.alternativo), nota: HC.numero(r.otroTc, 3) },
        { etiqueta: 'Diferencia compra–venta', valor: HC.numero(r.spread, 3), nota: HC.pct(r.spreadPct) + ' del tipo promedio' }
      ]) +
      (v.venta < v.compra ? HC.nota('El tipo de venta normalmente es mayor que el de compra. Revisa si los ingresaste al revés.', 'warn') : '') +
      '<h3>Tabla rápida</h3>' +
      HC.tabla({
        columnas: [
          { titulo: 'Dólares', valor: m => HC.dinero(m, 'US$') },
          { titulo: `En soles (compra ${HC.numero(v.compra, 3)})`, valor: m => HC.dinero(m * v.compra) },
          { titulo: `En soles (venta ${HC.numero(v.venta, 3)})`, valor: m => HC.dinero(m * v.venta) }
        ],
        filas: montos
      }) +
      HC.nota('Para la contabilidad y los impuestos se usa el tipo de cambio promedio publicado por la SBS. Según la operación corresponde el de compra o el de venta: confírmalo con tu contador.');
  });
})();
