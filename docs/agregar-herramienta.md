# Agregar una herramienta nueva

Trabaja siempre en la rama `desarrollo` (ver [flujo de trabajo](flujo-de-trabajo.md)).

1. **Crear la carpeta** `herramientas/<id>/` (usa el mismo `id` que tiene en
   el menú) con su `index.html`, `style.css` y scripts:

   ```
   herramientas/igv/
   ├── index.html
   ├── style.css
   └── js/
       ├── calculo.js
       └── app.js
   ```

   Una forma rápida es copiar la carpeta de la calculadora y vaciar lo que no
   sirva; así se mantienen los mismos estilos (variables de color, modo oscuro).

2. **Activarla en el menú.** En `script.js` de la raíz, la lista `SECCIONES`
   agrupa las herramientas por tema. Si ya está como planificada, solo
   agrégale la `ruta`:

   ```js
   { id: 'igv', nombre: 'Calculadora de IGV', icono: 'fa-receipt',
     descripcion: 'Agrega o quita el IGV y separa base imponible e impuesto.',
     ruta: 'herramientas/igv/index.html' }        // ← con esto deja de ser "Próximamente"
   ```

   Si es nueva, agrégala dentro de la sección que corresponda (o crea una
   sección nueva con `{ titulo: '...', herramientas: [ ... ] }`). Los íconos
   están en <https://fontawesome.com/icons> (versión 6, estilo *solid*).

   No hace falta tocar nada más: el menú, el inicio y el contador se generan
   solos.

3. **Separar cálculo y pantalla** (recomendado): pon las fórmulas en un
   archivo aparte sin acceso a la página, como `js/calculo.js` de la
   calculadora, y agrega sus pruebas en `tests/<nombre>.test.js`.

4. **Usar claves propias de `localStorage`** si la herramienta guarda datos,
   con un prefijo único (por ejemplo `conversorMoneda...`), para no pisar los
   datos de otras herramientas.

5. **Documentarla:** crear `docs/<nombre>.md` y agregarla a la tabla de
   herramientas del `README.md`.

6. **Probar en local** (`npm test` y en el navegador), anotar en `CHANGELOG.md` y luego publicar siguiendo el
   [flujo de trabajo](flujo-de-trabajo.md#publicar-a-producción-pasar-a-main).
