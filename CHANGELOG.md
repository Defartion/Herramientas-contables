# Historial de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las fechas son de publicación en `main`.

## [Sin publicar] — rama `desarrollo` (versión 3)

### Agregado
- 16 herramientas nuevas, con valores legales vigentes en Perú (revisados el 26/11/2026):
  - Préstamos e intereses: interés compuesto, cronograma de cuotas (francés/alemán con TCEA),
    conversor de tasas e interés moratorio (TIM de SUNAT).
  - Impuestos: IGV (18 % = 15,5 % IGV + 2,5 % IPM), detracciones/retenciones/percepciones
    y renta de 4.ª categoría.
  - Estados financieros: estado de resultados y ratios financieros.
  - Planilla y beneficios: sueldo neto, CTS, gratificaciones y liquidación (régimen general y MYPE).
  - Tesorería y activos: tipo de cambio, flujo de caja y depreciación.
- Código compartido en `compartido/` (estilos, formularios, Excel, fechas, reglas laborales, parámetros).
- Pruebas automáticas de todas las herramientas nuevas.
- Documentación: `docs/herramientas.md` y `docs/parametros.md` (con lista de revisión anual).

### Pendiente
- Balance desde Excel y conciliación bancaria: necesitan archivos de ejemplo
  (ver `docs/hoja-de-ruta.md`).

## Versión 2 (también sin publicar en `main`)

Los cálculos dan exactamente los mismos montos que la versión 1 y los
contratos ya guardados se siguen leyendo sin cambios.

### Agregado
- Resumen en vivo: el cálculo se ve mientras se escribe; el contrato se guarda
  solo con el botón **Guardar contrato en el tablero**.
- Respaldo: descargar y restaurar todos los contratos en un archivo `.json`.
- Tabla **Interés facturado por mes** (también como hoja en el Excel).
- Búsqueda por N° de contrato en el tablero.
- **Deshacer** al eliminar un contrato o vaciar el tablero.
- Confirmación antes de vaciar el tablero.
- Vista de tarjetas para el tablero en el celular.
- Impresión del tablero.
- Se recuerdan la última tasa, plazo e impuesto usados.
- Panel principal con menú lateral agrupado por temas (préstamos e
  intereses, impuestos, estados financieros, planilla, tesorería), página de
  inicio con todas las herramientas y buscador.
- Herramientas planificadas visibles como "Próximamente" (ver
  `docs/hoja-de-ruta.md`).
- Enlace directo a cada herramienta (`#interes-simple`) e ícono del sitio.
- Pruebas automáticas (`npm test`) y documentación.

### Cambiado
- Código de la calculadora separado en `calculo.js`, `almacenamiento.js`,
  `excel.js` y `app.js`.
- Errores mostrados junto a cada campo en lugar de ventanas de alerta; el N°
  de contrato repetido se avisa mientras se escribe.
- Excel con fechas reales y montos con formato numérico.
- SheetJS se descarga solo al exportar (la página carga más rápido).
- Diseño renovado: formulario y resumen lado a lado en pantallas grandes,
  mejor contraste en modo oscuro, foco visible con teclado.
- Página principal renombrada a "Herramientas Contables"; en celular el menú se abre con ☰.

### Corregido
- La etiqueta "Interés total (24 días)" ahora muestra el plazo ingresado.
- Si los datos guardados estuvieran dañados, se guarda una copia en vez de
  sobrescribirlos.

## 2026-10-09
- Ajustes al N° de contrato correlativo.

## 2026-10-05
- Exportación a Excel en una sola hoja (resumen + días de pago).
- Contratos con N° correlativo editable.
- Filas expandibles con los días de pago de cada contrato ("Ver").
- Arreglos y mejoras al tablero acumulado.

## 2026-09-25
- Nuevas funcionalidades y mejoras a la tabla de la calculadora.

## 2026-09-23
- Primera versión: página principal con pestañas y Calculadora de Interés Simple.
