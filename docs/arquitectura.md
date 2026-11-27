# Arquitectura

## Visión general

Es un sitio estático (HTML + CSS + JavaScript puro, sin frameworks ni paso de
compilación). Se publica tal cual en GitHub Pages.

```
index.html  ──► script.js (lista HERRAMIENTAS)
                    │  crea una pestaña por herramienta
                    ▼
              <iframe src="herramientas/<nombre>/index.html">
                    │
                    ▼
        Herramienta independiente (su propio HTML/CSS/JS)
```

## Página principal (raíz)

- `script.js` define el arreglo `HERRAMIENTAS`. Cada elemento tiene:
  - `id`: identificador único (texto sin espacios).
  - `nombre`: texto de la pestaña.
  - `icono`: clase de Font Awesome (por ejemplo `fa-calculator`).
  - `ruta`: ruta al `index.html` de la herramienta.
- `renderTabs()` dibuja las pestañas; `seleccionarHerramienta(id)` carga la
  herramienta en un `<iframe>`.
- Guarda la última herramienta abierta en `localStorage`
  (clave `hubUltimaHerramienta`) para volver a abrirla al recargar.

## Herramientas

Cada herramienta vive en `herramientas/<nombre>/` con sus propios
`index.html`, `style.css` y `script.js`. Al cargarse en un `<iframe>`:

- Sus estilos y variables globales no chocan con los de otras herramientas.
- Se puede abrir sola, directamente desde su carpeta.
- Comparten el mismo `localStorage` (mismo sitio), por eso cada herramienta
  debe usar claves con un prefijo propio (por ejemplo `interesSimple...`).

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

Limitaciones: los datos son por navegador y por dispositivo, se pierden si se
borran los datos del sitio y no se sincronizan entre equipos.

## Dependencias (CDN)

- Font Awesome 6.5.1 (`all.min.js`) — íconos, en todas las páginas.
- SheetJS 0.18.5 (`xlsx.full.min.js`) — solo en la calculadora, para exportar.

Sin internet la página funciona, pero sin íconos y sin exportar a Excel.
