/*
 * Exportación del tablero a Excel con SheetJS.
 * La librería se descarga solo la primera vez que se exporta, así la página
 * carga más rápido.
 */
(function (raiz) {
  'use strict';
  const C = raiz.Calculo;

  const URL_SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  const FORMATO_DINERO = '#,##0.00';
  const FORMATO_FECHA = 'dd/mm/yyyy';
  let cargando = null;

  function cargarSheetJS() {
    if (raiz.XLSX) return Promise.resolve(raiz.XLSX);
    if (cargando) return cargando;
    cargando = new Promise((resolver, rechazar) => {
      const s = document.createElement('script');
      s.src = URL_SHEETJS;
      s.onload = () => raiz.XLSX ? resolver(raiz.XLSX) : rechazar(new Error('SheetJS no se cargó.'));
      s.onerror = () => {
        cargando = null;
        s.remove();
        rechazar(new Error('No se pudo descargar la librería de Excel. Revisa tu conexión a internet e intenta de nuevo.'));
      };
      document.head.appendChild(s);
    });
    return cargando;
  }

  const red = n => Math.round(n * 100) / 100;

  /** Celda de dinero: número redondeado a 2 decimales con formato. */
  const dinero = n => ({ t: 'n', v: red(n), z: FORMATO_DINERO });

  /** Celda de fecha a partir de 'DD/MM/AAAA' (queda como fecha real en Excel). */
  function fecha(texto) {
    const f = C.fechaDesdeCorta(texto);
    if (!f) return { t: 's', v: texto || '-' };
    // Número de serie de Excel (días desde 30/12/1899), sin zona horaria.
    const serie = Math.round((Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);
    return { t: 'n', v: serie, z: FORMATO_FECHA };
  }

  const texto = v => ({ t: 's', v: String(v) });
  const entero = v => ({ t: 'n', v });
  const vacio = () => null;

  /** Convierte una matriz de celdas en una hoja de SheetJS. */
  function hojaDesdeCeldas(XLSX, filas, anchos) {
    const ws = {};
    let maxCol = 0;
    filas.forEach((fila, r) => {
      fila.forEach((celda, c) => {
        if (celda == null) return;
        ws[XLSX.utils.encode_cell({ r, c })] = celda;
        if (c > maxCol) maxCol = c;
      });
    });
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(filas.length - 1, 0), c: maxCol } });
    ws['!cols'] = anchos.map(wch => ({ wch }));
    return ws;
  }

  function hojaTablero(XLSX, lista) {
    const encabezado = ['N°', 'N° Contrato', 'Días mes 1', 'Fecha factura 1', 'Monto', 'Interés diario',
      'Interés 1', 'Impuesto 1', 'Días mes 2', 'Fecha factura 2', 'Interés 2', 'Impuesto 2',
      'Interés total', 'Impuesto total'].map(texto);

    const filas = lista.map((r, idx) => [
      entero(idx + 1),
      entero(r.numeroContrato),
      entero(r.diasTramo1),
      fecha(r.fechaFactura1),
      dinero(r.capital),
      dinero(r.interesDiario),
      dinero(r.interes1),
      dinero(r.impuesto1),
      r.diasTramo2 ? entero(r.diasTramo2) : vacio(),
      r.fechaFactura2 ? fecha(r.fechaFactura2) : texto('-'),
      r.interes2 != null ? dinero(r.interes2) : texto('-'),
      r.impuesto2 != null ? dinero(r.impuesto2) : texto('-'),
      dinero(C.interesTotalDe(r)),
      dinero(C.impuestoTotalDe(r))
    ]);

    const t = C.totalesTablero(lista);
    const totales = [texto('Σ'), vacio(), vacio(), texto('Totales'), dinero(t.monto), vacio(),
      dinero(t.interes1), dinero(t.impuesto1), vacio(), vacio(), dinero(t.interes2), dinero(t.impuesto2),
      dinero(t.interes), dinero(t.impuesto)];

    // Debajo del resumen, el detalle de los días de pago de cada contrato.
    const encabezadoDias = ['N° Contrato', 'Día', 'Fecha', 'Sin interés', 'Con interés',
      'Interés del día', 'Interés acumulado'].map(texto);
    const filasDias = [];
    lista.forEach(r => {
      C.construirDiasPago(r).forEach(d => {
        filasDias.push([entero(d.numeroContrato), entero(d.n), fecha(d.fecha), dinero(d.sinInteres),
          dinero(d.conInteres), dinero(d.interes), dinero(d.acumulado)]);
      });
    });

    const celdas = [
      [texto('Tablero de datos acumulado')],
      encabezado,
      ...filas,
      totales,
      [],
      [texto('Días de pago por contrato')],
      encabezadoDias,
      ...filasDias
    ];
    return hojaDesdeCeldas(XLSX, celdas, [12, 12, 14, 16, 12, 13, 15, 11, 11, 16, 11, 11, 13, 13]);
  }

  function hojaResumenMensual(XLSX, lista) {
    const meses = C.resumenMensual(lista);
    const celdas = [
      [texto('Interés facturado por mes (según la fecha de cada factura)')],
      ['Mes', 'N° de facturas', 'Interés', 'Impuesto'].map(texto),
      ...meses.map(m => [texto(C.nombreMes(m.anio, m.mes)), entero(m.facturas), dinero(m.interes), dinero(m.impuesto)])
    ];
    const tot = meses.reduce((a, m) => ({ f: a.f + m.facturas, i: a.i + m.interes, p: a.p + m.impuesto }), { f: 0, i: 0, p: 0 });
    celdas.push([texto('Totales'), entero(tot.f), dinero(tot.i), dinero(tot.p)]);
    return hojaDesdeCeldas(XLSX, celdas, [20, 15, 14, 14]);
  }

  /** Genera y descarga el Excel. `lista` ya debe venir ordenada. */
  async function descargar(lista) {
    const XLSX = await cargarSheetJS();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hojaTablero(XLSX, lista), 'Tablero');
    XLSX.utils.book_append_sheet(wb, hojaResumenMensual(XLSX, lista), 'Resumen mensual');
    const nombre = 'tablero-interes-simple-' + C.fechaAISO(new Date()) + '.xlsx';
    XLSX.writeFile(wb, nombre);
    return nombre;
  }

  raiz.ExportarExcel = { descargar, cargarSheetJS };
})(self);
