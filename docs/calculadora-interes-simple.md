# Calculadora de Interés Simple

Ubicación: `herramientas/calculadora-interes-simple/`

Calcula el interés de un préstamo a plazo en días, lo reparte por **mes
calendario** (para facturar por mes), guarda cada préstamo en un tablero de
contratos, resume el interés facturado por mes y exporta todo a Excel.

## Uso

1. Completa los datos del préstamo. El **resumen se actualiza mientras
   escribes**; todavía no se guarda nada.
2. Presiona **Guardar contrato en el tablero** (o Enter). El contrato se agrega
   al tablero, el N° de contrato avanza al siguiente y el monto se limpia para
   el próximo préstamo. La fecha, tasa, plazo e impuesto se mantienen, y la
   tasa, el plazo y el impuesto se recuerdan para la próxima vez.
3. En el tablero puedes buscar por N° de contrato, ver los días de pago de
   cada uno, eliminar (con opción de **Deshacer**), exportar a Excel e
   imprimir.
4. En **Respaldo** puedes descargar un archivo `.json` con todos los contratos
   y restaurarlo después, incluso en otro navegador o computadora.

En el celular el tablero se muestra como tarjetas; en pantallas grandes, como
tabla.

## Datos de entrada

| Campo | Por defecto | Notas |
|---|---|---|
| N° de contrato | siguiente correlativo | Editable. Entero > 0, no repetido en el tablero. |
| Monto prestado | — | En soles (S/), mayor a cero. |
| Fecha de inicio | hoy | El primer día del préstamo ya cuenta interés. |
| Tasa total (%) | 10 (o la última usada) | Tasa por **todo el plazo**, no mensual ni anual. |
| Plazo (días) | 24 (o el último usado) | Entero entre 1 y 3660. |
| Impuesto (%) | 5 (o el último usado) | Entre 0 y 100, se aplica sobre el interés. |

Los errores se muestran debajo de cada campo (ya no hay ventanas de alerta).

## Reglas de cálculo

```
tasa diaria     = tasa total ÷ plazo
interés diario  = monto × tasa diaria
interés de mes  = interés diario × días del préstamo en ese mes
impuesto        = interés × % impuesto
interés neto    = interés − impuesto
total a pagar   = monto + interés total
```

- Se cuentan los días desde la fecha de inicio (incluida) hasta completar el
  plazo. El último día contado es el "último día con interés".
- Los días se agrupan por mes calendario.
- Los montos se guardan sin redondear; se redondean a 2 decimales solo al
  mostrarlos y en el Excel.

### Facturas

- **Factura 1:** cubre los días del **primer mes**. Fecha = último día con
  interés dentro de ese mes.
- **Factura 2:** solo si el préstamo cruza de mes. Cubre **todos los días
  restantes** (aunque sean de más de un mes). Fecha = último día con interés del
  préstamo.

### Cronograma de pagos diarios ("Ver")

Para cada día del plazo:

```
sin interés        = monto ÷ plazo
con interés        = sin interés + interés diario
interés acumulado  = interés diario × número de día
```

Se calcula al momento a partir del registro guardado; no se almacena.

### Interés facturado por mes

Suma el interés e impuesto de cada factura en el mes de **su fecha de
factura**. Un préstamo que cruza de mes aporta su factura 1 a un mes y su
factura 2 al siguiente. Sirve para saber cuánto impuesto declarar cada mes.

## Ejemplo de verificación

Monto S/ 1 000, tasa 10 %, plazo 24 días, impuesto 5 %, inicio **20/11/2026**.

| Concepto | Valor |
|---|---|
| Tasa diaria | 0,4167 % |
| Interés diario | S/ 4,17 |
| Días en noviembre (20–30) | 11 |
| Días en diciembre (1–13) | 13 |
| Factura 1 (30/11/2026): interés / impuesto | S/ 45,83 / S/ 2,29 |
| Factura 2 (13/12/2026): interés / impuesto | S/ 54,17 / S/ 2,71 |
| Interés total / impuesto total | S/ 100,00 / S/ 5,00 |
| Total a pagar | S/ 1 100,00 |
| Pago diario sin / con interés | S/ 41,67 / S/ 45,83 |

