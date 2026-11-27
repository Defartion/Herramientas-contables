# Flujo de trabajo y ramas

La rama `main` está publicada en **GitHub Pages** y se usa a diario. Cualquier
cambio que llegue a `main` se publica solo en uno o dos minutos. Por eso:

| Rama | Uso |
|---|---|
| `main` | **Producción.** Solo recibe cambios ya probados. Nunca se trabaja directo aquí. |
| `desarrollo` | Rama de trabajo. Aquí se hacen y prueban los cambios. |

Para cambios grandes se puede crear una rama a partir de `desarrollo`
(por ejemplo `feature/conversor-moneda`) y luego unirla a `desarrollo`.

## Día a día

```bash
git checkout desarrollo        # cambiarse a la rama de trabajo
git pull                       # traer lo último (si ya está en GitHub)
# ... hacer cambios y probar en local ...
git add .
git commit -m "Descripción corta del cambio"
git push -u origin desarrollo  # la primera vez; luego basta con git push
```

Subir `desarrollo` a GitHub **no afecta** la página publicada, mientras
GitHub Pages siga configurado para publicar desde `main`
(Settings → Pages → *Branch: main*).

## Publicar a producción (pasar a `main`)

Solo cuando el cambio está probado:

1. Revisar la lista de verificación de abajo.
2. Unir los cambios:
   ```bash
   git checkout main
   git pull
   git merge desarrollo
   git push
   git checkout desarrollo     # volver a la rama de trabajo
   ```
   O, desde GitHub, abrir un *Pull Request* de `desarrollo` hacia `main`.
3. Abrir la página publicada y confirmar que todo carga y que el tablero
   sigue mostrando los contratos existentes.
4. Anotar el cambio en `CHANGELOG.md`.

## Lista de verificación antes de publicar

- [ ] `npm test` pasa sin errores.
- [ ] La herramienta abre sin errores (revisar la consola del navegador, F12).
- [ ] Un cálculo de ejemplo da los mismos resultados que antes
      (ver el ejemplo en [calculadora-interes-simple.md](calculadora-interes-simple.md)).
- [ ] **El tablero existente se sigue viendo.** Si se cambió la forma de guardar
      los datos, hay una migración para los registros antiguos.
- [ ] La exportación a Excel funciona.
- [ ] Se ve bien en celular (la página se usa en pantallas pequeñas).

## Cuidado con los datos guardados

Los contratos viven en el `localStorage` del navegador que se use en la página
publicada. **No hay copia en ningún servidor.** Por eso:

- No cambiar los nombres de las claves `interesSimpleTableroLedger`,
  `interesSimpleContratoContador`, `interesSimplePreferencias` ni
  `hubUltimaHerramienta`; si se cambian, el tablero aparecerá vacío.
- Si se agrega o renombra un campo de los registros, añadir una migración en
  `migrarRegistros()` de `js/calculo.js` (como las que ya existen) y una
  prueba en `tests/calculo.test.js`, en lugar de asumir que todos los
  registros tienen el campo nuevo.
- Recomendación de uso: descargar un respaldo (menú **Respaldo**) con
  regularidad. Se puede restaurar en cualquier navegador.
