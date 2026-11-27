(function () {
  'use strict';
  const C = window.CalcCTS;
  const P = window.Parametros;
  const U = window.Util;
  const $ = HC.$;

  // Depósito por defecto: el próximo (hasta el 15 de mayo → mayo; hasta el 15 de noviembre → noviembre).
  const hoy = U.hoy();
  const m = hoy.getMonth();
  const d = hoy.getDate();
  const proximoMayo = m < 4 || (m === 4 && d <= 15);
  const proximoNov = !proximoMayo && (m < 10 || (m === 10 && d <= 15));
  const depositoDefecto = proximoMayo ? 'mayo' : proximoNov ? 'noviembre' : 'mayo';
  const anioDefecto = proximoMayo || proximoNov ? hoy.getFullYear() : hoy.getFullYear() + 1;

  const f = HC.formulario('form', [
    { grupo: [
      { id: 'deposito', etiqueta: 'Depósito', tipo: 'select', valor: depositoDefecto,
        opciones: [['mayo', 'Mayo (periodo nov–abr)'], ['noviembre', 'Noviembre (periodo may–oct)']] },
      { id: 'anio', etiqueta: 'Año del depósito', tipo: 'entero', valor: anioDefecto }
    ] },
    { id: 'fechaIngreso', etiqueta: 'Fecha de ingreso del trabajador', tipo: 'fecha', valor: '2020-01-02' },
    { id: 'regimen', etiqueta: 'Régimen laboral', tipo: 'select', valor: 'general', opciones: P.laboral.regimenes.map(r => [r.id, r.nombre]) },
    { seccion: 'Remuneración' },
    { id: 'sueldo', etiqueta: 'Sueldo básico mensual', tipo: 'dinero', valor: 3000, min: 0 },
    { id: 'asignacion', etiqueta: `Recibe asignación familiar (${P.asignacionFamiliarPct} % de la RMV)`, tipo: 'check', valor: false },
    { id: 'variables', etiqueta: 'Promedio de pagos variables regulares', tipo: 'dinero', valor: '',
      ayuda: 'Horas extra o comisiones recibidas en al menos 3 de los 6 meses del periodo.' },
    { id: 'gratificacion', etiqueta: 'Gratificación recibida en el semestre (opcional)', tipo: 'dinero', valor: '',
      ayuda: 'Si la dejas vacía, se estima con la gratificación que le correspondía.' },
    { id: 'faltas', etiqueta: 'Días de faltas injustificadas en el periodo', tipo: 'entero', valor: '', min: 0 },
    { seccion: 'Valores vigentes' },
    { id: 'rmv', etiqueta: 'Remuneración mínima', tipo: 'dinero', valor: P.rmv.valor, parametro: true, ayuda: P.rmv.fuente }
  ], { clave: 'cts' });

  f.alCambiar(v => {
    const errs = C.validar(v);
    if (!(v.rmv > 0)) errs.rmv = 'Ingresa la RMV.';
    if (!f.errores(errs)) {
      $('resultado').innerHTML = HC.vacio('Completa los datos para calcular la CTS.', 'fa-piggy-bank');
      return;
    }
    const regimen = P.laboral.regimenes.find(r => r.id === v.regimen);
    const r = C.calcular(v, { rmv: v.rmv, asignacionPct: P.asignacionFamiliarPct, factorCts: regimen.factorCts, factorGrati: regimen.factorGrati });
    const nombreGrati = `gratificación de ${r.periodoGrati.tipo} ${r.periodoGrati.inicio.getFullYear()}`;

    if (regimen.factorCts === 0) {
      $('resultado').innerHTML = HC.nota('Los trabajadores de la microempresa inscrita en el REMYPE no tienen derecho a CTS.', 'warn') +
        HC.fuente('Fuente: ' + P.laboral.fuente + '.');
      return;
    }
    if (r.motivo) {
      $('resultado').innerHTML = HC.nota(r.motivo === 'posterior'
        ? 'El trabajador ingresó después de este periodo: no le corresponde este depósito.'
        : 'El trabajador tiene menos de un mes de servicios al cierre del periodo: los días se suman al siguiente depósito.', 'warn');
      return;
    }

    $('resultado').innerHTML =
      HC.stats([
        { etiqueta: 'CTS a depositar', valor: HC.dinero(r.monto), acento: true },
        { etiqueta: 'Tiempo computable', valor: `${r.tiempo.meses} meses ${r.tiempo.dias} días`, nota: `Desde el ${HC.fecha(r.desde)}` },
        { etiqueta: 'Fecha límite', valor: HC.fecha(r.limite) }
      ]) +
      HC.lineas([
        { etiqueta: 'Sueldo básico', valor: HC.dinero(v.sueldo) },
        r.asignacion > 0 ? { etiqueta: 'Asignación familiar', valor: HC.dinero(r.asignacion) } : null,
        r.variables > 0 ? { etiqueta: 'Promedio de variables', valor: HC.dinero(r.variables) } : null,
        { etiqueta: '1/6 de la gratificación', valor: HC.dinero(r.gratificacion / 6),
          detalle: `${r.usaEstimada ? 'Estimada: ' : ''}${nombreGrati} de ${HC.dinero(r.gratificacion)}` },
        { etiqueta: 'Remuneración computable', valor: HC.dinero(r.computable), clase: 'fuerte' },
        { etiqueta: 'Por meses', valor: HC.dinero(r.computable * regimen.factorCts / 12 * r.tiempo.meses),
          detalle: `${HC.dinero(r.computable)}${regimen.factorCts !== 1 ? ' × ' + regimen.factorCts : ''} ÷ 12 × ${r.tiempo.meses}`, clase: 'sub' },
        { etiqueta: 'Por días', valor: HC.dinero(r.computable * regimen.factorCts / 360 * r.tiempo.dias),
          detalle: `${HC.dinero(r.computable)}${regimen.factorCts !== 1 ? ' × ' + regimen.factorCts : ''} ÷ 360 × ${r.tiempo.dias}`, clase: 'sub' },
        { etiqueta: 'CTS a depositar', valor: HC.dinero(r.monto), clase: 'big' }
      ]) +
      (regimen.factorCts !== 1 ? HC.nota('En la pequeña empresa la CTS es de 15 remuneraciones diarias por año (la mitad del régimen general), con un tope de 90 remuneraciones diarias.') : '') +
      HC.nota('Si el día 15 cae sábado o domingo, el plazo pasa al siguiente día hábil (esta herramienta no considera feriados).') +
      HC.fuente('Fuente: ' + P.laboral.fuente + '.');
  });
})();