Este caso está en las pruebas automáticas (`npm test`).

## Registro guardado en el tablero

Cada contrato es un objeto dentro de `localStorage['interesSimpleTableroLedger']`:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | número | Identificador interno (marca de tiempo + aleatorio). |
| `numeroContrato` | número | N° de contrato. |
| `fechaInicioISO` | texto `AAAA-MM-DD` | Fecha de inicio. |
| `capital` | número | Monto prestado. |
| `interesDiario` | número | Monto × tasa diaria. |
| `diasTramo1` | número | Días del primer mes. |
| `fechaFactura1` | texto `DD/MM/AAAA` | Fecha de la factura 1. |
| `interes1`, `impuesto1` | número | Interés e impuesto de la factura 1. |
| `diasTramo2` | número | Días restantes (0 si no cruza de mes). |
| `fechaFactura2` | texto o `null` | Fecha de la factura 2. |
| `interes2`, `impuesto2` | número o `null` | Interés e impuesto de la factura 2. |
| `tasaPct`, `plazoDias`, `impuestoPct` | número | *(desde v2)* Datos con que se calculó. |
| `creadoEn` | texto ISO | *(desde v2)* Fecha y hora en que se guardó. |

Los contratos guardados antes de la v2 no tienen los últimos cuatro campos y
siguen funcionando igual: el plazo se deduce como `diasTramo1 + diasTramo2`.

### Migraciones

`Calculo.migrarRegistros()` completa los registros antiguos al leerlos (y
`Almacen.leerRegistros()` los vuelve a guardar):

1. Sin `numeroContrato` → se le asigna el siguiente correlativo.
2. Sin `interesDiario` → interés total ÷ plazo (24 si no se conoce).
3. Sin `diasTramo1` / `diasTramo2` → interés del tramo ÷ interés diario.

Si en el futuro se agrega un campo obligatorio, se debe añadir aquí una
migración y su prueba.

## N° de contrato correlativo

- `interesSimpleContratoContador` guarda el último número usado.
- Si el campo se deja vacío, se usa el siguiente correlativo.
- Si se escribe un número mayor al contador, el contador salta a ese número.
- No se permiten números repetidos en el tablero (se avisa mientras escribes).

## Respaldo

**Respaldo → Descargar respaldo** genera `respaldo-interes-simple-AAAA-MM-DD.json`:

```json
{
  "aplicacion": "herramientas-contables",
  "herramienta": "interes-simple",
  "version": 2,
  "exportadoEn": "2026-11-26T23:00:00.000Z",
  "contador": 42,
  "registros": [ { "...": "contratos como en la tabla de arriba" } ]
}
```

**Restaurar desde un respaldo** une el archivo con el tablero actual sin borrar
nada: agrega los contratos que falten, omite los que ya están (mismo `id`) y
los que tengan un N° de contrato ya usado por otro contrato, y avisa cuántos
hubo de cada tipo. También acepta un archivo que sea solo la lista de
contratos.

## Exportación a Excel

**Exportar a Excel** → `tablero-interes-simple-AAAA-MM-DD.xlsx`. Si hay una
búsqueda activa, exporta solo los contratos filtrados.

- Hoja **Tablero**: resumen (una fila por contrato y fila de totales) y, debajo,
  "Días de pago por contrato" con el cronograma diario de cada contrato. Mismo
  orden de columnas que antes.
- Hoja **Resumen mensual**: interés e impuesto facturados por mes.

Los montos van como números con 2 decimales y formato `#,##0.00`, y las fechas
como fechas reales de Excel (`dd/mm/yyyy`), así se pueden sumar, ordenar y
filtrar.

## Limitaciones conocidas

- Si el préstamo abarca tres meses o más, la factura 2 agrupa todos los meses
  siguientes (así funcionó siempre; se indica en el resumen).
- Los contratos no se pueden editar; se elimina y se vuelve a guardar con el
  mismo N°.
- Datos solo en el navegador: usa el respaldo (ver
  [arquitectura](arquitectura.md#almacenamiento)).
