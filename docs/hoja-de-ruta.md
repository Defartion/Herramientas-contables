# Hoja de ruta

Herramientas planificadas. Aparecen en el menú como **Próximamente**; la lista
real está en `SECCIONES` de `script.js` (si cambias una, cambia la otra).

| Sección | Herramienta | Qué hará | Estado |
|---|---|---|---|
| Préstamos e intereses | Interés simple | Interés por mes calendario, facturas, tablero y Excel | ✅ Disponible |
| | Interés compuesto | Valor futuro con capitalización periódica | Planificada |
| | Cronograma de cuotas | Cuotas fijas (francés) o decrecientes (alemán) | Planificada |
| | Conversor de tasas | TEA ↔ TEM ↔ TNA ↔ diaria | Planificada |
| | Interés moratorio | Interés y penalidad por días de atraso | Planificada |
| Impuestos | Calculadora de IGV | Agregar/quitar IGV, base imponible e impuesto | Planificada |
| | Detracciones y retenciones | Detracciones, retenciones y percepciones | Planificada |
| | Renta de 4.ª categoría | Retención en recibos por honorarios | Planificada |
| Estados financieros | Balance desde Excel | Subir Excel de saldos y armar el balance | Planificada |
| | Estado de resultados | Ingresos, costos, gastos y utilidad | Planificada |
| | Ratios financieros | Liquidez, endeudamiento, rentabilidad | Planificada |
| Planilla y beneficios | Sueldo neto | AFP/ONP, renta de 5.ª, EsSalud | Planificada |
| | CTS | Depósitos de mayo y noviembre | Planificada |
| | Gratificaciones | Julio y diciembre con bonificación | Planificada |
| | Liquidación de beneficios | Beneficios al terminar el vínculo laboral | Planificada |
| Tesorería y activos | Tipo de cambio | Soles ↔ dólares con el tipo de cambio indicado | Planificada |
| | Flujo de caja | Proyección mensual de ingresos y egresos | Planificada |
| | Conciliación bancaria | Extracto del banco vs. registros | Planificada |
| | Depreciación de activos | Línea recta por activo | Planificada |

> Las tasas y topes legales (IGV, AFP, UIT, porcentajes de detracción, etc.)
> cambian con el tiempo. Cada herramienta debe permitir editarlos y mostrar la
> fecha o fuente del valor por defecto.

## Balance desde Excel — notas

Es viable sin servidor: el navegador lee el archivo con SheetJS (la misma
librería de la exportación) y el Excel nunca sale de la computadora.

Para diseñarla se necesita un Excel de ejemplo real (con datos ficticios o
tapados) para saber:

1. **Qué archivo es:** balance de comprobación, libro mayor, libro diario o la
   exportación de un sistema contable / PLE de SUNAT.
2. **Columnas:** cuenta, descripción, debe, haber, saldo deudor/acreedor.
3. **Plan de cuentas:** si sigue el PCGE (dígito inicial 1–5 balance,
   6–9 resultados), que permite clasificar automáticamente.
4. **Resultado esperado:** estado de situación financiera, estado de
   resultados, o ambos; un periodo o comparativo.

Flujo propuesto: subir archivo → elegir hoja y confirmar qué columna es cuál
(se recuerda para la próxima) → validar que debe = haber → clasificar por
PCGE → mostrar el balance y descargarlo en Excel.
