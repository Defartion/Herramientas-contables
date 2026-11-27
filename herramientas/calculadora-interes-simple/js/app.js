/*
 * Interfaz de la Calculadora de Interés Simple: formulario, resumen en vivo,
 * tablero de contratos, respaldo y resumen mensual.
 * Los cálculos están en calculo.js y el guardado en almacenamiento.js.
 */
(function () {
  'use strict';
  const C = window.Calculo;
  const A = window.Almacen;

  // ---------- Utilidades ----------

  const $ = id => document.getElementById(id);
  const formatoDinero = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatoTasa = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const formatoPct = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

  const fmt = n => 'S/ ' + formatoDinero.format(n);
  /** Monto sin "S/", para tablas (el encabezado ya indica que es en soles). */
  const num = n => formatoDinero.format(n);

  function esc(v) {
    return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function numeroDe(id) {
    const v = $(id).value.trim();
    return v === '' ? NaN : Number(v);
  }

  // ---------- Avisos (toast y banner) ----------

  let temporizadorToast = null;

  /** Muestra un mensaje breve abajo. `accion` opcional: { texto, alHacer }. */
  function toast(mensaje, accion, tipo) {
    const el = $('toast');
    const btn = $('toastAccion');
    clearTimeout(temporizadorToast);
    $('toastTexto').textContent = mensaje;
    el.className = 'toast' + (tipo ? ' toast-' + tipo : '');
    if (accion) {
      btn.textContent = accion.texto;
      btn.hidden = false;
      btn.onclick = () => { ocultarToast(); accion.alHacer(); };
    } else {
      btn.hidden = true;
      btn.onclick = null;
    }
    el.hidden = false;
    temporizadorToast = setTimeout(ocultarToast, accion ? 9000 : 4000);
  }

  function ocultarToast() {
    $('toast').hidden = true;
  }

  function mostrarAviso(mensaje) {
    const el = $('aviso');
    el.innerHTML = '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i> <span></span>';
    el.querySelector('span').textContent = mensaje;
    el.hidden = false;
  }

  function revisarErrorAlmacen() {
    const e = A.tomarUltimoError();
    if (e) mostrarAviso(e.message && e.message.startsWith('Los datos')
      ? e.message
      : 'No se pudo guardar en este navegador (puede estar lleno o en modo privado). Descarga un respaldo o exporta a Excel para no perder datos.');
  }

  /** Confirmación con el diálogo propio de la página. Devuelve una promesa<boolean>. */
  function confirmar(titulo, texto, textoAceptar) {
    const dlg = $('dialogo');
    $('dialogoTitulo').textContent = titulo;
    $('dialogoTexto').textContent = texto;
    $('dialogoAceptar').textContent = textoAceptar || 'Aceptar';
    if (typeof dlg.showModal !== 'function') {
      return Promise.resolve(window.confirm(titulo + '\n\n' + texto));
    }
    return new Promise(resolver => {
      dlg.addEventListener('close', () => resolver(dlg.returnValue === 'aceptar'), { once: true });
      dlg.returnValue = '';
      dlg.showModal();
    });
  }

  // ---------- Formulario y resumen en vivo ----------

  const CAMPOS = ['numeroContrato', 'capital', 'fechaInicioISO', 'tasaPct', 'plazoDias', 'impuestoPct'];
  const tocados = new Set();

  function leerFormulario() {
    return {
      capital: numeroDe('capital'),
      fechaInicioISO: $('fechaInicioISO').value,
      tasaPct: numeroDe('tasaPct'),
      plazoDias: numeroDe('plazoDias'),
      impuestoPct: numeroDe('impuestoPct')
    };
  }

  /** Error del N° de contrato (vacío = usar el correlativo). */
  function errorNumeroContrato() {
    const v = $('numeroContrato').value.trim();
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) return 'Debe ser un número entero mayor a cero.';
    if (A.numeroEnUso(n)) return 'El N° ' + n + ' ya está en el tablero. Usa otro número.';
    return null;
  }

  function errores() {
    const errs = C.validarEntrada(leerFormulario());
    const errNum = errorNumeroContrato();
    if (errNum) errs.numeroContrato = errNum;
    return errs;
  }

  function pintarErrores(errs, todos) {
    CAMPOS.forEach(campo => {
      const mostrar = todos || tocados.has(campo);
      const msg = mostrar ? (errs[campo] || '') : '';
      $('err-' + campo).textContent = msg;
      $(campo).setAttribute('aria-invalid', msg ? 'true' : 'false');
    });
  }

  function actualizarResumen() {
    const entrada = leerFormulario();
    const errs = errores();
    pintarErrores(errs, false);

    const erroresCalculo = Object.keys(C.validarEntrada(entrada));
    if (erroresCalculo.length) {
      $('resultadoVacio').hidden = false;
      $('resultadoContenido').hidden = true;
      return null;
    }

    const r = C.calcularPrestamo(entrada);
    $('resultadoVacio').hidden = true;
    $('resultadoContenido').hidden = false;

    $('rTasaDiaria').textContent = formatoTasa.format(r.tasaDiaria * 100) + ' %';
    $('rInteresDiario').textContent = fmt(r.interesDiario);
    $('rUltimoDia').textContent = C.fechaLarga(r.ultimoDia);
    $('rTotalPagar').textContent = fmt(r.totalPagar);

    const facturas = [['Factura 1', r.factura1]];
    if (r.factura2) facturas.push(['Factura 2', r.factura2]);
    $('rFacturas').innerHTML = facturas.map(([nombre, f]) => `
      <tr><td>${nombre}</td><td>${C.fechaCorta(f.fecha)}</td><td class="num">${f.dias}</td>
      <td class="num">${fmt(f.interes)}</td><td class="num">${fmt(f.impuesto)}</td></tr>`).join('');

    $('rMeses').innerHTML = r.meses.map((g, i) => {
      const pill = r.meses.length > 1
        ? (i === 0 ? ' <span class="pill">factura 1</span>' : ' <span class="pill warn-pill">factura 2</span>')
        : '';
      return `<tr><td class="capitalizar">${C.nombreMes(g.anio, g.mes)}${pill}</td>
        <td>${C.fechaCorta(g.desde).slice(0, 5)} – ${C.fechaCorta(g.hasta).slice(0, 5)}</td>
        <td class="num">${g.dias}</td><td class="num">${fmt(g.interes)}</td></tr>`;
    }).join('');

    const nota = $('rNotaCruce');
    if (r.factura2) {
      const primero = r.meses[0];
      nota.hidden = false;
      $('rNotaCruceTexto').textContent =
        `El préstamo inicia en ${C.nombreMes(primero.anio, primero.mes)} con ${primero.dias} día(s) de interés en ese mes. ` +
        `Los ${r.factura2.dias} día(s) restantes van en la factura 2` +
        (r.meses.length > 2 ? ` (abarca ${r.meses.length - 1} meses siguientes).` : '.');
    } else {
      nota.hidden = true;
    }

    $('rPlazo').textContent = entrada.plazoDias;
    $('rImpPct').textContent = formatoPct.format(entrada.impuestoPct);
    $('rInteresTotal').textContent = fmt(r.interesTotal);
    $('rImpuestoTotal').textContent = fmt(r.impuestoTotal);
    $('rInteresNeto').textContent = fmt(r.interesNeto);
    $('rTotalPagar2').textContent = fmt(r.totalPagar);
    return r;
  }

  function guardarContrato(evento) {
    evento.preventDefault();
    const errs = errores();
    pintarErrores(errs, true);
    const primerError = CAMPOS.find(c => errs[c]);
    if (primerError) {
      $(primerError).focus();
      return;
    }

    const r = actualizarResumen();
    if (!r) return;

    // N° de contrato: el que puso el usuario o, si lo dejó vacío, el correlativo.
    const v = $('numeroContrato').value.trim();
    let numero;
    if (v === '') {
      numero = A.siguienteNumeroContrato();
    } else {
      numero = Number(v);
      A.avanzarContadorHasta(numero);
    }

    const id = Date.now() + Math.floor(Math.random() * 1000);
    const ok = A.agregar(C.crearRegistro(r, numero, id));
    if (!ok) {
      revisarErrorAlmacen();
      return;
    }

    const entrada = leerFormulario();
    A.guardarPreferencias({ tasaPct: entrada.tasaPct, plazoDias: entrada.plazoDias, impuestoPct: entrada.impuestoPct });

    renderTablero(id);
    toast('Contrato N° ' + numero + ' guardado en el tablero.', null, 'ok');

    // Listo para el siguiente préstamo: nuevo correlativo y monto vacío.
    $('numeroContrato').value = A.leerContador() + 1;
    $('capital').value = '';
    tocados.clear();
    actualizarResumen();
    $('capital').focus();
  }

  // ---------- Tablero de contratos ----------

  let filtro = '';

  function registrosVisibles() {
    const todos = C.ordenarRegistros(A.leerRegistros());
    if (!filtro) return { todos, visibles: todos };
    return { todos, visibles: todos.filter(r => String(r.numeroContrato).includes(filtro)) };
  }

  function renderTablero(idResaltado) {
    const { todos, visibles } = registrosVisibles();
    $('badgeRegistros').textContent = todos.length;
    $('btnVaciar').hidden = !todos.length;
    const cont = $('ledgerContenedor');

    if (!todos.length) {
      cont.innerHTML = `<div class="empty-state"><i class="fas fa-box-open" aria-hidden="true"></i>
        Todavía no hay contratos en el tablero.</div>`;
      renderMensual([]);
      return;
    }
    if (!visibles.length) {
      cont.innerHTML = `<div class="empty-state"><i class="fas fa-magnifying-glass" aria-hidden="true"></i>
        Ningún contrato coincide con "${esc(filtro)}".</div>`;
      renderMensual(todos);
      return;
    }

    const t = C.totalesTablero(visibles);
    const guion = '<span class="muted">-</span>';

    const filas = visibles.map((r, idx) => `
      <tr data-id="${r.id}"${r.id === idResaltado ? ' class="resaltado"' : ''}>
        <td class="center muted">${idx + 1}</td>
        <td class="center"><strong>${esc(r.numeroContrato)}</strong></td>
        <td class="center">${esc(r.diasTramo1)}</td>
        <td>${esc(r.fechaFactura1)}</td>
        <td class="num">${num(r.capital)}</td>
        <td class="num">${num(r.interesDiario)}</td>
        <td class="num">${num(r.interes1)}</td>
        <td class="num">${num(r.impuesto1)}</td>
        <td class="center">${r.diasTramo2 ? esc(r.diasTramo2) : guion}</td>
        <td>${r.fechaFactura2 ? esc(r.fechaFactura2) : guion}</td>
        <td class="num">${r.interes2 != null ? num(r.interes2) : guion}</td>
        <td class="num">${r.impuesto2 != null ? num(r.impuesto2) : guion}</td>
        <td class="num"><strong>${num(C.interesTotalDe(r))}</strong></td>
        <td class="num">${num(C.impuestoTotalDe(r))}</td>
        <td class="center"><button type="button" class="ledger-toggle" data-accion="dias" aria-expanded="false" title="Ver días de pago"><i class="fas fa-chevron-right" aria-hidden="true"></i> Ver</button></td>
        <td class="center"><button type="button" class="icon-btn danger" data-accion="eliminar" aria-label="Eliminar contrato N° ${esc(r.numeroContrato)}" title="Eliminar"><i class="fas fa-trash" aria-hidden="true"></i></button></td>
      </tr>`).join('');

    const tarjetas = visibles.map(r => `
      <article class="contrato${r.id === idResaltado ? ' resaltado' : ''}" data-id="${r.id}">
        <header>
          <div><span class="muted">Contrato</span> <strong>N° ${esc(r.numeroContrato)}</strong></div>
          <button type="button" class="icon-btn danger" data-accion="eliminar" aria-label="Eliminar contrato N° ${esc(r.numeroContrato)}"><i class="fas fa-trash" aria-hidden="true"></i></button>
        </header>
        <div class="contrato-monto">${fmt(r.capital)} <span class="muted">· inicio ${esc(C.fechaCorta(C.fechaDesdeISO(r.fechaInicioISO)))}</span></div>
        <dl>
          <div><dt>Factura 1 · ${esc(r.fechaFactura1)} · ${esc(r.diasTramo1)} días</dt><dd>${fmt(r.interes1)} <small>imp. ${fmt(r.impuesto1)}</small></dd></div>
          ${r.fechaFactura2 ? `<div><dt>Factura 2 · ${esc(r.fechaFactura2)} · ${esc(r.diasTramo2)} días</dt><dd>${fmt(r.interes2)} <small>imp. ${fmt(r.impuesto2)}</small></dd></div>` : ''}
          <div class="contrato-total"><dt>Interés total</dt><dd>${fmt(C.interesTotalDe(r))} <small>imp. ${fmt(C.impuestoTotalDe(r))}</small></dd></div>
        </dl>
        <details data-accion="dias-tarjeta"><summary>Ver días de pago (${C.plazoDeRegistro(r)})</summary><div class="dias-slot"></div></details>
      </article>`).join('');

    cont.innerHTML = `
      <p class="hint montos">Montos en soles (S/).${filtro ? ` Mostrando ${visibles.length} de ${todos.length} contratos.` : ''}</p>
      <div class="table-wrap vista-tabla">
        <table class="tabla ledger-table">
          <thead>
            <tr>
              <th scope="col" class="center" title="Número de fila">N°</th>
              <th scope="col" class="center" title="Número de contrato">Contrato</th>
              <th scope="col" class="center" title="Días de interés del primer mes">Días M1</th>
              <th scope="col" title="Fecha de la factura 1">Fecha F1</th>
              <th scope="col" class="num" title="Monto prestado">Monto</th>
              <th scope="col" class="num" title="Interés diario (monto × tasa diaria)">Int. diario</th>
              <th scope="col" class="num" title="Interés de la factura 1">Int. 1</th>
              <th scope="col" class="num" title="Impuesto de la factura 1">Imp. 1</th>
              <th scope="col" class="center" title="Días de interés de la factura 2">Días M2</th>
              <th scope="col" title="Fecha de la factura 2">Fecha F2</th>
              <th scope="col" class="num" title="Interés de la factura 2">Int. 2</th>
              <th scope="col" class="num" title="Impuesto de la factura 2">Imp. 2</th>
              <th scope="col" class="num" title="Interés total">Int. total</th>
              <th scope="col" class="num" title="Impuesto total">Imp. total</th>
              <th scope="col" class="center"><span class="sr-only">Días de pago</span></th>
              <th scope="col" class="center"><span class="sr-only">Eliminar</span></th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr>
              <td class="center">Σ</td><td></td><td></td><td>Totales</td>
              <td class="num">${num(t.monto)}</td><td></td>
              <td class="num">${num(t.interes1)}</td><td class="num">${num(t.impuesto1)}</td>
              <td></td><td></td>
              <td class="num">${num(t.interes2)}</td><td class="num">${num(t.impuesto2)}</td>
              <td class="num">${num(t.interes)}</td><td class="num">${num(t.impuesto)}</td>
              <td></td><td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="vista-tarjetas">
        ${tarjetas}
        <div class="totales-tarjetas">
          <div class="total-line"><span class="lbl">Monto prestado</span><span>${fmt(t.monto)}</span></div>
          <div class="total-line"><span class="lbl">Interés total</span><span>${fmt(t.interes)}</span></div>
          <div class="total-line"><span class="lbl">Impuesto total</span><span>${fmt(t.impuesto)}</span></div>
        </div>
      </div>`;

    renderMensual(todos);

    if (idResaltado) {
      const fila = cont.querySelector('.resaltado');
      if (fila) setTimeout(() => fila.classList.remove('resaltado'), 2500);
    }
  }

  function tablaDiasPago(r) {
    const dias = C.construirDiasPago(r);
    return `
      <div class="dias-scroll">
        <table class="tabla dias-table">
          <thead><tr><th scope="col">Día</th><th scope="col">Fecha</th><th scope="col" class="num">Sin interés</th><th scope="col" class="num">Con interés</th><th scope="col" class="num">Interés del día</th><th scope="col" class="num">Acumulado</th></tr></thead>
          <tbody>
            ${dias.map(d => `<tr><td class="muted">${d.n}</td><td>${esc(d.fecha)}</td><td class="num">${num(d.sinInteres)}</td><td class="num">${num(d.conInteres)}</td><td class="num">${num(d.interes)}</td><td class="num">${num(d.acumulado)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function buscarRegistro(id) {
    return A.leerRegistros().find(r => r.id === id);
  }

  function alternarDias(boton) {
    const fila = boton.closest('tr');
    const siguiente = fila.nextElementSibling;
    const icono = boton.querySelector('svg, i');
    if (siguiente && siguiente.classList.contains('dias-row')) {
      siguiente.remove();
      boton.setAttribute('aria-expanded', 'false');
      if (icono) icono.style.transform = '';
      return;
    }
    const r = buscarRegistro(Number(fila.dataset.id));
    if (!r) return;
    const tr = document.createElement('tr');
    tr.className = 'dias-row';
    tr.innerHTML = `<td colspan="16"><div class="dias-titulo">Días de pago · contrato N° ${esc(r.numeroContrato)}</div>${tablaDiasPago(r)}</td>`;
    fila.after(tr);
    boton.setAttribute('aria-expanded', 'true');
    if (icono) icono.style.transform = 'rotate(90deg)';
  }

  function eliminarContrato(id) {
    const quitado = A.eliminar(id);
    revisarErrorAlmacen();
    if (!quitado) return;
    renderTablero();
    toast('Contrato N° ' + quitado.numeroContrato + ' eliminado.', {
      texto: 'Deshacer',
      alHacer: () => { A.restaurar([quitado]); renderTablero(quitado.id); actualizarResumen(); }
    });
    actualizarResumen();
  }

  async function vaciarTablero() {
    const n = A.leerRegistros().length;
    if (!n) return;
    const ok = await confirmar(
      '¿Vaciar el tablero?',
      `Se eliminarán los ${n} contrato(s) del tablero. Te recomendamos descargar un respaldo o exportar a Excel antes.`,
      'Vaciar tablero');
    if (!ok) return;
    const anterior = A.vaciar();
    renderTablero();
    toast('Se vació el tablero (' + anterior.length + ' contratos).', {
      texto: 'Deshacer',
      alHacer: () => { A.restaurar(anterior); renderTablero(); actualizarResumen(); }
    });
    actualizarResumen();
  }

  // ---------- Resumen mensual ----------

  function renderMensual(lista) {
    const cont = $('mensualContenedor');
    const meses = C.resumenMensual(lista);
    $('resumenMensual').hidden = !meses.length;
    if (!meses.length) { cont.innerHTML = ''; return; }
    const tot = meses.reduce((a, m) => ({ f: a.f + m.facturas, i: a.i + m.interes, p: a.p + m.impuesto }), { f: 0, i: 0, p: 0 });
    cont.innerHTML = `
      <p class="hint montos">Montos en soles (S/).</p>
      <div class="table-wrap">
        <table class="tabla">
          <thead><tr><th scope="col">Mes</th><th scope="col" class="num">Facturas</th><th scope="col" class="num">Interés</th><th scope="col" class="num">Impuesto</th></tr></thead>
          <tbody>${meses.map(m => `<tr><td class="capitalizar">${C.nombreMes(m.anio, m.mes)}</td><td class="num">${m.facturas}</td><td class="num">${num(m.interes)}</td><td class="num">${num(m.impuesto)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td>Totales</td><td class="num">${tot.f}</td><td class="num">${num(tot.i)}</td><td class="num">${num(tot.p)}</td></tr></tfoot>
        </table>
      </div>`;
  }

  // ---------- Excel, respaldo e impresión ----------

  async function exportarExcel(boton) {
    const { todos, visibles } = registrosVisibles();
    const lista = filtro ? visibles : todos;
    if (!lista.length) {
      toast('No hay contratos para exportar.');
      return;
    }
    const original = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Generando…';
    try {
      const nombre = await window.ExportarExcel.descargar(lista);
      toast('Se descargó ' + nombre + (filtro ? ' (solo los contratos filtrados).' : '.'), null, 'ok');
    } catch (e) {
      console.error(e);
      toast(e.message || 'No se pudo generar el Excel.', null, 'error');
    } finally {
      boton.disabled = false;
      boton.innerHTML = original;
    }
  }

  function descargarRespaldo() {
    const datos = A.crearRespaldo();
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'respaldo-interes-simple-' + C.fechaAISO(new Date()) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Respaldo descargado (' + datos.registros.length + ' contratos). Guárdalo en un lugar seguro.', null, 'ok');
  }

  function restaurarRespaldo(archivo) {
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const res = A.importarRespaldo(JSON.parse(lector.result));
        renderTablero();
        actualizarResumen();
        const partes = [res.agregados + ' contrato(s) agregado(s)'];
        if (res.repetidos) partes.push(res.repetidos + ' ya estaban');
        if (res.conflictos) partes.push(res.conflictos + ' con N° de contrato repetido (no se agregaron)');
        if (res.invalidos) partes.push(res.invalidos + ' inválido(s)');
        toast('Respaldo restaurado: ' + partes.join(', ') + '.', null, res.agregados ? 'ok' : undefined);
        if (!$('numeroContrato').value || A.numeroEnUso(Number($('numeroContrato').value))) {
          $('numeroContrato').value = A.leerContador() + 1;
        }
      } catch (e) {
        console.error(e);
        toast(e instanceof SyntaxError ? 'El archivo no es un respaldo válido.' : e.message, null, 'error');
      }
    };
    lector.onerror = () => toast('No se pudo leer el archivo.', null, 'error');
    lector.readAsText(archivo);
  }

  function alternarMenu(forzarCerrar) {
    const menu = $('menuRespaldo');
    const boton = document.querySelector('[data-accion="menu-respaldo"]');
    const abrir = forzarCerrar ? false : menu.hidden;
    menu.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
  }

  // ---------- Eventos ----------

  function conectarEventos() {
    const form = $('formPrestamo');
    form.addEventListener('submit', guardarContrato);
    form.addEventListener('input', actualizarResumen);
    form.addEventListener('focusout', e => {
      if (e.target.id && CAMPOS.includes(e.target.id) && e.target.value !== '') {
        tocados.add(e.target.id);
        pintarErrores(errores(), false);
      }
    });

    $('buscar').addEventListener('input', e => {
      filtro = e.target.value.trim();
      renderTablero();
    });

    $('archivoRespaldo').addEventListener('change', e => {
      const archivo = e.target.files && e.target.files[0];
      if (archivo) restaurarRespaldo(archivo);
      e.target.value = '';
    });

    document.addEventListener('click', e => {
      const el = e.target.closest('[data-accion]');
      if (!el || el.tagName === 'DETAILS') {
        if (!e.target.closest('.menu')) alternarMenu(true);
        return;
      }
      const accion = el.dataset.accion;
      const contenedor = el.closest('[data-id]');
      const id = contenedor ? Number(contenedor.dataset.id) : null;
      if (accion !== 'menu-respaldo') alternarMenu(true);

      switch (accion) {
        case 'dias': alternarDias(el); break;
        case 'eliminar': eliminarContrato(id); break;
        case 'vaciar': vaciarTablero(); break;
        case 'excel': exportarExcel(el); break;
        case 'menu-respaldo': alternarMenu(); break;
        case 'descargar-respaldo': descargarRespaldo(); break;
        case 'restaurar-respaldo': $('archivoRespaldo').click(); break;
        case 'imprimir': window.print(); break;
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') alternarMenu(true);
    });

    // Días de pago en la vista de tarjetas (celular): se generan al abrir.
    document.addEventListener('toggle', e => {
      const det = e.target;
      if (!(det instanceof HTMLDetailsElement) || det.dataset.accion !== 'dias-tarjeta' || !det.open) return;
      const slot = det.querySelector('.dias-slot');
      if (slot.childElementCount) return;
      const r = buscarRegistro(Number(det.closest('[data-id]').dataset.id));
      if (r) slot.innerHTML = tablaDiasPago(r);
    }, true);

    // Si el tablero cambia en otra pestaña, se actualiza aquí también.
    window.addEventListener('storage', e => {
      if (e.key === A.CLAVES.tablero || e.key === A.CLAVES.contador) {
        renderTablero();
        actualizarResumen();
      }
    });
  }

  // ---------- Inicio ----------

  function iniciar() {
    if (!A.disponible()) {
      mostrarAviso('Este navegador no permite guardar datos (¿modo privado?). Puedes calcular, pero los contratos no se guardarán.');
    }

    const prefs = A.leerPreferencias();
    if (Number.isFinite(prefs.tasaPct)) $('tasaPct').value = prefs.tasaPct;
    if (Number.isInteger(prefs.plazoDias)) $('plazoDias').value = prefs.plazoDias;
    if (Number.isFinite(prefs.impuestoPct)) $('impuestoPct').value = prefs.impuestoPct;
    $('fechaInicioISO').value = C.fechaAISO(new Date());

    // leerRegistros() migra los contratos antiguos antes de sugerir el número.
    A.leerRegistros();
    revisarErrorAlmacen();
    $('numeroContrato').value = A.leerContador() + 1;

    conectarEventos();
    renderTablero();
    actualizarResumen();
  }

  iniciar();
})();
