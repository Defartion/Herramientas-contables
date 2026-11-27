# Arquitectura

## Visión general

Es un sitio estático (HTML + CSS + JavaScript puro, sin frameworks ni paso de
compilación). Se publica tal cual en GitHub Pages.

```
index.html  ──► script.js (lista SECCIONES)
   │               │  arma el menú lateral agrupado por tema
   │               ▼
   │      ¿la herramienta tiene ruta?
   │        ├─ sí → <iframe src="herramientas/<id>/index.html">
   │        └─ no → página "Próximamente" (herramienta planificada)
   └── #inicio → tarjetas con todas las herramientas por sección
```

## Página principal (raíz)

Es un panel con menú lateral a la izquierda y la herramienta a la derecha.
En celular el menú se abre con el botón ☰.

- `script.js` define `SECCIONES`: cada sección tiene un `titulo` y una lista
  de `herramientas` con:
  - `id`: identificador único (texto sin espacios); también es la URL (`#id`).
  - `nombre`: texto del menú.
  - `icono`: clase de Font Awesome (por ejemplo `fa-calculator`).
  - `descripcion`: una línea sobre qué hace (se ve en el inicio y al pasar el mouse).
  - `ruta`: `index.html` de la herramienta. **Sin `ruta`, la herramienta se
    muestra como "Próximamente"** y sirve solo de referencia.
- `mostrar(id)` decide qué ver: la herramienta en un `<iframe>`, la página de
  "Próximamente" o el inicio.
- El buscador del menú filtra por nombre, sección y descripción.
- Cada herramienta tiene su enlace directo, por ejemplo `.../#interes-simple`.
- Se recuerda la última herramienta **disponible** abierta en `localStorage`
  (clave `hubUltimaHerramienta`) para volver a ella al entrar.

## Herramientas

Cada herramienta vive en `herramientas/<nombre>/` con sus propios
`index.html`, `style.css` y sus scripts. Al cargarse en un `<iframe>`:

- Sus estilos y variables globales no chocan con los de otras herramientas.
- Se puede abrir sola, directamente desde su carpeta.
- Comparten el mismo `localStorage` (mismo sitio), por eso cada herramienta
  debe usar claves con un prefijo propio (por ejemplo `interesSimple...`).

## Calculadora: archivos JavaScript

Se cargan en este orden (scripts normales, sin módulos, para que la página
también funcione abriéndola con doble clic):

| Archivo | Responsabilidad | Expone |
|---|---|---|
| `js/calculo.js` | Fórmulas, fechas, migraciones, totales y resumen mensual. No toca la pantalla ni el guardado. También se carga en Node para las pruebas. | `Calculo` |
| `js/almacenamiento.js` | Lectura y escritura en `localStorage`, contador de contratos, preferencias y respaldos. | `Almacen` |
| `js/excel.js` | Arma el libro de Excel y descarga SheetJS la primera vez. | `ExportarExcel` |
| `js/app.js` | Formulario, resumen en vivo, tablero, avisos y diálogos. | — |

Regla práctica: si algo es un cálculo, va en `calculo.js` con su prueba; si
es pantalla, va en `app.js`.

## Estilos

Ambos `style.css` usan variables CSS (`--bg`, `--accent`, etc.) con soporte
para modo claro y oscuro automático (`prefers-color-scheme`). Para forzar uno,
se puede poner `data-theme="light"` o `data-theme="dark"` en `<html>`.

## Almacenamiento

Todo se guarda en `localStorage` del navegador:

| Clave | Quién la usa | Contenido |
|---|---|---|
| `hubUltimaHerramienta` | Página principal | `id` de la última herramienta abierta |
| `interesSimpleTableroLedger` | Calculadora de interés | Arreglo JSON con los contratos |
| `interesSimpleContratoContador` | Calculadora de interés | Último N° de contrato usado |
| `interesSimplePreferencias` | Calculadora de interés | Últimos tasa, plazo e impuesto usados |

Limitaciones: los datos son por navegador y por dispositivo, se pierden si se
borran los datos del sitio y no se sincronizan entre equipos. Para eso existe
el respaldo (`.json`), que se descarga y se restaura desde la calculadora.

Si el tablero guardado estuviera dañado (JSON inválido), no se sobrescribe:
se copia a una clave `interesSimpleTableroLedger_danado_<fecha>` y se avisa.

## Dependencias (CDN)

- Font Awesome 6.5.1 (`all.min.js`) — íconos, en todas las páginas.
- SheetJS 0.18.5 (`xlsx.full.min.js`) — solo en la calculadora; se descarga al presionar "Exportar a Excel".

Sin internet la página funciona, pero sin íconos y sin exportar a Excel.
