/*
 * Lógica de cálculo de la Calculadora de Interés Simple.
 *
 * Este archivo NO toca la página (ni el DOM ni localStorage): solo recibe
 * datos y devuelve resultados. Así se puede probar por separado
 * (ver tests/calculo.test.js) y se usa igual en el navegador.
 *
 * IMPORTANTE: los resultados deben ser idénticos a los de la versión
 * anterior porque ya hay contratos guardados con ellos. Si cambias una
 * fórmula, corre las pruebas (npm test) y revisa docs/calculadora-interes-simple.md.
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;          // Node (pruebas)
  } else {
    raiz.Calculo = api;            // Navegador
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PLAZO_POR_DEFECTO = 24;
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // ---------- Fechas ----------

  /** 'AAAA-MM-DD' -> Date local (sin problemas de zona horaria). */
  function fechaDesdeISO(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    // Rechaza fechas imposibles como 2026-02-31.
    if (fecha.getFullYear() !== y || fecha.getMonth() !== m - 1 || fecha.getDate() !== d) return null;
    return fecha;
  }

  /** Date -> 'AAAA-MM-DD'. */
  function fechaAISO(fecha) {
    return fecha.getFullYear() + '-' + dos(fecha.getMonth() + 1) + '-' + dos(fecha.getDate());
  }

  /** Date -> 'DD/MM/AAAA' (mismo formato que se guardó siempre en el tablero). */
  function fechaCorta(fecha) {
    return dos(fecha.getDate()) + '/' + dos(fecha.getMonth() + 1) + '/' + fecha.getFullYear();
  }

  /** 'DD/MM/AAAA' -> Date, o null si no tiene ese formato. */
  function fechaDesdeCorta(texto) {
    if (typeof texto !== 'string') return null;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }

  function fechaLarga(fecha) {
    return fecha.getDate() + ' de ' + MESES[fecha.getMonth()] + ' de ' + fecha.getFullYear();
  }

  function nombreMes(anio, mes) {
    return MESES[mes] + ' ' + anio;
  }

  function dos(n) {
    return String(n).padStart(2, '0');
  }

  // ---------- Validación ----------

  /**
   * Revisa los datos del formulario. Devuelve un objeto con los errores por
   * campo; si está vacío, los datos son válidos.
   */
  function validarEntrada(e) {
    const errores = {};
    if (!esNumero(e.capital) || e.capital <= 0) errores.capital = 'Ingresa un monto mayor a cero.';
    if (!fechaDesdeISO(e.fechaInicioISO)) errores.fechaInicioISO = 'Ingresa una fecha válida.';
    if (!esNumero(e.tasaPct) || e.tasaPct < 0) errores.tasaPct = 'La tasa no puede ser negativa.';
    if (!Number.isInteger(e.plazoDias) || e.plazoDias <= 0) errores.plazoDias = 'El plazo debe ser un número entero de días mayor a cero.';
    else if (e.plazoDias > 3660) errores.plazoDias = 'El plazo es demasiado largo (máximo 3660 días).';
    if (!esNumero(e.impuestoPct) || e.impuestoPct < 0 || e.impuestoPct > 100) errores.impuestoPct = 'El impuesto debe estar entre 0 y 100 %.';
    return errores;
  }

  function esNumero(n) {
    return typeof n === 'number' && Number.isFinite(n);
  }

  // ---------- Cálculo principal ----------

  /**
   * Calcula un préstamo.
   * @param {{capital:number, tasaPct:number, plazoDias:number, impuestoPct:number, fechaInicioISO:string}} e
   */
  function calcularPrestamo(e) {
    const errores = validarEntrada(e);
    if (Object.keys(errores).length) {
      throw new Error('Datos inválidos: ' + Object.values(errores).join(' '));
    }

    const capital = e.capital;
    const tasaTotal = e.tasaPct / 100;
    const plazoDias = e.plazoDias;
    const impuesto = e.impuestoPct / 100;
    const tasaDiaria = tasaTotal / plazoDias;
    const interesDiario = capital * tasaDiaria;

    // Agrupa los días del préstamo por mes calendario.
    const inicio = fechaDesdeISO(e.fechaInicioISO);
    const cursor = new Date(inicio);
    const meses = [];
    let ultimoDia = new Date(cursor);
    for (let i = 0; i < plazoDias; i++) {
      const anio = cursor.getFullYear();
      const mes = cursor.getMonth();
      let grupo = meses[meses.length - 1];
      if (!grupo || grupo.anio !== anio || grupo.mes !== mes) {
        grupo = { anio, mes, dias: 0, desde: new Date(cursor), hasta: null, interes: 0 };
        meses.push(grupo);
      }
      grupo.dias += 1;
      grupo.hasta = new Date(cursor);
      ultimoDia = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }

    let interesTotal = 0;
    meses.forEach(g => {
      g.interes = capital * tasaDiaria * g.dias;
      interesTotal += g.interes;
    });

    // Factura 1: días del primer mes; se emite el último de esos días.
    const tramo1 = meses[0];
    const interes1 = capital * tasaDiaria * tramo1.dias;
    const factura1 = {
      dias: tramo1.dias,
      fecha: new Date(tramo1.hasta),
      interes: interes1,
      impuesto: interes1 * impuesto
    };

    // Factura 2: todos los días restantes; se emite el último día del préstamo.
    let factura2 = null;
    if (meses.length > 1) {
      const dias2 = meses.slice(1).reduce((acc, g) => acc + g.dias, 0);
      const interes2 = capital * tasaDiaria * dias2;
      factura2 = {
        dias: dias2,
        fecha: new Date(ultimoDia),
        interes: interes2,
        impuesto: interes2 * impuesto
      };
    }

    const impuestoTotal = interesTotal * impuesto;
    return {
      entrada: { ...e },
      tasaDiaria,
      interesDiario,
      meses,
      ultimoDia,
      interesTotal,
      impuestoTotal,
      interesNeto: interesTotal - impuestoTotal,
      totalPagar: capital + interesTotal,
      factura1,
      factura2
    };
  }

  /**
   * Convierte un resultado en el registro que se guarda en el tablero.
   * Mantiene los mismos campos que la versión anterior y agrega algunos
   * informativos (tasaPct, plazoDias, impuestoPct, creadoEn).
   */
  function crearRegistro(resultado, numeroContrato, id, ahora) {
    const e = resultado.entrada;
    const f2 = resultado.factura2;
    return {
      id,
      numeroContrato,
      fechaInicioISO: e.fechaInicioISO,
      fechaFactura1: fechaCorta(resultado.factura1.fecha),
      capital: e.capital,
      interesDiario: resultado.interesDiario,
      interes1: resultado.factura1.interes,
      impuesto1: resultado.factura1.impuesto,
      diasTramo1: resultado.factura1.dias,
      diasTramo2: f2 ? f2.dias : 0,
      fechaFactura2: f2 ? fechaCorta(f2.fecha) : null,
      interes2: f2 ? f2.interes : null,
      impuesto2: f2 ? f2.impuesto : null,
      tasaPct: e.tasaPct,
      plazoDias: e.plazoDias,
      impuestoPct: e.impuestoPct,
      creadoEn: (ahora || new Date()).toISOString()
    };
  }

  // ---------- Registros guardados ----------

  /**
   * Completa los registros guardados por versiones antiguas. No modifica la
   * lista recibida: devuelve una copia, el contador actualizado y si hubo
   * cambios (para volver a guardar).
   */
  function migrarRegistros(listaOriginal, contadorActual) {
    const lista = listaOriginal.map(r => ({ ...r }));
    let contador = Math.max(contadorActual || 0, lista.reduce((max, r) =>
      (typeof r.numeroContrato === 'number' && r.numeroContrato > max) ? r.numeroContrato : max, 0));
    let cambio = false;

    lista.forEach(r => {
      // v1: sin número de contrato -> se asigna el siguiente correlativo.
      if (typeof r.numeroContrato !== 'number') {
        contador += 1;
        r.numeroContrato = contador;
        cambio = true;
      }
      // v1: sin interés diario -> interés total / plazo (24 si no se conoce).
      if (typeof r.interesDiario !== 'number') {
        const interesTotal = r.interes1 + (r.interes2 || 0);
        const plazo = (typeof r.plazoDias === 'number' && r.plazoDias > 0) ? r.plazoDias : PLAZO_POR_DEFECTO;
        r.interesDiario = interesTotal / plazo;
        cambio = true;
      }
      // v1: sin días por tramo -> interés del tramo / interés diario.
      if (typeof r.diasTramo1 !== 'number') {
        r.diasTramo1 = r.interesDiario > 0 ? Math.round(r.interes1 / r.interesDiario) : PLAZO_POR_DEFECTO;
        cambio = true;
      }
      if (typeof r.diasTramo2 !== 'number') {
        r.diasTramo2 = (r.interes2 != null && r.interesDiario > 0)
          ? Math.round(r.interes2 / r.interesDiario) : 0;
        cambio = true;
      }
    });

    return { lista, contador, cambio };
  }

  /** Revisa que un objeto tenga la forma mínima de un registro del tablero. */
  function esRegistroValido(r) {
    return !!r && typeof r === 'object'
      && esNumero(r.id)
      && typeof r.fechaInicioISO === 'string' && !!fechaDesdeISO(r.fechaInicioISO)
      && esNumero(r.capital)
      && esNumero(r.interes1) && esNumero(r.impuesto1)
      && typeof r.fechaFactura1 === 'string';
  }

  function plazoDeRegistro(r) {
    return (r.diasTramo1 || 0) + (r.diasTramo2 || 0) || PLAZO_POR_DEFECTO;
  }

  /** Cronograma de pagos diarios de un contrato (no se guarda; se calcula). */
  function construirDiasPago(r) {
    const dias = [];
    const plazo = plazoDeRegistro(r);
    const capitalDia = r.capital / plazo;
    const fecha = fechaDesdeISO(r.fechaInicioISO);
    for (let i = 1; i <= plazo; i++) {
      dias.push({
        numeroContrato: r.numeroContrato,
        n: i,
        fecha: fechaCorta(fecha),
        sinInteres: capitalDia,
        conInteres: capitalDia + r.interesDiario,
        interes: r.interesDiario,
        acumulado: r.interesDiario * i
      });
      fecha.setDate(fecha.getDate() + 1);
    }
    return dias;
  }

  function interesTotalDe(r) {
    return r.interes1 + (r.interes2 || 0);
  }

  function impuestoTotalDe(r) {
    return r.impuesto1 + (r.impuesto2 || 0);
  }

  /** Orden del tablero: por fecha de inicio y, si empatan, por N° de contrato. */
  function ordenarRegistros(lista) {
    return lista.slice().sort((a, b) =>
      a.fechaInicioISO.localeCompare(b.fechaInicioISO) || (a.numeroContrato - b.numeroContrato));
  }

  function totalesTablero(lista) {
    const t = { monto: 0, interes1: 0, impuesto1: 0, interes2: 0, impuesto2: 0, interes: 0, impuesto: 0 };
    lista.forEach(r => {
      t.monto += r.capital;
      t.interes1 += r.interes1;
      t.impuesto1 += r.impuesto1;
      t.interes2 += r.interes2 || 0;
      t.impuesto2 += r.impuesto2 || 0;
      t.interes += interesTotalDe(r);
      t.impuesto += impuestoTotalDe(r);
    });
    return t;
  }

  /**
   * Interés e impuesto facturados por mes, según la fecha de cada factura.
   * Útil para declarar el impuesto del mes.
   */
  function resumenMensual(lista) {
    const porMes = new Map();
    function sumar(fechaTexto, interes, impuesto) {
      const f = fechaDesdeCorta(fechaTexto);
      if (!f) return;
      const clave = f.getFullYear() + '-' + dos(f.getMonth() + 1);
      if (!porMes.has(clave)) {
        porMes.set(clave, { clave, anio: f.getFullYear(), mes: f.getMonth(), facturas: 0, interes: 0, impuesto: 0 });
      }
      const g = porMes.get(clave);
      g.facturas += 1;
      g.interes += interes;
      g.impuesto += impuesto;
    }
    lista.forEach(r => {
      sumar(r.fechaFactura1, r.interes1, r.impuesto1);
      if (r.fechaFactura2 && r.interes2 != null) sumar(r.fechaFactura2, r.interes2, r.impuesto2 || 0);
    });
    return Array.from(porMes.values()).sort((a, b) => a.clave.localeCompare(b.clave));
  }

  return {
    PLAZO_POR_DEFECTO,
    MESES,
    fechaDesdeISO,
    fechaAISO,
    fechaCorta,
    fechaDesdeCorta,
    fechaLarga,
    nombreMes,
    validarEntrada,
    calcularPrestamo,
    crearRegistro,
    migrarRegistros,
    esRegistroValido,
    plazoDeRegistro,
    construirDiasPago,
    interesTotalDe,
    impuestoTotalDe,
    ordenarRegistros,
    totalesTablero,
    resumenMensual
  };
});
