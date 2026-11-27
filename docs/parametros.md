# Parámetros legales

Todos los valores legales que usan las herramientas están en
`compartido/parametros.js`. Son **valores por defecto**: en cada herramienta
se pueden cambiar en pantalla (sección "Valores vigentes").

Última revisión: **26/11/2026**.

## Valores vigentes

| Parámetro | Valor | Fuente |
|---|---|---|
| UIT 2026 | S/ 5 500 | D.S. 301-2025-EF |
| Remuneración mínima vital (RMV) | S/ 1 230 desde el 01/10/2026 | D.S. 015-2026-TR (un segundo tramo la llevará a S/ 1 300 en 2027) |
| Asignación familiar | 10 % de la RMV | Ley 25129 |
| IGV + IPM | 18 % (15,5 % IGV + 2,5 % IPM en 2026) | Ley 32387 (el IPM sube 0,5 % por año hasta 4 % en 2029; el total sigue en 18 %) |
| Restaurantes, hoteles y alojamientos MYPE | 10,5 % en 2026 (8 % + 2,5 % IPM); 15 % en 2027 | Ley 32219 y Ley 32387 |
| Retención del IGV | 3 % del total, operaciones mayores a S/ 700 | Régimen de retenciones del IGV |
| Detracciones (servicios) | 4 %, 10 % o 12 % según el servicio; operaciones mayores a S/ 700; depósito sin decimales | Anexo 3 de la R.S. 183-2004/SUNAT |
| Percepciones | 2 % general; 0,5 % si el cliente es agente de percepción; 1 % combustibles | Ley 29173 |
| Renta de 4.ª: retención | 8 % en recibos mayores a S/ 1 500 | Art. 74 de la Ley del Impuesto a la Renta |
| Renta de 4.ª: suspensión 2026 | Ingresos anuales hasta S/ 48 125 (S/ 38 500 directores y similares) | R.S. 000390-2025/SUNAT |
| Rentas del trabajo | Deducción de 7 UIT (+ hasta 3 UIT de gastos); tramos de 8 %, 14 %, 17 %, 20 % y 30 % (5/20/35/45 UIT) | Arts. 46 y 53 de la Ley del Impuesto a la Renta |
| Impuesto a la renta empresas | Régimen General 29,5 %; MYPE Tributario 10 % hasta 15 UIT y 29,5 % el exceso | SUNAT |
| ONP | 13 % | Sistema Nacional de Pensiones |
| AFP | Aporte 10 %; prima de seguro 1,37 % con tope de S/ 12 732,70; comisión sobre el sueldo: Habitat 1,47 %, Integra 1,55 %, Prima 1,60 %, Profuturo 1,69 % | SBS (devengue de octubre de 2026) |
| EsSalud | 9 % (base mínima: la RMV) | Ley 26790 |
| Bonificación extraordinaria | 9 % (EsSalud) o 6,75 % (EPS) de la gratificación | Ley 30334 |
| Participación de utilidades | 10 % pesquera, telecom. e industrial; 8 % minera, comercio y restaurantes; 5 % otras | D. Leg. 892 |
| TIM de SUNAT | 0,90 % mensual en soles (0,50 % en dólares) | R.S. 044-2021/SUNAT |
| Depreciación (tasas máximas) | Edificios 5 %; vehículos 20 %; maquinaria de minería, petróleo y construcción 20 %; equipos de cómputo 25 %; ganado y redes de pesca 25 %; maquinaria y otros bienes 10 % | Art. 22 del Reglamento de la LIR y art. 39 de la LIR |
| Régimen laboral MYPE | Pequeña empresa: CTS 15 remuneraciones diarias por año, media gratificación, 15 días de vacaciones, indemnización 20 RD por año (tope 120). Microempresa: sin CTS ni gratificación, 15 días de vacaciones, indemnización 10 RD por año (tope 90) | TUO de la Ley MYPE (D.S. 013-2013-PRODUCE) |

## Revisión anual (cada diciembre/enero)

1. **UIT** del nuevo año (decreto supremo del MEF, se publica en diciembre).
2. **Límites de suspensión de 4.ª categoría** (resolución de SUNAT de fin de año).
3. **IPM e IGV**: según la Ley 32387, 2027: 15 % + 3 %; 2028: 14,5 % + 3,5 %; 2029: 14 % + 4 %.
4. **Tasa especial de restaurantes y hoteles MYPE** (vence o cambia cada año).
5. **RMV** (cuando el gobierno la cambie; en 2027 hay un segundo tramo a S/ 1 300).
6. **AFP**: comisiones, prima de seguro y tope (la SBS los actualiza varias veces al año).
7. **Detracciones, retenciones y percepciones**: revisar si SUNAT cambió tasas o servicios.
8. Actualizar `actualizado` en `compartido/parametros.js`, la tabla de arriba y `CHANGELOG.md`.

Después de cambiar un valor, corre `npm test`: algunas pruebas comprueban,
por ejemplo, que el IGV y el IPM sumen el total.
