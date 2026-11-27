# Hoja de ruta

La lista real de herramientas está en `SECCIONES` de `script.js`. Las que no
tienen `ruta` aparecen en el menú como **Próximamente**, con el motivo
(`pendiente`).

## Estado

| Sección | Herramienta | Estado |
|---|---|---|
| Préstamos e intereses | Interés simple, interés compuesto, cronograma de cuotas, conversor de tasas, interés moratorio | ✅ Disponibles |
| Impuestos | IGV, detracciones/retenciones/percepciones, renta de 4.ª | ✅ Disponibles |
| Estados financieros | Estado de resultados, ratios | ✅ Disponibles |
| | **Balance desde Excel** | ⏳ Pendiente: falta un archivo de ejemplo |
| Planilla y beneficios | Sueldo neto, CTS, gratificaciones, liquidación | ✅ Disponibles |
| Tesorería y activos | Tipo de cambio, flujo de caja, depreciación | ✅ Disponibles |
| | **Conciliación bancaria** | ⏳ Pendiente: faltan archivos de ejemplo |

## Pendientes que necesitan algo externo

### Balance desde Excel

Es viable sin servidor: el navegador lee el archivo con SheetJS (la misma
librería de la exportación) y el Excel nunca sale de la computadora.

**Se necesita:** un Excel de ejemplo real (con datos ficticios o tapados) para saber:

1. **Qué archivo es:** balance de comprobación, libro mayor, libro diario o la
   exportación de un sistema contable / PLE de SUNAT.
2. **Columnas:** cuenta, descripción, debe, haber, saldo deudor/acreedor.
3. **Plan de cuentas:** si sigue el PCGE (dígito inicial 1–5 balance,
   6–9 resultados), que permite clasificar automáticamente.
4. **Resultado esperado:** estado de situación financiera, estado de
   resultados, o ambos; un periodo o comparativo.

Flujo propuesto: subir archivo → elegir hoja y confirmar qué columna es cuál
(se recuerda para la próxima) → validar que debe = haber → clasificar por
PCGE → mostrar el balance y descargarlo en Excel → enviar los totales a
**Ratios** y **Estado de resultados**.

### Conciliación bancaria

**Se necesita:** un extracto bancario exportado del banco (Excel o CSV) y el
libro bancos del sistema contable para el mismo mes, con datos ficticios o
tapados, para conocer columnas, formato de fechas y montos, y cómo se
registran los cargos y abonos.

Flujo propuesto: subir ambos archivos → indicar columnas (fecha, referencia,
cargo, abono) → emparejar movimientos por importe, referencia y fecha
cercana → listar depósitos en tránsito, cheques pendientes y cargos del banco
no registrados → armar la conciliación (saldo según banco = saldo según
libros ajustado) y exportarla.

## Ideas para después

- Traer el tipo de cambio del día automáticamente (requiere un servicio externo).
- Gráficos en el flujo de caja y en el interés compuesto.
- Reutilizar la calculadora de interés simple con la librería compartida
  (hoy tiene estilos y código propios; se dejó igual para no afectar los datos en uso).
