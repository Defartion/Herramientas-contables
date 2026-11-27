(function () {
  'use strict';
  const C = window.Ratios;
  const $ = HC.$;

  const dinero = (id, etiqueta, valor, ayuda) => ({ id, etiqueta, tipo: 'dinero', valor: valor == null ? '' : valor, ayuda });

  const f = HC.formulario('form', [
    { seccion: 'Estado de situación financiera (balance)' },
    { grupo: [dinero('activoCorriente', 'Activo corriente', 180000), dinero('activoTotal', 'Activo total', 400000)] },
    { grupo: [dinero('efectivo', 'Efectivo y equivalentes', 40000), dinero('cuentasCobrar', 'Cuentas por cobrar', 60000)] },
    dinero('inventarios', 'Inventarios', 70000),
    { grupo: [dinero('pasivoCorriente', 'Pasivo corriente', 100000), dinero('pasivoTotal', 'Pasivo total', 180000)] },
    dinero('patrimonio', 'Patrimonio', 220000, 'Puede ser negativo si hay pérdidas acumuladas.'),
    { seccion: 'Estado de resultados del año' },
    { grupo: [dinero('ventas', 'Ventas netas', 250000), dinero('costoVentas', 'Costo de ventas', 150000)] },
    { grupo: [dinero('utilidadOperativa', 'Utilidad operativa', 40000), dinero('utilidadNeta', 'Utilidad neta', 25000)] },
    dinero('gastosFinancieros', 'Gastos financieros', 5000)
  ], { clave: 'ratios' });

  // Traer datos del Estado de resultados (si se usó esa herramienta en este navegador).
  const ultimoER = HC.leerJSON('hc:estado-resultados:ultimo', null);
  if (ultimoER) {
    const aviso = document.createElement('div');
    aviso.className = 'note';
    aviso.innerHTML = '<i class="fas fa-circle-info" aria-hidden="true"></i><span>Tienes un cálculo guardado en <strong>Estado de resultados</strong> ' +
      `(${HC.fecha(new Date(ultimoER.fecha))}). <button type="button" class="btn btn-sm" id="btnTraerER">Usar esos datos</button></span>`;
    $('form').prepend(aviso);
    $('btnTraerER').addEventListener('click', () => {
      f.establecer('ventas', ultimoER.ventas);
      f.establecer('costoVentas', ultimoER.costoVentas);
      f.establecer('utilidadOperativa', ultimoER.utilidadOperativa);
      f.establecer('utilidadNeta', ultimoER.utilidadNeta);
      f.establecer('gastosFinancieros', ultimoER.gastosFin);
      HC.toast('Se cargaron las ventas, costos y utilidades del Estado de resultados.', 'ok');
    });
  }

  const PILL = { ok: 'pill-ok', warn: 'pill-warn', mal: 'pill-mal', info: '' };
  const ETIQ = { ok: 'Bien', warn: 'Atención', mal: 'Riesgo', info: 'Referencia' };
  const formato = r => (r.unidad === '%' ? HC.pct(r.valor) : r.unidad === 'S/' ? HC.dinero(r.valor)
    : r.unidad === 'días' ? HC.numero(r.valor, 0) + ' días' : HC.numero(r.valor) + ' veces');

  f.alCambiar(v => {
    if (!f.errores(C.validar(v))) {
      $('resultado').innerHTML = HC.vacio('Revisa los montos ingresados.', 'fa-gauge-high');
      return;
    }
    const ratios = C.calcular(v);
    if (!ratios.length) {
      $('resultado').innerHTML = HC.vacio('Ingresa los montos del balance y del estado de resultados para ver los ratios.', 'fa-gauge-high');
      return;
    }
    const grupos = [...new Set(ratios.map(r => r.grupo))];
    $('resultado').innerHTML = grupos.map(g => `<h3>${HC.esc(g)}</h3>` + HC.tabla({
      columnas: [
        { titulo: 'Ratio', html: true, valor: r => `${HC.esc(r.nombre)}<br><small class="muted">${HC.esc(r.formula)}</small>`, clase: 'texto-largo' },
        { titulo: 'Valor', html: true, valor: r => `<strong>${HC.esc(formato(r))}</strong>`, clase: 'num' },
        { titulo: 'Lectura', html: true, clase: 'texto-largo',
          valor: r => `<span class="pill ${PILL[r.nivel]}">${ETIQ[r.nivel]}</span> <small>${HC.esc(r.texto)}</small>` }
      ],
      filas: ratios.filter(r => r.grupo === g)
    })).join('') +
      HC.nota('Las lecturas son referencias generales: los valores adecuados cambian según el rubro y el tamaño de la empresa. Compáralos con años anteriores y con empresas similares.');
  });
})();
