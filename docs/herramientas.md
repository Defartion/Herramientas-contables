# Herramientas: qué calcula cada una

Todas comparten el mismo formato: datos a la izquierda, resultado en vivo a la
derecha, botón **Restablecer valores**, y los valores ingresados se recuerdan
en el navegador. Los valores legales vienen de `compartido/parametros.js`
(ver [parametros.md](parametros.md)) y se pueden cambiar en pantalla.

Las fórmulas están en `herramientas/<id>/js/calculo.js` (y las laborales en
`compartido/laboral.js`), con sus pruebas en `tests/`.

---

## Préstamos e intereses

### Interés simple
Ver [calculadora-interes-simple.md](calculadora-interes-simple.md).

### Interés compuesto (`interes-compuesto`)
- Valor final = capital × (1 + i)ⁿ + aporte × ((1 + i)ⁿ − 1) ÷ i (× (1 + i) si el aporte es al inicio).
- `i` por periodo: con TEA, (1 + TEA)^(1/m) − 1; con TNA, TNA ÷ m (m = capitalizaciones por año).
- Resumen por año en pantalla; detalle por periodo en el Excel.

### Cronograma de cuotas (`cronograma-cuotas`)
- TEM = (1 + TEA)^(1/12) − 1.
- **Francés:** cuota = monto × TEM ÷ (1 − (1 + TEM)^−n). **Alemán:** capital fijo = monto ÷ n.
- Intereses y capital se redondean a céntimos por cuota; la última cuota cierra el saldo exacto.
- Meses de gracia: solo se pagan intereses. Seguro de desgravamen sobre el saldo y comisión fija opcionales.
- **TCEA:** tasa interna de retorno mensual de (desembolso, cuotas totales), llevada a anual.
- Las cuotas vencen el mismo día del desembolso cada mes (o el último día del mes si no existe).

### Conversor de tasas (`conversor-tasas`)
- Todo se convierte a TEA y de ahí a las demás: efectiva de d días = (1 + TEA)^(d ÷ base) − 1.
- Tasa nominal con capitalización: la tasa del periodo se divide entre los subperiodos de capitalización.
- Base de 360 (habitual en bancos) o 365 días; tasa para un número de días a medida.

### Interés moratorio (`interes-moratorio`)
- Días de atraso: desde el día siguiente al vencimiento hasta la fecha de pago.
- **TIM o tasa mensual:** interés = monto × (tasa mensual ÷ 30) × días, sin capitalizar.
- **Tasa efectiva anual:** monto × ((1 + TEA)^(días ÷ 360) − 1).
- Penalidad opcional: monto fijo o % del monto.

## Impuestos

### Calculadora de IGV (`igv`)
- Agregar: IGV = base × tasa. Quitar: base = total ÷ (1 + tasa), IGV = total − base.
- Muestra la composición IGV + IPM (en 2026, 15,5 % + 2,5 %).
- Tasa especial para MYPE de restaurantes, hoteles y alojamientos (10,5 % en 2026).

### Detracciones, retenciones y percepciones (`detracciones`)
- **Detracción:** importe total × % del servicio (Anexo 3), solo si supera S/ 700; el depósito se redondea al entero. Para bienes (Anexos 1 y 2) se ingresa el porcentaje.
- **Retención del IGV:** 3 % del importe total si el cliente es agente de retención y la operación supera S/ 700.
- **Percepción:** % sobre el precio de venta; el cliente paga precio + percepción.

### Renta de 4.ª categoría (`renta-cuarta`)
- Retención de 8 % si el recibo supera S/ 1 500, el cliente es agente de retención y no hay suspensión.
- Modo inverso: monto del recibo para recibir un neto (si el neto supera S/ 1 500, recibo = neto ÷ 0,92).
- Proyección anual: ingresos − 20 % (tope 24 UIT) − 7 UIT − gastos deducibles (tope 3 UIT) → tramos de 8 % a 30 % → menos retenciones = saldo a pagar o a favor. Indica si se puede pedir la suspensión.
- Solo considera 4.ª categoría; si también hay sueldo en planilla, ambas rentas se suman.

## Estados financieros

### Balance desde Excel (`balance-excel`), **pendiente**
Necesita un Excel de ejemplo del balance de comprobación (ver [hoja-de-ruta.md](hoja-de-ruta.md)).

