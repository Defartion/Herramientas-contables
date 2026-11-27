/*
 * Valores legales y tasas vigentes (Perú). Se usan como valores por defecto
 * en las herramientas; el usuario siempre puede cambiarlos en pantalla.
 *
 * Cuando cambie una norma (por ejemplo, la UIT de cada año), actualiza el
 * valor AQUÍ, su fuente y la fecha `actualizado`. Lista de revisión anual en
 * docs/parametros.md.
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Parametros = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    actualizado: '26/11/2026',

    uit: { valor: 5500, fuente: 'D.S. 301-2025-EF (UIT 2026)' },
    rmv: { valor: 1230, fuente: 'D.S. 015-2026-TR (desde el 01/10/2026)' },
    asignacionFamiliarPct: 10,

    igv: {
      general: { total: 18, igv: 15.5, ipm: 2.5 },
      restaurantesMype: { total: 10.5, igv: 8, ipm: 2.5 },
      fuente: 'Ley 32387 (IPM 2,5 % en 2026) y Ley 32219 (tasa especial para MYPE de restaurantes, hoteles y alojamientos)'
    },

    retencionIgv: { tasa: 3, montoMinimo: 700, fuente: 'Régimen de retenciones del IGV (R.S. 037-2002/SUNAT)' },

    detracciones: {
      montoMinimo: 700,
      fuente: 'Anexo 3 de la R.S. 183-2004/SUNAT y modificatorias',
      servicios: [
        { id: 'intermediacion', nombre: 'Intermediación laboral y tercerización', tasa: 12 },
        { id: 'arrendamiento', nombre: 'Arrendamiento de bienes', tasa: 10 },
        { id: 'mantenimiento', nombre: 'Mantenimiento y reparación de bienes muebles', tasa: 12 },
        { id: 'carga', nombre: 'Movimiento de carga', tasa: 10 },
        { id: 'empresariales', nombre: 'Otros servicios empresariales (contables, legales, asesoría, publicidad…)', tasa: 12 },
        { id: 'comision', nombre: 'Comisión mercantil', tasa: 10 },
        { id: 'fabricacion', nombre: 'Fabricación de bienes por encargo', tasa: 10 },
        { id: 'transporte-personas', nombre: 'Transporte de personas', tasa: 10 },
        { id: 'transporte-bienes', nombre: 'Transporte de bienes por vía terrestre', tasa: 4 },
        { id: 'construccion', nombre: 'Contratos de construcción', tasa: 4 },
        { id: 'demas', nombre: 'Demás servicios gravados con el IGV', tasa: 12 }
      ]
    },

    percepciones: {
      fuente: 'Ley 29173 y R.S. 058-2006/SUNAT',
      tipos: [
        { id: 'general', nombre: 'Venta interna: tasa general', tasa: 2 },
        { id: 'agente', nombre: 'Venta interna: cliente agente de percepción, con comprobante que da crédito fiscal', tasa: 0.5 },
        { id: 'combustible', nombre: 'Venta de combustibles', tasa: 1 }
      ]
    },

    rentaCuarta: {
      tasaRetencion: 8,
      montoMinimoRecibo: 1500,
      limiteSuspension: 48125,
      limiteSuspensionDirectores: 38500,
      deduccionPct: 20,
      deduccionTopeUIT: 24,
      fuente: 'R.S. 000390-2025/SUNAT (límites 2026) y art. 45 de la Ley del Impuesto a la Renta'
    },

    rentaTrabajo: {
      deduccionUIT: 7,
      deduccionAdicionalUIT: 3,
      tramosUIT: [
        { hasta: 5, tasa: 8 },
        { hasta: 20, tasa: 14 },
        { hasta: 35, tasa: 17 },
        { hasta: 45, tasa: 20 },
        { hasta: Infinity, tasa: 30 }
      ],
      fuente: 'Arts. 46 y 53 de la Ley del Impuesto a la Renta'
    },

    rentaEmpresas: {
      general: 29.5,
      mype: { limiteUIT: 15, tasaHastaLimite: 10, tasaExceso: 29.5 },
      fuente: 'SUNAT: tasas del Régimen General y del Régimen MYPE Tributario'
    },

    pensiones: {
      onp: 13,
      afp: {
        aporte: 10,
        prima: 1.37,
        rma: 12732.70,
        rmaPeriodo: 'devengue de octubre de 2026',
        entidades: [
          { id: 'habitat', nombre: 'AFP Habitat', comisionFlujo: 1.47 },
          { id: 'integra', nombre: 'AFP Integra', comisionFlujo: 1.55 },
          { id: 'prima', nombre: 'Prima AFP', comisionFlujo: 1.60 },
          { id: 'profuturo', nombre: 'Profuturo AFP', comisionFlujo: 1.69 }
        ]
      },
      fuente: 'SBS: comisiones y primas del SPP (2026)'
    },

    essalud: 9,
    bonificacionExtraordinaria: { essalud: 9, eps: 6.75, fuente: 'Ley 30334' },

    participacionUtilidades: {
      fuente: 'D. Leg. 892 (empresas con más de 20 trabajadores)',
      tipos: [
        { id: 'no-aplica', nombre: 'No aplica (20 trabajadores o menos)', pct: 0 },
        { id: 'pesquera', nombre: 'Empresa pesquera', pct: 10 },
        { id: 'telecom', nombre: 'Telecomunicaciones', pct: 10 },
        { id: 'industrial', nombre: 'Empresa industrial', pct: 10 },
        { id: 'minera', nombre: 'Empresa minera', pct: 8 },
        { id: 'comercio', nombre: 'Comercio al por mayor y menor; restaurantes', pct: 8 },
        { id: 'otras', nombre: 'Otras actividades', pct: 5 }
      ]
    },

    tim: { mensualMN: 0.9, mensualME: 0.5, fuente: 'R.S. 044-2021/SUNAT (vigente desde el 01/04/2021)' },

    depreciacion: {
      fuente: 'Art. 22 del Reglamento de la Ley del Impuesto a la Renta y art. 39 de la Ley (edificios)',
      tipos: [
        { id: 'edificios', nombre: 'Edificios y construcciones', tasa: 5 },
        { id: 'computo', nombre: 'Equipos de procesamiento de datos', tasa: 25 },
        { id: 'vehiculos', nombre: 'Vehículos de transporte terrestre (excepto ferrocarriles); hornos', tasa: 20 },
        { id: 'maq-especial', nombre: 'Maquinaria y equipo de minería, petróleo y construcción', tasa: 20 },
        { id: 'ganado', nombre: 'Ganado de trabajo y reproducción; redes de pesca', tasa: 25 },
        { id: 'maquinaria', nombre: 'Maquinaria y equipo (adquiridos desde 1991)', tasa: 10 },
        { id: 'otros', nombre: 'Otros bienes del activo fijo (muebles, enseres, etc.)', tasa: 10 }
      ]
    },

    laboral: {
      fuente: 'D. Leg. 650 (CTS), Ley 27735 (gratificaciones), D. Leg. 713 (vacaciones), TUO del D. Leg. 728 y TUO de la Ley MYPE (D.S. 013-2013-PRODUCE)',
      regimenes: [
        { id: 'general', nombre: 'Régimen general', vacacionesDias: 30, factorCts: 1, factorGrati: 1,
          indemnizacion: { tipo: 'remuneraciones', porAnio: 1.5, tope: 12 } },
        { id: 'pequena', nombre: 'Pequeña empresa (REMYPE)', vacacionesDias: 15, factorCts: 0.5, factorGrati: 0.5,
          indemnizacion: { tipo: 'dias', porAnio: 20, tope: 120 } },
        { id: 'micro', nombre: 'Microempresa (REMYPE)', vacacionesDias: 15, factorCts: 0, factorGrati: 0,
          indemnizacion: { tipo: 'dias', porAnio: 10, tope: 90 } }
      ]
    }
  };
});
