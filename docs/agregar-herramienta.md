# Agregar una herramienta nueva

Trabaja siempre en la rama `desarrollo` (ver [flujo de trabajo](flujo-de-trabajo.md)).

1. **Crear la carpeta** `herramientas/<nombre-con-guiones>/` con tres archivos:

   ```
   herramientas/conversor-moneda/
   ├── index.html
   ├── style.css
   └── script.js
   ```

   Una forma rápida es copiar la carpeta de la calculadora y vaciar lo que no
   sirva; así se mantienen los mismos estilos (variables de color, modo oscuro).

2. **Registrarla** en `script.js` de la raíz, dentro de `HERRAMIENTAS`:

   ```js
   {
     id: 'conversor-moneda',
     nombre: 'Conversor de Moneda',
     icono: 'fa-money-bill-transfer',   // ver https://fontawesome.com/icons
     ruta: 'herramientas/conversor-moneda/index.html'
   }
   ```

   No hace falta tocar nada más: la pestaña se genera sola.

3. **Usar claves propias de `localStorage`** si la herramienta guarda datos,
   con un prefijo único (por ejemplo `conversorMoneda...`), para no pisar los
   datos de otras herramientas.

4. **Documentarla:** crear `docs/<nombre>.md` y agregarla a la tabla de
   herramientas del `README.md`.

5. **Probar en local**, anotar en `CHANGELOG.md` y luego publicar siguiendo el
   [flujo de trabajo](flujo-de-trabajo.md#publicar-a-producción-pasar-a-main).
