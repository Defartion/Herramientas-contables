# Calculadora de Interés Simple

Ubicación: `herramientas/calculadora-interes-simple/`

Calcula el interés de un préstamo a plazo en días, lo reparte por **mes
calendario** (para facturar por mes), guarda cada préstamo en un tablero
acumulado y permite exportarlo a Excel.

## Datos de entrada

| Campo | Por defecto | Notas |
|---|---|---|
| N° de contrato | siguiente correlativo | Editable. Debe ser entero > 0 y no repetirse en el tablero. |
| Monto prestado | — | En soles (S/). |
| Fecha de inicio | hoy | El primer día del préstamo ya cuenta interés. |
| Tasa total (%) | 10 | Tasa por **todo el plazo**, no mensual ni anual. |
| Plazo (días) | 24 | |
| Impuesto sobre el interés (%) | 5 | Se aplica sobre el interés. |

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

Usa este caso para comprobar que un cambio no altera los resultados.

## Registro guardado en el tablero

Cada cálculo agrega un objeto a `localStorage['interesSimpleTableroLedger']`:

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

> No se guardan la tasa, el plazo ni el % de impuesto por separado; el plazo
> se deduce como `diasTramo1 + diasTramo2`.

### Migraciones

`leerLedger()` completa los registros antiguos al leerlos y los vuelve a
guardar:

1. Sin `numeroContrato` → se le asigna el siguiente correlativo.
2. Sin `interesDiario` → interés total ÷ plazo (24 si no se conoce).
3. Sin `diasTramo1` / `diasTramo2` → interés del tramo ÷ interés diario.

Si en el futuro se agrega un campo, se debe añadir aquí una migración similar.

## N° de contrato correlativo

- `interesSimpleContratoContador` guarda el último número usado.
- Si el campo se deja vacío, se usa el siguiente correlativo.
- Si se escribe un número mayor al contador, el contador salta a ese número.
- No se permiten números repetidos en el tablero.

## Exportación a Excel

Botón **"Exportar a Excel"** → archivo `tablero-interes-simple-AAAA-MM-DD.xlsx`
con una hoja llamada *Tablero*:

1. Resumen del tablero (una fila por contrato + fila de totales).
2. Debajo, "Días de pago por contrato": el cronograma diario de todos los
   contratos.

Los montos se redondean a 2 decimales en el Excel.

## Limitaciones conocidas

- La etiqueta "Interés total (24 días)" del resumen está fija y no refleja el
  plazo ingresado.
- Si el préstamo abarca tres meses o más, la factura 2 agrupa todos los meses
  siguientes.
- Los registros no se pueden editar; solo eliminar y volver a calcular.
- Datos solo en el navegador (ver [arquitectura](arquitectura.md#almacenamiento)).
