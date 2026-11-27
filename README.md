# Herramientas Contables

Colección de herramientas web sencillas para llevar la contabilidad de préstamos
y otras operaciones de una empresa pequeña. Todo funciona en el navegador:
no hay servidor, base de datos ni instalación.

> **Versión en uso:** la rama `main` está publicada en GitHub Pages y se usa
> en el trabajo diario. **No se desarrolla directamente sobre `main`.**
> Lee [docs/flujo-de-trabajo.md](docs/flujo-de-trabajo.md) antes de hacer cambios.

## Herramientas

La página principal es un panel con un menú lateral que agrupa las
herramientas por tema. Las que todavía no existen aparecen como
**Próximamente** (ver la [hoja de ruta](docs/hoja-de-ruta.md)).

### Disponibles

| Herramienta | Carpeta | Para qué sirve |
|---|---|---|
| Calculadora de Interés Simple | `herramientas/calculadora-interes-simple/` | Calcula el interés de préstamos a plazo en días, lo parte por mes calendario (factura 1 y factura 2), lleva un tablero de contratos, resume el interés facturado por mes, exporta a Excel y permite guardar/restaurar respaldos. |

Detalle de cada una en [`docs/`](docs/).

## Cómo usarlo

- **En línea:** abre la página de GitHub Pages del repositorio
  (normalmente `https://defartion.github.io/Herramientas-contables/`).
- **En tu computadora:** abre `index.html` con doble clic, o levanta un
  servidor local (recomendado, ver abajo).

### Probar en local

Con Python instalado, desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Luego entra a <http://localhost:8000>. También sirve la extensión
*Live Server* de VS Code.

> Los datos (tablero de contratos) se guardan en el `localStorage` **del
> navegador y del sitio donde se abre**. Lo que pruebes en `localhost` no se
> mezcla con los datos reales que están en GitHub Pages.

## Estructura del proyecto

```
.
├── index.html            # Panel principal (menú lateral)
├── script.js             # Lista de herramientas por sección y lógica del menú
├── style.css             # Estilos de la página principal
├── favicon.svg           # Ícono del sitio
├── herramientas/
│   └── calculadora-interes-simple/
│       ├── index.html    # Interfaz de la calculadora
│       ├── style.css     # Estilos de la calculadora
│       └── js/
│           ├── calculo.js        # Fórmulas (sin pantalla): se prueba aparte
│           ├── almacenamiento.js # Guardado en el navegador, migraciones, respaldos
│           ├── excel.js          # Exportación a Excel
│           └── app.js            # Pantalla: formulario, tablero, avisos
├── tests/                # Pruebas automáticas de los cálculos
├── docs/                 # Documentación
├── package.json          # Comando de pruebas (npm test)
├── CHANGELOG.md          # Historial de cambios
└── README.md
```

El panel carga cada herramienta dentro de un `<iframe>`, así cada
una es independiente (su propio HTML, CSS y JS) y no se rompen entre sí.

## Pruebas

Los cálculos tienen pruebas automáticas, entre ellas una que compara 2000
préstamos al azar con la fórmula original para asegurar que los montos no
cambien. Con [Node.js](https://nodejs.org/) 18 o superior:

```bash
npm test
```

No hace falta instalar nada más (no hay dependencias).

## Documentación

- [Hoja de ruta](docs/hoja-de-ruta.md) — herramientas planificadas.
- [Flujo de trabajo y ramas](docs/flujo-de-trabajo.md) — cómo desarrollar sin afectar la versión en uso.
- [Arquitectura](docs/arquitectura.md) — cómo está armado el proyecto.
- [Calculadora de Interés Simple](docs/calculadora-interes-simple.md) — reglas de cálculo, datos guardados y exportación.
- [Agregar una herramienta nueva](docs/agregar-herramienta.md) — paso a paso.

## Dependencias externas

Se cargan desde CDN (requieren internet):

- [Font Awesome 6.5.1](https://fontawesome.com/) — íconos.
- [SheetJS (xlsx) 0.18.5](https://sheetjs.com/) — exportación a Excel (solo en la calculadora; se descarga recién al exportar).

## Autor

Sebastián Peláez López
