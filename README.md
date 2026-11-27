# Herramientas Contables

Colección de herramientas web para llevar la contabilidad de una empresa
peruana: intereses y préstamos, impuestos, planilla, tesorería y estados
financieros. Todo funciona en el navegador: no hay servidor, base de datos ni
instalación.

> **Versión en uso:** la rama `main` está publicada en GitHub Pages y se usa
> en el trabajo diario. **No se desarrolla directamente sobre `main`.**
> Lee [docs/flujo-de-trabajo.md](docs/flujo-de-trabajo.md) antes de hacer cambios.

## Herramientas

La página principal es un panel con un menú lateral agrupado por tema.
Detalle de cada herramienta en [docs/herramientas.md](docs/herramientas.md);
la calculadora de interés simple tiene su propio documento
([docs/calculadora-interes-simple.md](docs/calculadora-interes-simple.md)).

| Sección | Herramienta | Estado |
|---|---|---|
| Préstamos e intereses | Interés simple (tablero de contratos) | ✅ |
| | Interés compuesto | ✅ |
| | Cronograma de cuotas (francés/alemán, TCEA) | ✅ |
| | Conversor de tasas | ✅ |
| | Interés moratorio (TIM de SUNAT) | ✅ |
| Impuestos | Calculadora de IGV | ✅ |
| | Detracciones, retenciones y percepciones | ✅ |
| | Renta de 4.ª categoría | ✅ |
| Estados financieros | Balance desde Excel | ⏳ necesita un Excel de ejemplo |
| | Estado de resultados | ✅ |
| | Ratios financieros | ✅ |
| Planilla y beneficios | Sueldo neto | ✅ |
| | CTS | ✅ |
| | Gratificaciones | ✅ |
| | Liquidación de beneficios | ✅ |
| Tesorería y activos | Tipo de cambio | ✅ |
| | Flujo de caja | ✅ |
| | Conciliación bancaria | ⏳ necesita extracto y libro bancos de ejemplo |
| | Depreciación de activos | ✅ |

Las tasas y valores legales (UIT, RMV, IGV, AFP, etc.) están en un solo
archivo, `compartido/parametros.js`, y se revisan cada año
([docs/parametros.md](docs/parametros.md)). En cada herramienta se pueden
cambiar en pantalla.

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

> Los datos (tablero de contratos, flujo de caja, activos, valores de los
> formularios) se guardan en el `localStorage` **del navegador y del sitio
> donde se abre**. Lo que pruebes en `localhost` no se mezcla con los datos
> reales que están en GitHub Pages.

## Estructura del proyecto

```
.
├── index.html, script.js, style.css   # Panel principal (menú lateral)
├── favicon.svg
├── compartido/                         # Código común a todas las herramientas
│   ├── util.js          # Fechas, redondeo, impuesto por tramos, TIR (probado en Node)
│   ├── parametros.js    # Valores legales vigentes con su fuente
│   ├── laboral.js       # CTS, gratificaciones, vacaciones, indemnización, renta de 5.ª
│   ├── base.js          # Formularios, tablas, notas y exportación a Excel (global HC)
│   └── base.css         # Estilos comunes (modo claro y oscuro)
├── herramientas/
│   ├── calculadora-interes-simple/     # Herramienta original (estilos propios)
│   └── <id>/                           # Una carpeta por herramienta
│       ├── index.html
│       └── js/
│           ├── calculo.js              # Fórmulas puras (se prueban en Node)
│           └── app.js                  # Pantalla
├── tests/                # Pruebas automáticas (npm test)
├── docs/                 # Documentación
├── package.json
├── CHANGELOG.md
└── README.md
```

## Pruebas

Los cálculos tienen pruebas automáticas con casos resueltos a mano, entre ellas
una que compara 2000 préstamos al azar con la fórmula original de la
calculadora de interés simple. Con [Node.js](https://nodejs.org/) 18 o superior:

```bash
npm test
```

No hace falta instalar nada más (no hay dependencias).

## Documentación

- [Herramientas](docs/herramientas.md): qué calcula cada una, fórmulas y supuestos.
- [Parámetros legales](docs/parametros.md): valores vigentes, fuentes y revisión anual.
- [Hoja de ruta](docs/hoja-de-ruta.md): pendientes y próximos pasos.
- [Flujo de trabajo y ramas](docs/flujo-de-trabajo.md): cómo desarrollar sin afectar la versión en uso.
- [Arquitectura](docs/arquitectura.md): cómo está armado el proyecto.
- [Calculadora de Interés Simple](docs/calculadora-interes-simple.md): reglas de cálculo, datos guardados y exportación.
- [Agregar una herramienta nueva](docs/agregar-herramienta.md): paso a paso.

## Dependencias externas

Se cargan desde CDN (requieren internet):

- [Font Awesome 6.5.1](https://fontawesome.com/): íconos.
- [SheetJS (xlsx) 0.18.5](https://sheetjs.com/): exportación a Excel; se descarga recién al exportar.

## Aviso

Los resultados son referenciales. Las normas tributarias y laborales cambian:
verifica los valores vigentes y, ante casos particulares, consulta con un
contador.

## Autor

Sebastián Peláez López
