(function () {
  'use strict';
  const C = window.ConversorTasas;
  const $ = HC.$;
  const PERIODOS = [['anual', 'Anual'], ['semestral', 'Semestral'], ['trimestral', 'Trimestral'],
    ['bimestral', 'Bimestral'], ['mensual', 'Mensual'], ['quincenal', 'Quincenal'], ['diaria', 'Diaria']];

  const f = HC.formulario('form', [
    { grupo: [
      { id: 'valor', etiqueta: 'Tasa', tipo: 'pct', valor: 12 },
      { id: 'tipo', etiqueta: 'Tipo', tipo: 'select', valor: 'efectiva', opciones: [['efectiva', 'Efectiva'], ['nominal', 'Nominal']] }
    ] },
    { id: 'periodo', etiqueta: 'Periodo de la tasa', tipo: 'select', valor: 'anual', opciones: PERIODOS },
    { id: 'capitalizacion', etiqueta: 'Capitalización', tipo: 'select', valor: 'mensual', opciones: PERIODOS,
      si: v => v.tipo === 'nominal', ayuda: 'Cada cuánto se suman los intereses (por ejemplo, TNA con capitalización mensual).' },
    { id: 'base', etiqueta: 'Año base', tipo: 'segmento', valor: '360', opciones: [['360', '360 días'], ['365', '365 días']],
      ayuda: 'En Perú los bancos suelen usar 360 días.' },
    { id: 'diasPersonalizado', etiqueta: 'Tasa para un número de días (opcional)', tipo: 'entero', valor: '', min: 1,
      placeholder: 'Ej. 45' }
  ], { clave: 'conversor-tasas' });

  f.alCambiar(v => {
    if (!f.errores(C.validar(v))) {
      $('resultado').innerHTML = HC.vacio('Ingresa una tasa para ver sus equivalencias.', 'fa-percent');
      return;
    }
    const r = C.calcular(v);
    const filas = [
      ...r.efectivas.map(x => ({ nombre: x.nombre, tasa: x.tasa })),
      ...(r.personalizada ? [{ nombre: `Efectiva para ${r.personalizada.dias} días`, tasa: r.personalizada.tasa }] : []),
      ...r.nominales.map(x => ({ nombre: x.nombre, tasa: x.tasa }))
    ];
    const mensual = r.efectivas.find(x => x.periodo === 'mensual');
    const diaria = r.efectivas.find(x => x.periodo === 'diaria');
    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'TEA', valor: HC.pct(r.teaPct, 4), acento: true },
        { etiqueta: 'TEM', valor: HC.pct(mensual.tasa, 4) },
        { etiqueta: 'TED', valor: HC.pct(diaria.tasa, 6), nota: `Base ${r.base} días` }
      ]) +
      HC.tabla({
        columnas: [{ titulo: 'Tasa equivalente', campo: 'nombre' }, { titulo: 'Valor', campo: 'tasa', tipo: 'pct4' }],
        filas
      }) +
      HC.nota('Las tasas efectivas se convierten con (1 + TEA)^(días ÷ base) − 1; las nominales multiplican la tasa efectiva del periodo de capitalización por el número de periodos del año.');
  });
})();
