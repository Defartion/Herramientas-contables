# Agregar una herramienta nueva

Trabaja siempre en la rama `desarrollo` (ver [flujo de trabajo](flujo-de-trabajo.md)).
La forma más rápida es copiar una herramienta parecida; `herramientas/igv/`
es la más simple.

## 1. Crear la carpeta

`herramientas/<id>/` (el mismo `id` del menú):

```
herramientas/mi-herramienta/
├── index.html
└── js/
    ├── calculo.js   # fórmulas puras: sin pantalla ni localStorage
    └── app.js       # pantalla
```

`index.html` usa la plantilla común (copia el de otra herramienta y cambia el
título, el subtítulo y el ícono). Carga, en este orden:

```html
<link rel="stylesheet" href="../../compartido/base.css">
...
<script src="../../compartido/util.js"></script>
<script src="../../compartido/parametros.js"></script>
<script src="../../compartido/base.js"></script>
<!-- <script src="../../compartido/laboral.js"></script>  si usa reglas laborales -->
<script src="js/calculo.js"></script>
<script src="js/app.js"></script>
```

Contenedores que espera la plantilla: `<form id="form">`, `<div id="resultado">`
y, si hay una tabla grande, la tarjeta `#detalle` con `#detalleContenido` y el
botón `#btnExcel`.

## 2. Escribir el cálculo (`js/calculo.js`)

Funciones puras que reciben datos y devuelven resultados, con el patrón que
permite usarlas en el navegador y en las pruebas:

```js
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('../../../compartido/util.js'));
  else raiz.MiCalculo = fabrica(raiz.Util);
})(typeof self !== 'undefined' ? self : this, function (U) {
  'use strict';
  function validar(e) { const err = {}; if (!(e.monto > 0)) err.monto = 'Ingresa un monto.'; return err; }
  function calcular(e) { return { total: U.r2(e.monto * 1.18) }; }
  return { validar, calcular };
});
```

Los valores legales **no** van dentro del cálculo: recíbelos como parámetros
(la pantalla los toma de `compartido/parametros.js`).

## 3. Armar la pantalla (`js/app.js`)

```js
(function () {
  const C = window.MiCalculo;
  const f = HC.formulario('form', [
    { id: 'monto', etiqueta: 'Monto', tipo: 'dinero', valor: 1000 },
    { grupo: [ /* campos en una misma fila */ ] },
    { seccion: 'Valores vigentes' },
    { id: 'uit', etiqueta: 'UIT', tipo: 'dinero', valor: Parametros.uit.valor, parametro: true }
  ], { clave: 'mi-herramienta' });

  f.alCambiar(v => {
    if (!f.errores(C.validar(v))) { HC.$('resultado').innerHTML = HC.vacio('Completa los datos.'); return; }
    const r = C.calcular(v);
    HC.$('resultado').innerHTML = HC.stats([{ etiqueta: 'Total', valor: HC.dinero(r.total), acento: true }]);
  });
})();
```

Tipos de campo: `dinero`, `pct`, `numero`, `entero`, `fecha`, `mes`, `texto`,
`select`, `check`, `segmento`. Opciones útiles: `ayuda`, `si: v => ...`
(mostrar según otros campos), `parametro: true` (no se recuerda; siempre parte
del valor vigente).

Bloques de resultado: `HC.stats`, `HC.lineas`, `HC.tabla`, `HC.nota`,
`HC.fuente`. Excel: `HC.excel.conectarBoton('btnExcel', 'nombre', () => [hojas])`.

## 4. Probar

Crea o amplía un archivo en `tests/` con casos resueltos a mano y corre:

```bash
npm test
```

Revisa también la pantalla en local (escritorio y celular) y la consola del
navegador (F12).

## 5. Activarla en el menú

En `script.js` de la raíz, dentro de `SECCIONES`, agrega la `ruta` (si ya
estaba como planificada) o una entrada nueva:

```js
{ id: 'mi-herramienta', nombre: 'Mi herramienta', icono: 'fa-calculator',
  descripcion: 'Qué hace en una línea.',
  ruta: 'herramientas/mi-herramienta/index.html' }
```

Sin `ruta` aparece como **Próximamente**; con `pendiente: '...'` se explica qué
falta. Los íconos están en <https://fontawesome.com/icons> (versión 6, *solid*).

## 6. Documentar y publicar

- Agrega una sección en [herramientas.md](herramientas.md) y actualiza la tabla del `README.md`.
- Si usa un valor legal nuevo, agrégalo en `compartido/parametros.js` y en [parametros.md](parametros.md).
- Anota el cambio en `CHANGELOG.md` y publica siguiendo el
  [flujo de trabajo](flujo-de-trabajo.md#publicar-a-producción-pasar-a-main).
- Si la herramienta guarda datos, usa claves con prefijo propio (`hc:<id>:...`).
