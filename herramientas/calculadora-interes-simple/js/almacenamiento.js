/*
 * Guardado de datos en el navegador (localStorage).
 *
 * ¡No cambies los nombres de las claves! Ahí están los contratos que ya se
 * usan en el trabajo diario. Si cambian, el tablero aparecerá vacío.
 */
(function (raiz) {
  'use strict';
  const C = raiz.Calculo;

  const CLAVES = {
    tablero: 'interesSimpleTableroLedger',
    contador: 'interesSimpleContratoContador',
    preferencias: 'interesSimplePreferencias'
  };

  let ultimoError = null;

  function disponible() {
    try {
      const k = '__prueba__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function escribir(clave, valor) {
    try {
      localStorage.setItem(clave, valor);
      return true;
    } catch (e) {
      ultimoError = e;
      console.warn('No se pudo guardar ' + clave + ':', e);
      return false;
    }
  }

  // ---------- Contador de contratos ----------

  function leerContador() {
    try {
      const n = parseInt(localStorage.getItem(CLAVES.contador), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function guardarContador(n) {
    return escribir(CLAVES.contador, String(n));
  }

  /** Reserva y devuelve el siguiente número correlativo. */
  function siguienteNumeroContrato() {
    const n = leerContador() + 1;
    guardarContador(n);
    return n;
  }

  /** Si se usó un número mayor al contador, el correlativo sigue desde él. */
  function avanzarContadorHasta(n) {
    if (n > leerContador()) guardarContador(n);
  }

  // ---------- Registros del tablero ----------

  /**
   * Lee los contratos (y migra los de versiones antiguas).
   * Si los datos guardados están dañados, se copian a una clave aparte antes
   * de hacer cualquier otra cosa, para no perderlos.
   */
  function leerRegistros() {
    let raw = null;
    try {
      raw = localStorage.getItem(CLAVES.tablero);
    } catch (e) {
      return [];
    }
    if (!raw) return [];

    let lista;
    try {
      lista = JSON.parse(raw);
      if (!Array.isArray(lista)) throw new Error('El tablero guardado no es una lista.');
    } catch (e) {
      const claveCopia = CLAVES.tablero + '_danado_' + Date.now();
      escribir(claveCopia, raw);
      escribir(CLAVES.tablero, '[]');
      ultimoError = new Error('Los datos del tablero estaban dañados. Se guardó una copia en "' + claveCopia + '".');
      console.error(ultimoError.message, e);
      return [];
    }

    const { lista: migrada, contador, cambio } = C.migrarRegistros(lista, leerContador());
    if (cambio) {
      guardarContador(contador);
      guardarRegistros(migrada);
    }
    return migrada;
  }

  function guardarRegistros(lista) {
    return escribir(CLAVES.tablero, JSON.stringify(lista));
  }

  function agregar(registro) {
    const lista = leerRegistros();
    lista.push(registro);
    return guardarRegistros(lista);
  }

  /** Quita un contrato y lo devuelve (para poder deshacer). */
  function eliminar(id) {
    const lista = leerRegistros();
    const idx = lista.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const [quitado] = lista.splice(idx, 1);
    guardarRegistros(lista);
    return quitado;
  }

  /** Vuelve a poner contratos quitados (deshacer). Ignora los que ya estén. */
  function restaurar(registros) {
    const lista = leerRegistros();
    const ids = new Set(lista.map(r => r.id));
    registros.forEach(r => { if (!ids.has(r.id)) lista.push(r); });
    return guardarRegistros(lista);
  }

  /** Vacía el tablero y devuelve lo que había (para poder deshacer). */
  function vaciar() {
    const anterior = leerRegistros();
    guardarRegistros([]);
    return anterior;
  }

  function numeroEnUso(numero) {
    return leerRegistros().some(r => r.numeroContrato === numero);
  }

  // ---------- Preferencias (últimos valores usados) ----------

  function leerPreferencias() {
    try {
      const p = JSON.parse(localStorage.getItem(CLAVES.preferencias) || '{}');
      return (p && typeof p === 'object') ? p : {};
    } catch (e) {
      return {};
    }
  }

  function guardarPreferencias(p) {
    return escribir(CLAVES.preferencias, JSON.stringify(p));
  }

  // ---------- Respaldo (archivo .json) ----------

  function crearRespaldo() {
    return {
      aplicacion: 'herramientas-contables',
      herramienta: 'interes-simple',
      version: 2,
      exportadoEn: new Date().toISOString(),
      contador: leerContador(),
      registros: leerRegistros()
    };
  }

  /**
   * Une un respaldo con el tablero actual, sin borrar nada:
   * - agrega los contratos que no estén (según su id),
   * - omite los que ya están,
   * - omite los que choquen con un N° de contrato ya usado por otro contrato.
   */
  function importarRespaldo(datos) {
    const entrantes = Array.isArray(datos) ? datos : (datos && Array.isArray(datos.registros) ? datos.registros : null);
    if (!entrantes) throw new Error('El archivo no es un respaldo de esta herramienta.');

    const { lista: migrados, contador: contadorEntrante } = C.migrarRegistros(
      entrantes.filter(C.esRegistroValido), 0);
    const invalidos = entrantes.length - migrados.length;

    const lista = leerRegistros();
    const ids = new Set(lista.map(r => r.id));
    const numeros = new Set(lista.map(r => r.numeroContrato));
    let agregados = 0, repetidos = 0, conflictos = 0;

    migrados.forEach(r => {
      if (ids.has(r.id)) { repetidos++; return; }
      if (numeros.has(r.numeroContrato)) { conflictos++; return; }
      lista.push(r);
      ids.add(r.id);
      numeros.add(r.numeroContrato);
      agregados++;
    });

    if (agregados) {
      if (!guardarRegistros(lista)) throw new Error('No se pudo guardar en el navegador.');
      const contadorRespaldo = (datos && Number.isInteger(datos.contador)) ? datos.contador : 0;
      avanzarContadorHasta(Math.max(contadorEntrante, contadorRespaldo));
    }
    return { agregados, repetidos, conflictos, invalidos };
  }

  function tomarUltimoError() {
    const e = ultimoError;
    ultimoError = null;
    return e;
  }

  raiz.Almacen = {
    CLAVES,
    disponible,
    leerContador,
    siguienteNumeroContrato,
    avanzarContadorHasta,
    leerRegistros,
    agregar,
    eliminar,
    restaurar,
    vaciar,
    numeroEnUso,
    leerPreferencias,
    guardarPreferencias,
    crearRespaldo,
    importarRespaldo,
    tomarUltimoError
  };
})(self);
