(function () {
  'use strict';
  const C = window.Depreciacion;
  const P = window.Parametros;
  const U = window.Util;
  const $ = HC.$;
  const CLAVE = 'hc:depreciacion:activos';
  const TIPOS = P.depreciacion.tipos;

  const ejemplo = () => [
    { id: 1, descripcion: 'Laptop (ejemplo)', tipo: 'computo', inicio: '2025-03-15', costo: 4500, tasa: 25 },
    { id: 2, descripcion: 'Camioneta (ejemplo)', tipo: 'vehiculos', inicio: '2024-07-01', costo: 85000, tasa: 20 }
  ];
  let activos = HC.leerJSON(CLAVE, null);
  if (!Array.isArray(activos)) activos = ejemplo();
  const guardar = () => HC.guardarJSON(CLAVE, activos);
  let anio = U.hoy().getFullYear();
  let ultimo = null;
  const abiertos = new Set();

  const f = HC.formulario('form', [
    { id: 'anio', etiqueta: 'Ejercicio a calcular', tipo: 'entero', valor: anio, min: 1990, max: 2100,
      ayuda: 'La depreciación se calcula desde el mes en que cada activo empieza a usarse.' }
  ], { clave: 'depreciacion' });

  const opcionesTipo = sel => TIPOS.map(t => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${HC.esc(t.nombre)} (${t.tasa} %)</option>`).join('');

  function construirTabla() {
    $('detalleContenido').innerHTML = `
      <div class="table-wrap"><table class="tabla tabla-editable">
        <thead><tr>
          <th>Descripción</th><th>Tipo</th><th>Inicio de uso</th><th class="num">Costo</th><th class="num">Tasa %</th>
          <th class="num">Dep. ${anio}</th><th class="num">Acumulada</th><th class="num">Valor neto</th><th></th>
        </tr></thead>
        <tbody>
          ${activos.map((a, i) => `
            <tr data-i="${i}">
              <td><input type="text" class="col-concepto" data-campo="descripcion" value="${HC.esc(a.descripcion)}" aria-label="Descripción"></td>
              <td><select data-campo="tipo" aria-label="Tipo de activo">${opcionesTipo(a.tipo)}</select></td>
              <td><input type="date" data-campo="inicio" value="${HC.esc(a.inicio || '')}" aria-label="Inicio de uso"></td>
              <td><input type="number" step="0.01" inputmode="decimal" data-campo="costo" value="${a.costo ?? ''}" aria-label="Costo"></td>
              <td><input type="number" step="0.01" inputmode="decimal" data-campo="tasa" value="${a.tasa ?? ''}" style="min-width:70px" aria-label="Tasa"></td>
              <td class="num" id="dep-${i}"></td><td class="num" id="acu-${i}"></td><td class="num" id="net-${i}"></td>
              <td class="center" style="white-space:nowrap">
                <button type="button" class="icon-btn" data-accion="cronograma" title="Ver cronograma por año" aria-label="Ver cronograma"><i class="fas fa-calendar-days" aria-hidden="true"></i></button>
                <button type="button" class="icon-btn danger" data-accion="eliminar" title="Quitar activo" aria-label="Quitar activo"><i class="fas fa-trash" aria-hidden="true"></i></button>
              </td>
            </tr>
            <tr class="fila-cronograma" id="cron-${i}" ${abiertos.has(i) ? '' : 'hidden'}><td colspan="9"></td></tr>`).join('')}
        </tbody>
      </table></div>
      <div class="acciones" style="margin-top:10px">
        <button type="button" class="btn btn-sm" data-accion="agregar"><i class="fas fa-plus" aria-hidden="true"></i> Agregar activo</button>
      </div>
      <p class="hint">Las tasas son las máximas anuales permitidas para fines tributarios; puedes usar una menor. Los datos se guardan en este navegador.</p>`;
    $('detalle').hidden = false;
    actualizar();
  }

  function actualizar() {
    const r = C.resumen(activos, anio);
    ultimo = r;
    activos.forEach((a, i) => {
      const ok = C.valido(a);
      const iniciado = ok && U.desdeISO(a.inicio).getFullYear() <= anio;
      const x = ok ? C.enEjercicio(a, anio) : null;
      $(`dep-${i}`).textContent = !ok ? 'Completa' : iniciado ? HC.numero(x.delEjercicio) : '—';
      $(`acu-${i}`).textContent = iniciado ? HC.numero(x.acumuladaCierre) : '';
      $(`net-${i}`).textContent = iniciado ? HC.numero(x.valorNeto) : '';
      const cron = $(`cron-${i}`);
      if (cron && !cron.hidden) {
        cron.firstElementChild.innerHTML = ok ? HC.tabla({
          columnas: [
            { titulo: 'Año', campo: 'anio' },
            { titulo: 'Depreciación del año', campo: 'delEjercicio', tipo: 'dinero' },
            { titulo: 'Acumulada', campo: 'acumuladaCierre', tipo: 'dinero' },
            { titulo: 'Valor neto', campo: 'valorNeto', tipo: 'dinero' }
          ],
          filas: C.cronograma(a),
          claseFila: fila => (fila.anio === anio ? 'resaltada' : '')
        }) : HC.nota('Completa el costo, la tasa y la fecha de inicio de uso.');
      }
    });

    const t = r.totales;
    $('resultado').innerHTML = r.filas.length
      ? HC.stats([
        { etiqueta: `Depreciación ${anio}`, valor: HC.dinero(t.delEjercicio), acento: true },
        { etiqueta: 'Costo de los activos', valor: HC.dinero(t.costo) },
        { etiqueta: 'Valor neto al cierre', valor: HC.dinero(t.valorNeto) }
      ]) +
        HC.lineas([
          { etiqueta: `Depreciación acumulada al 31/12/${anio - 1}`, valor: HC.dinero(t.acumuladaInicio) },
          { etiqueta: `Depreciación del ejercicio ${anio}`, valor: HC.dinero(t.delEjercicio) },
          { etiqueta: `Depreciación acumulada al 31/12/${anio}`, valor: HC.dinero(t.acumuladaCierre), clase: 'fuerte' }
        ]) +
        HC.nota('Para que SUNAT acepte la depreciación como gasto, debe estar registrada en la contabilidad y no superar el porcentaje máximo de cada tipo de activo.') +
        HC.fuente('Fuente: ' + P.depreciacion.fuente + '.')
      : HC.vacio(`No hay activos en uso en ${anio}. Agrega uno en la tabla de abajo.`, 'fa-boxes-stacked');
  }

  $('detalleContenido').addEventListener('input', e => {
    const el = e.target;
    const tr = el.closest('tr[data-i]');
    if (!tr || !el.dataset.campo) return;
    const a = activos[Number(tr.dataset.i)];
    const campo = el.dataset.campo;
    if (campo === 'costo' || campo === 'tasa') a[campo] = el.value === '' ? null : Number(el.value);
    else a[campo] = el.value;
    if (campo === 'tipo') {
      a.tasa = TIPOS.find(t => t.id === el.value).tasa;
      tr.querySelector('[data-campo="tasa"]').value = a.tasa;
    }
    guardar();
    actualizar();
  });

  $('detalleContenido').addEventListener('click', e => {
    const b = e.target.closest('button[data-accion]');
    if (!b) return;
    if (b.dataset.accion === 'agregar') {
      activos.push({ id: Date.now(), descripcion: '', tipo: 'otros', inicio: U.aISO(U.hoy()), costo: null, tasa: TIPOS.find(t => t.id === 'otros').tasa });
      guardar();
      construirTabla();
      const inputs = $('detalleContenido').querySelectorAll('input[data-campo="descripcion"]');
      inputs[inputs.length - 1].focus();
      return;
    }
    const i = Number(b.closest('tr[data-i]').dataset.i);
    if (b.dataset.accion === 'eliminar') {
      activos.splice(i, 1);
      abiertos.clear();
      guardar();
      construirTabla();
    } else if (b.dataset.accion === 'cronograma') {
      if (abiertos.has(i)) abiertos.delete(i); else abiertos.add(i);
      $(`cron-${i}`).hidden = !abiertos.has(i);
      actualizar();
    }
  });

  f.alCambiar(v => {
    if (!f.errores(Number.isInteger(v.anio) && v.anio >= 1990 && v.anio <= 2100 ? {} : { anio: 'Ingresa un año válido.' })) return;
    anio = v.anio;
    construirTabla();
  });

  HC.excel.conectarBoton('btnExcel', 'depreciacion', () => {
    if (!ultimo) return null;
    const X = HC.excel;
    const nombreTipo = id => (TIPOS.find(t => t.id === id) || {}).nombre || id;
    const cronogramas = [];
    activos.filter(C.valido).forEach(a => {
      cronogramas.push([a.descripcion || '(sin nombre)', nombreTipo(a.tipo), 'Costo', X.dinero(a.costo), 'Tasa', X.pct(a.tasa)]);
      cronogramas.push(['Año', 'Depreciación', 'Acumulada', 'Valor neto']);
      C.cronograma(a).forEach(c => cronogramas.push([c.anio, X.dinero(c.delEjercicio), X.dinero(c.acumuladaCierre), X.dinero(c.valorNeto)]));
      cronogramas.push([]);
    });
    return [
      {
        nombre: 'Ejercicio ' + anio,
        anchos: [30, 34, 13, 14, 8, 16, 18, 18, 14],
        filas: [
          ['Depreciación del ejercicio ' + anio],
          [],
          ['Descripción', 'Tipo', 'Inicio de uso', 'Costo', 'Tasa', 'Acumulada al inicio', 'Depreciación del ejercicio', 'Acumulada al cierre', 'Valor neto'],
          ...ultimo.filas.map(f => [f.activo.descripcion, nombreTipo(f.activo.tipo), X.fecha(f.activo.inicio), X.dinero(f.activo.costo),
            X.pct(f.activo.tasa), X.dinero(f.acumuladaInicio), X.dinero(f.delEjercicio), X.dinero(f.acumuladaCierre), X.dinero(f.valorNeto)]),
          ['Totales', null, null, X.dinero(ultimo.totales.costo), null, X.dinero(ultimo.totales.acumuladaInicio),
            X.dinero(ultimo.totales.delEjercicio), X.dinero(ultimo.totales.acumuladaCierre), X.dinero(ultimo.totales.valorNeto)]
        ]
      },
      { nombre: 'Cronogramas', anchos: [30, 16, 16, 16, 8, 10], filas: cronogramas }
    ];
  });
})();
