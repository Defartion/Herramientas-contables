/*
 * Utilidades puras compartidas (fechas, redondeo, impuestos por tramos).
 * No tocan la página: se usan igual en el navegador (global `Util`) y en
 * las pruebas de Node (require).
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Util = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIA_MS = 86400000;

  const dos = n => String(n).padStart(2, '0');

  /** Redondeo a centavos (evita errores como 1.005 → 1.00). */
  function r2(n) {
    if (!Number.isFinite(n)) return n;
    const signo = n < 0 ? -1 : 1;
    return signo * Math.round(Math.abs(n) * 100 + 1e-9) / 100;
  }

  const esNumero = n => typeof n === 'number' && Number.isFinite(n);

  // ---------- Fechas (siempre en hora local, sin horas) ----------

  /** 'AAAA-MM-DD' → Date, o null si no es una fecha real. */
  function desdeISO(iso) {
    if (iso instanceof Date) return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const f = new Date(y, m - 1, d);
    if (f.getFullYear() !== y || f.getMonth() !== m - 1 || f.getDate() !== d) return null;
    return f;
  }

  const aISO = f => f.getFullYear() + '-' + dos(f.getMonth() + 1) + '-' + dos(f.getDate());
  const corta = f => dos(f.getDate()) + '/' + dos(f.getMonth() + 1) + '/' + f.getFullYear();
  const larga = f => f.getDate() + ' de ' + MESES[f.getMonth()] + ' de ' + f.getFullYear();
  const nombreMes = m => MESES[m];
  const mesAnio = (anio, mes) => MESES[mes] + ' ' + anio;

  function hoy() {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), h.getDate());
  }

  const utc = f => Date.UTC(f.getFullYear(), f.getMonth(), f.getDate());

  /** Días desde `a` hasta `b` (b − a). */
  const diasEntre = (a, b) => Math.round((utc(b) - utc(a)) / DIA_MS);

  function sumarDias(f, n) {
    const x = new Date(f);
    x.setDate(x.getDate() + n);
    return x;
  }

  const diasDelMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();

  /** Suma meses respetando fin de mes (31/01 + 1 mes = 28/02). */
  function sumarMeses(f, n, diaBase) {
    const dia = diaBase || f.getDate();
    const total = f.getMonth() + n;
    const anio = f.getFullYear() + Math.floor(total / 12);
    const mes = ((total % 12) + 12) % 12;
    return new Date(anio, mes, Math.min(dia, diasDelMes(anio, mes)));
  }

  const inicioDeMes = f => new Date(f.getFullYear(), f.getMonth(), 1);
  const finDeMes = f => new Date(f.getFullYear(), f.getMonth() + 1, 0);

  /**
   * Tiempo transcurrido de `desde` a `hasta`, ambos incluidos, en años,
   * meses y días (método de aniversarios).
   */
  function tiempoServicio(desde, hasta) {
    if (hasta < desde) return { anios: 0, meses: 0, dias: 0 };
    const fin = sumarDias(hasta, 1);
    const dia = desde.getDate();
    let anios = 0;
    while (sumarMeses(desde, (anios + 1) * 12, dia) <= fin) anios++;
    let meses = 0;
    while (sumarMeses(desde, anios * 12 + meses + 1, dia) <= fin) meses++;
    const base = sumarMeses(desde, anios * 12 + meses, dia);
    return { anios, meses, dias: diasEntre(base, fin) };
  }

  /** Meses calendario completos dentro de [desde, hasta] (ambos incluidos). */
  function mesesCompletos(desde, hasta) {
    let m = desde.getDate() === 1 ? inicioDeMes(desde) : sumarMeses(inicioDeMes(desde), 1);
    let n = 0;
    while (finDeMes(m) <= hasta) {
      n++;
      m = sumarMeses(m, 1);
    }
    return n;
  }

  const esFinDeSemana = f => f.getDay() === 0 || f.getDay() === 6;

  /** Si cae sábado o domingo, pasa al lunes (no considera feriados). */
  function siguienteHabil(f) {
    let x = new Date(f);
    while (esFinDeSemana(x)) x = sumarDias(x, 1);
    return x;
  }

  // ---------- Impuestos ----------

  /**
   * Impuesto progresivo acumulativo.
   * @param {number} base  monto sobre el que se calcula
   * @param {{hasta:number, tasa:number}[]} tramos  límites absolutos ascendentes; tasa en %
   */
  function impuestoPorTramos(base, tramos) {
    let impuesto = 0;
    let desde = 0;
    const detalle = [];
    for (const t of tramos) {
      if (base <= desde) break;
      const tope = Math.min(base, t.hasta);
      const monto = tope - desde;
      const imp = monto * t.tasa / 100;
      detalle.push({ desde, hasta: t.hasta, base: monto, tasa: t.tasa, impuesto: imp });
      impuesto += imp;
      desde = t.hasta;
    }
    return { impuesto, detalle };
  }

  /** Convierte tramos expresados en UIT a montos. */
  const tramosEnSoles = (tramosUIT, uit) => tramosUIT.map(t => ({ hasta: t.hasta * uit, tasa: t.tasa }));

  // ---------- Finanzas ----------

  /** Tasa interna de retorno por periodo (bisección). flujos[0] suele ser negativo. */
  function tir(flujos) {
    const vpn = r => flujos.reduce((s, f, i) => s + f / Math.pow(1 + r, i), 0);
    let bajo = -0.99, alto = 10;
    let vBajo = vpn(bajo), vAlto = vpn(alto);
    if (!Number.isFinite(vBajo) || !Number.isFinite(vAlto) || vBajo * vAlto > 0) return NaN;
    for (let i = 0; i < 300; i++) {
      const medio = (bajo + alto) / 2;
      const v = vpn(medio);
      if (Math.abs(v) < 1e-10) return medio;
      if (v * vBajo > 0) { bajo = medio; vBajo = v; } else { alto = medio; }
    }
    return (bajo + alto) / 2;
  }

  return {
    MESES, r2, esNumero,
    desdeISO, aISO, corta, larga, nombreMes, mesAnio, hoy, diasEntre, sumarDias, diasDelMes,
    sumarMeses, inicioDeMes, finDeMes, tiempoServicio, mesesCompletos, esFinDeSemana, siguienteHabil,
    impuestoPorTramos, tramosEnSoles, tir
  };
});