### Estado de resultados (`estado-resultados`)
- Utilidad bruta → operativa → resultado antes de participaciones e impuestos → neta, con % de ventas.
- Participación de trabajadores según la actividad (D. Leg. 892), solo si hay utilidad.
- Impuesto: Régimen General 29,5 %; MYPE Tributario 10 % hasta 15 UIT y 29,5 % el exceso; u otra tasa.
- El impuesto se estima sobre la utilidad contable (no considera adiciones ni deducciones tributarias).
- Guarda el último cálculo para que **Ratios** pueda usarlo.

### Ratios financieros (`ratios`)
- Liquidez (corriente, ácida, defensiva, capital de trabajo), endeudamiento (del activo, patrimonial,
  cobertura de intereses), rentabilidad (márgenes, ROA, ROE) y gestión (rotación, días de inventario y de cobro).
- Cada ratio trae una lectura referencial (Bien / Atención / Riesgo / Referencia); los rangos adecuados dependen del rubro.

## Planilla y beneficios

Reglas comunes en `compartido/laboral.js`, para régimen general, pequeña y microempresa.

### Sueldo neto (`planilla`)
- Bruto = sueldo + asignación familiar (10 % de la RMV) + otros ingresos regulares.
- AFP: aporte 10 % + prima 1,37 % (con tope de remuneración asegurable) + comisión sobre el sueldo (si es por saldo, no se descuenta). ONP: 13 %.
- Renta de 5.ª (estimada): (bruto × 12 + gratificaciones + bonificación) − 7 UIT → tramos → ÷ 12.
- Costo empresa: EsSalud 9 % (base mínima: RMV) + provisiones mensuales de gratificación, CTS y vacaciones.

### CTS (`cts`)
- Periodos: mayo (noviembre–abril) y noviembre (mayo–octubre); fecha límite el 15 (o el lunes si cae en fin de semana).
- Remuneración computable = sueldo + asignación + variables regulares + 1/6 de la gratificación del semestre (se estima si no se ingresa).
- CTS = computable ÷ 12 × meses + computable ÷ 360 × días; las faltas se descuentan por treintavos.
- Pequeña empresa: la mitad. Microempresa: no corresponde. Con menos de un mes de servicios, los días pasan al siguiente depósito.

### Gratificaciones (`gratificaciones`)
- Gratificación = computable × meses calendario completos del semestre ÷ 6 (pequeña empresa: la mitad; microempresa: no corresponde).
- Bonificación extraordinaria: 9 % (EsSalud) o 6,75 % (EPS). Con fecha de cese, calcula la trunca.

### Liquidación de beneficios (`liquidacion`)
- CTS trunca desde el último 1 de mayo o 1 de noviembre; gratificación trunca (meses completos del semestre) con bonificación.
- Vacaciones truncas desde el último aniversario (dozavos y treintavos; 30 días por año, 15 en MYPE) y vacaciones pendientes ingresadas.
- Indemnización por despido arbitrario: 1,5 remuneraciones por año (tope 12); pequeña empresa 20 remuneraciones diarias por año (tope 120); microempresa 10 (tope 90). No corresponde en periodo de prueba.
- No incluye la indemnización por resolver un contrato a plazo fijo antes de tiempo ni la indemnización vacacional.

## Tesorería y activos

### Tipo de cambio (`tipo-cambio`)
- Dólares → soles con el tipo de compra; soles → dólares con el tipo de venta (o el que se elija).
- El tipo de cambio se ingresa a mano (no se descarga de internet) y se recuerda.

### Flujo de caja (`flujo-caja`)
- Tabla editable de ingresos y egresos por mes (1 a 24 meses), con conceptos propios.
- Flujo neto = ingresos − egresos; saldo final = saldo inicial + flujo neto, acumulado mes a mes.
- Avisa en qué meses la caja queda en negativo. Los datos se guardan en el navegador.

### Conciliación bancaria (`conciliacion-bancaria`), **pendiente**
Necesita un extracto bancario y el libro bancos de ejemplo (ver [hoja-de-ruta.md](hoja-de-ruta.md)).

### Depreciación de activos (`depreciacion`)
- Línea recta: costo × tasa ÷ 12 por mes, desde el mes en que el activo empieza a usarse, hasta llegar al costo.
- Tasas máximas por tipo de activo (art. 22 del Reglamento de la LIR; edificios 5 %); se pueden usar menores.
- Resumen del ejercicio (acumulada al inicio, del año, al cierre y valor neto) y cronograma anual por activo.
