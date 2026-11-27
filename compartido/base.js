/*
 * Librería compartida de las herramientas (global `HC`).
 * - Formato de montos, porcentajes y fechas.
 * - Formularios a partir de una lista de campos, con validación visible,
 *   valores recordados y botón "Restablecer".
 * - Tablas, líneas de totales, tarjetas de resumen y notas.
 * - Exportación a Excel (SheetJS se descarga solo al exportar).
 * Requiere compartido/util.js cargado antes.
 */
(function () {
  'use strict';
  const U = window.Util;
  const HC = {};
  const $ = id => document.getElementById(id);
  HC.$ = $;

  // ---------- Formato ----------

  const formatos = {};
  const formato = dec => formatos[dec] || (formatos[dec] = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: dec, maximumFractionDigits: dec
  }));
  const casiCero = (n, dec) => Math.abs(n) < 0.5 * Math.pow(10, -dec);

  HC.numero = (n, dec = 2) => Number.isFinite(n) ? formato(dec).format(casiCero(n, dec) ? 0 : n) : '-';
  HC.dinero = (n, simbolo = 'S/') => {
    if (!Number.isFinite(n)) return '-';
    const negativo = n < 0 && !casiCero(n, 2);
    return (negativo ? '-' : '') + simbolo + ' ' + formato(2).format(Math.abs(n));
  };
  HC.pct = (n, dec = 2) => Number.isFinite(n) ? HC.numero(n, dec) + ' %' : '-';
  /** Número sin ceros de relleno: 9 → "9", 6.75 → "6.75". */
  HC.numeroCorto = (n, maxDec = 2) => Number.isFinite(n)
    ? new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: maxDec }).format(n) : '-';
  HC.fecha = f => {
    const d = f instanceof Date ? f : U.desdeISO(f);
    return d ? U.corta(d) : '-';
  };
  HC.esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // ---------- Guardado en el navegador ----------

  HC.leerJSON = (clave, defecto) => {
    try {
      const v = localStorage.getItem(clave);
      return v ? JSON.parse(v) : defecto;
    } catch (e) {
      return defecto;
    }
  };
  HC.guardarJSON = (clave, valor) => {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  };

  // ---------- Avisos ----------

  let temporizador = null;
  HC.toast = (mensaje, tipo) => {
    let el = $('hc-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'hc-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.className = 'toast' + (tipo ? ' toast-' + tipo : '');
    el.textContent = mensaje;
    el.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { el.hidden = true; }, 4500);
  };

  // ---------- Formularios ----------

  const NUMERICOS = ['dinero', 'pct', 'numero', 'entero'];

  /**
   * Crea un formulario dentro de `contenedor` (un <form>).
   * campos: lista de
   *   { id, etiqueta, tipo, valor, opciones, ayuda, prefijo, min, max, paso, parametro, si }
   *   { seccion: 'Título' }
   *   { grupo: [campo, campo] }   (campos en una misma fila)
   * tipo: dinero | pct | numero | entero | fecha | mes | texto | select | check | segmento
   * parametro: true → no se recuerda (siempre parte del valor vigente).
   * si: valores => boolean → el campo se muestra solo si devuelve true.
   */
  HC.formulario = function (contenedor, campos, opciones = {}) {
    const raiz = typeof contenedor === 'string' ? $(contenedor) : contenedor;
    const clave = opciones.clave ? 'hc:' + opciones.clave + ':formulario' : null;
    const guardados = clave ? HC.leerJSON(clave, {}) : {};
    const defs = [];
    const tocados = new Set();
    const oyentes = [];

    const valorInicial = c => {
      let v = c.valor;
      if (v === 'hoy') v = U.aISO(U.hoy());
      if (v === 'mes-actual') v = U.aISO(U.hoy()).slice(0, 7);
      if (!c.parametro && guardados && Object.prototype.hasOwnProperty.call(guardados, c.id)) {
        const g = guardados[c.id];
        const valido = c.tipo === 'select' || c.tipo === 'segmento'
          ? (c.opciones || []).some(o => String(o[0]) === String(g))
          : true;
        if (valido) v = g;
      }
      return v == null ? '' : v;
    };

    function htmlCampo(c) {
      defs.push(c);
      const id = 'f-' + c.id;
      const v = valorInicial(c);
      const ayuda = c.ayuda ? `<small class="ayuda" id="ayuda-${c.id}">${HC.esc(c.ayuda)}</small>` : '';
      const describe = `aria-describedby="err-${c.id}${c.ayuda ? ' ayuda-' + c.id : ''}"`;
      const error = `<small class="error" id="err-${c.id}"></small>`;
      const atributos = [
        c.min != null ? `min="${c.min}"` : '',
        c.max != null ? `max="${c.max}"` : '',
        c.placeholder ? `placeholder="${HC.esc(c.placeholder)}"` : ''
      ].join(' ');
      let control;

      switch (c.tipo) {
        case 'check':
          return `<div class="field" data-campo="${c.id}"><label class="check"><input type="checkbox" id="${id}" ${v === true || v === 'true' ? 'checked' : ''} ${describe}> <span>${HC.esc(c.etiqueta)}</span></label>${ayuda}${error}</div>`;
        case 'segmento':
          return `<div class="field" data-campo="${c.id}"><div class="label" id="lbl-${c.id}">${HC.esc(c.etiqueta)}</div>
            <div class="segmento" role="radiogroup" aria-labelledby="lbl-${c.id}">
              ${c.opciones.map(([valor, texto]) => `<label><input type="radio" name="${id}" value="${HC.esc(valor)}" ${String(valor) === String(v) ? 'checked' : ''}><span>${HC.esc(texto)}</span></label>`).join('')}
            </div>${ayuda}${error}</div>`;
        case 'select':
          control = `<select id="${id}" ${describe}>${c.opciones.map(([valor, texto]) =>
            `<option value="${HC.esc(valor)}" ${String(valor) === String(v) ? 'selected' : ''}>${HC.esc(texto)}</option>`).join('')}</select>`;
          break;
        case 'fecha':
          control = `<input type="date" id="${id}" value="${HC.esc(v)}" ${describe}>`;
          break;
        case 'mes':
          control = `<input type="month" id="${id}" value="${HC.esc(v)}" placeholder="AAAA-MM" ${describe}>`;
          break;
        case 'texto':
          control = `<input type="text" id="${id}" value="${HC.esc(v)}" ${atributos} ${describe}>`;
          break;
        default: {
          const paso = c.paso || (c.tipo === 'entero' ? '1' : c.tipo === 'dinero' ? '0.01' : 'any');
          const modo = c.tipo === 'entero' ? 'numeric' : 'decimal';
          const input = `<input type="number" id="${id}" value="${HC.esc(v)}" step="${paso}" inputmode="${modo}" ${atributos} ${describe}>`;
          if (c.tipo === 'dinero') control = `<div class="con-prefijo"><span aria-hidden="true">${HC.esc(c.prefijo || 'S/')}</span>${input}</div>`;
          else if (c.tipo === 'pct') control = `<div class="con-sufijo">${input}<span aria-hidden="true">%</span></div>`;
          else control = input;
        }
      }
      return `<div class="field" data-campo="${c.id}"><label for="${id}">${HC.esc(c.etiqueta)}</label>${control}${ayuda}${error}</div>`;
    }

    function render(lista) {
      return lista.map(c => {
        if (c.seccion) return `<div class="seccion-form">${HC.esc(c.seccion)}</div>`;
        if (c.grupo) return `<div class="fila-campos">${render(c.grupo)}</div>`;
        return htmlCampo(c);
      }).join('');
    }

    raiz.innerHTML = render(campos) + (opciones.restablecer === false ? '' :
      '<div class="acciones" style="justify-content:flex-end"><button type="button" class="btn btn-sm" data-restablecer><i class="fas fa-rotate-left" aria-hidden="true"></i> Restablecer valores</button></div>');
    raiz.setAttribute('novalidate', '');
    raiz.addEventListener('submit', e => e.preventDefault());

    const control = c => c.tipo === 'segmento' ? raiz.querySelector(`input[name="f-${c.id}"]`) : $('f-' + c.id);
    const envoltura = c => raiz.querySelector(`[data-campo="${c.id}"]`);

    function leer(c) {
      if (c.tipo === 'check') return $('f-' + c.id).checked;
      if (c.tipo === 'segmento') {
        const r = raiz.querySelector(`input[name="f-${c.id}"]:checked`);
        return r ? r.value : '';
      }
      const el = $('f-' + c.id);
      if (NUMERICOS.includes(c.tipo)) return el.value.trim() === '' ? NaN : Number(el.value);
      return el.value;
    }

    const f = {};
    f.valores = () => {
      const v = {};
      defs.forEach(c => { v[c.id] = leer(c); });
      return v;
    };
    f.visible = id => {
      const c = defs.find(d => d.id === id);
      return !!c && !envoltura(c).hidden;
    };

    function actualizarVisibilidad() {
      const v = f.valores();
      defs.forEach(c => {
        if (typeof c.si === 'function') envoltura(c).hidden = !c.si(v);
      });
    }

    function guardar() {
      if (!clave) return;
      const datos = {};
      const v = f.valores();
      defs.forEach(c => {
        if (c.parametro) return;
        const x = v[c.id];
        datos[c.id] = typeof x === 'number' && Number.isNaN(x) ? '' : x;
      });
      HC.guardarJSON(clave, datos);
    }

    let pendiente = false;
    function notificar() {
      actualizarVisibilidad();
      guardar();
      const v = f.valores();
      oyentes.forEach(fn => fn(v));
    }
    function programar(e) {
      if (e && e.target) {
        const nombre = (e.target.name || e.target.id || '').replace(/^f-/, '');
        if (nombre) tocados.add(nombre);
      }
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; notificar(); });
    }
    raiz.addEventListener('input', programar);
    raiz.addEventListener('change', programar);
    raiz.addEventListener('focusout', programar);

    const botonRestablecer = raiz.querySelector('[data-restablecer]');
    if (botonRestablecer) botonRestablecer.addEventListener('click', () => f.restablecer());

    /** Muestra los errores de los campos visibles. Devuelve true si no hay ninguno. */
    f.errores = (errs = {}) => {
      let hay = false;
      defs.forEach(c => {
        const el = $('err-' + c.id);
        if (!el) return;
        const oculto = envoltura(c).hidden;
        const msg = !oculto && errs[c.id] ? errs[c.id] : '';
        if (msg) hay = true;
        const valor = leer(c);
        const lleno = !(valor === '' || (typeof valor === 'number' && Number.isNaN(valor)));
        const mostrar = msg && (tocados.has(c.id) || lleno);
        el.textContent = mostrar ? msg : '';
        const ctl = control(c);
        if (ctl) ctl.setAttribute('aria-invalid', mostrar ? 'true' : 'false');
      });
      return !hay;
    };

    f.establecer = (id, valor) => {
      const c = defs.find(d => d.id === id);
      if (!c) return;
      if (c.tipo === 'check') $('f-' + id).checked = !!valor;
      else if (c.tipo === 'segmento') {
        const r = raiz.querySelector(`input[name="f-${id}"][value="${CSS.escape(String(valor))}"]`);
        if (r) r.checked = true;
      } else $('f-' + id).value = valor;
      programar();
    };

    f.restablecer = () => {
      if (clave) { try { localStorage.removeItem(clave); } catch (e) { /* nada */ } }
      defs.forEach(c => {
        let v = c.valor;
        if (v === 'hoy') v = U.aISO(U.hoy());
        if (v === 'mes-actual') v = U.aISO(U.hoy()).slice(0, 7);
        if (c.tipo === 'check') $('f-' + c.id).checked = v === true;
        else if (c.tipo === 'segmento') {
          raiz.querySelectorAll(`input[name="f-${c.id}"]`).forEach(r => { r.checked = String(r.value) === String(v); });
        } else $('f-' + c.id).value = v == null ? '' : v;
      });
      tocados.clear();
      notificar();
      HC.toast('Se restablecieron los valores.');
    };

    f.alCambiar = fn => {
      oyentes.push(fn);
      actualizarVisibilidad();
      fn(f.valores());
    };

    actualizarVisibilidad();
    return f;
  };

  // ---------- Bloques de resultados ----------

  const ICONOS = { info: 'fa-circle-info', warn: 'fa-triangle-exclamation', ok: 'fa-circle-check' };
  HC.notaHTML = (html, tipo = 'info') =>
    `<div class="note note-${tipo}"><i class="fas ${ICONOS[tipo] || ICONOS.info}" aria-hidden="true"></i><span>${html}</span></div>`;
  HC.nota = (texto, tipo = 'info') => HC.notaHTML(HC.esc(texto), tipo);

  HC.vacio = (texto, icono = 'fa-calculator') =>
    `<div class="vacio"><i class="fas ${icono}" aria-hidden="true"></i>${HC.esc(texto)}</div>`;

  /** items: [{ etiqueta, valor, nota, acento }] — `valor` ya formateado. */
  HC.stats = items => `<div class="stat-grid">${items.map(s => `
    <div class="stat${s.acento ? ' stat-accent' : ''}"><div class="label">${HC.esc(s.etiqueta)}</div>
    <div class="value">${HC.esc(s.valor)}</div>${s.nota ? `<div class="nota">${HC.esc(s.nota)}</div>` : ''}</div>`).join('')}</div>`;

  /** items: [{ etiqueta, valor, detalle, clase: 'fuerte'|'big'|'sub', claseValor }] */
  HC.lineas = items => `<div class="lineas">${items.filter(Boolean).map(l => `
    <div class="total-line ${l.clase || ''}"><span class="lbl">${HC.esc(l.etiqueta)}${l.detalle ? `<small>${HC.esc(l.detalle)}</small>` : ''}</span>
    <span class="${l.claseValor || ''}">${HC.esc(l.valor)}</span></div>`).join('')}</div>`;

  const formatearCelda = (tipo, v) => {
    if (v == null || v === '') return '';
    switch (tipo) {
      case 'dinero': return HC.dinero(v);
      case 'num': return HC.numero(v, 2);
      case 'num4': return HC.numero(v, 4);
      case 'entero': return HC.numero(v, 0);
      case 'pct': return HC.pct(v);
      case 'pct4': return HC.pct(v, 4);
      case 'fecha': return HC.fecha(v);
      default: return String(v);
    }
  };
  const esNumerica = t => ['dinero', 'num', 'num4', 'entero', 'pct', 'pct4'].includes(t);

  /**
   * columnas: [{ titulo, campo | valor(fila), tipo, html, clase }]
   * filas: lista de objetos; pie: objeto opcional para la fila de totales.
   */
  HC.tabla = ({ columnas, filas, pie, alto, clase, claseFila }) => {
    const celda = (col, fila) => {
      const v = typeof col.valor === 'function' ? col.valor(fila) : fila[col.campo];
      const contenido = col.html ? (v == null ? '' : v) : HC.esc(formatearCelda(col.tipo, v));
      const clases = [esNumerica(col.tipo) ? 'num' : '', col.clase || ''].join(' ').trim();
      return `<td${clases ? ` class="${clases}"` : ''}>${contenido}</td>`;
    };
    const th = columnas.map(c => `<th scope="col"${esNumerica(c.tipo) ? ' class="num"' : ''}>${HC.esc(c.titulo)}</th>`).join('');
    const cuerpo = filas.map(f => `<tr${claseFila && claseFila(f) ? ` class="${claseFila(f)}"` : ''}>${columnas.map(c => celda(c, f)).join('')}</tr>`).join('');
    const piePagina = pie ? `<tfoot><tr>${columnas.map(c => celda(c, pie)).join('')}</tr></tfoot>` : '';
    return `<div class="table-wrap${alto ? ' alto' : ''}"><table class="tabla ${clase || ''}"><thead><tr>${th}</tr></thead><tbody>${cuerpo}</tbody>${piePagina}</table></div>`;
  };

  HC.fuente = texto => `<p class="fuente">${HC.esc(texto)}</p>`;

  // ---------- Excel ----------

  const URL_SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  let cargando = null;
  function cargarSheetJS() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (cargando) return cargando;
    cargando = new Promise((resolver, rechazar) => {
      const s = document.createElement('script');
      s.src = URL_SHEETJS;
      s.onload = () => window.XLSX ? resolver(window.XLSX) : rechazar(new Error('No se pudo cargar la librería de Excel.'));
      s.onerror = () => {
        cargando = null;
        s.remove();
        rechazar(new Error('No se pudo descargar la librería de Excel. Revisa tu conexión a internet e intenta de nuevo.'));
      };
      document.head.appendChild(s);
    });
    return cargando;
  }

  const X = {};
  X.dinero = n => Number.isFinite(n) ? { t: 'n', v: U.r2(n), z: '#,##0.00' } : null;
  X.numero = (n, z = '#,##0.00') => Number.isFinite(n) ? { t: 'n', v: n, z } : null;
  X.entero = n => Number.isFinite(n) ? { t: 'n', v: n, z: '0' } : null;
  /** Porcentaje: recibe el valor en % (por ejemplo 18 → 18 %). */
  X.pct = (n, z = '0.00%') => Number.isFinite(n) ? { t: 'n', v: n / 100, z } : null;
  X.fecha = f => {
    const d = f instanceof Date ? f : U.desdeISO(f);
    if (!d) return null;
    const serie = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);
    return { t: 'n', v: serie, z: 'dd/mm/yyyy' };
  };
  X.texto = s => (s == null || s === '' ? null : { t: 's', v: String(s) });

  function celdaExcel(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'object' && v.t) return v;
    if (typeof v === 'number') return Number.isFinite(v) ? { t: 'n', v } : null;
    return { t: 's', v: String(v) };
  }

  function hoja(XLSX, filas, anchos) {
    const ws = {};
    let maxCol = 0;
    filas.forEach((fila, r) => (fila || []).forEach((v, c) => {
      const celda = celdaExcel(v);
      if (!celda) return;
      ws[XLSX.utils.encode_cell({ r, c })] = celda;
      if (c > maxCol) maxCol = c;
    }));
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(filas.length - 1, 0), c: maxCol } });
    if (anchos && anchos.length) ws['!cols'] = anchos.map(wch => ({ wch }));
    return ws;
  }

  /** hojas: [{ nombre, filas: [[valor|celda, ...], ...], anchos: [n, ...] }] */
  X.descargar = async (nombreBase, hojas) => {
    const XLSX = await cargarSheetJS();
    const wb = XLSX.utils.book_new();
    hojas.forEach(h => XLSX.utils.book_append_sheet(wb, hoja(XLSX, h.filas, h.anchos), h.nombre.slice(0, 31)));
    const nombre = nombreBase + '-' + U.aISO(new Date()) + '.xlsx';
    XLSX.writeFile(wb, nombre);
    return nombre;
  };

  /** Conecta un botón: al hacer clic genera las hojas con `armar()` y descarga. */
  X.conectarBoton = (boton, nombreBase, armar) => {
    const el = typeof boton === 'string' ? $(boton) : boton;
    if (!el) return;
    el.addEventListener('click', async () => {
      const hojas = armar();
      if (!hojas) return;
      const original = el.innerHTML;
      el.disabled = true;
      el.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Generando…';
      try {
        const nombre = await X.descargar(nombreBase, hojas);
        HC.toast('Se descargó ' + nombre, 'ok');
      } catch (e) {
        console.error(e);
        HC.toast(e.message || 'No se pudo generar el Excel.', 'error');
      } finally {
        el.disabled = false;
        el.innerHTML = original;
      }
    });
  };

  HC.excel = X;
  window.HC = HC;
})();
