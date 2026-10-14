# Progreso de Ukhu Pacha Pass

Registro de cierres de fase. Lo actualiza la skill `/cierre-de-fase`. Fechas según la sección 12 del plan. Congelamiento de cambios: miércoles 28 de octubre.

| Fase | Fechas previstas | Estado | Cierre |
|---|---|---|---|
| 0. Preparación | Mar 13 | APROBADA | Mar 13 |
| 1. Registro público | Mié 14 a Vie 16 | Pendiente | |
| 2. Panel admin | Vie 16 a Dom 18 | Pendiente | |
| 3. QR y correo | Lun 19 a Mié 21 | Pendiente | |
| 4. Escáner | Jue 22 a Vie 23 | Pendiente | |
| 5. Resumen y gastos | Sáb 24 | Pendiente | |
| 6. Pulido visual | Dom 25 | Pendiente | |
| 7. Pruebas | Lun 26 a Mié 28 | Pendiente | |
| 8. Operación | Jue 29 a Vie 30 | Pendiente | |

## Historial de cierres

### Fase 0: Preparación. Martes 13 de octubre. APROBADA

- Criterio: https://ukhu-pacha-pass.vercel.app responde 200 por HTTPS (Server: Vercel, HSTS activo), desplegado desde `main` (d4f2379).
- tsc, lint y build sin errores. No hay script `npm test` todavía.
- `.env.local` ignorado por git. Sin claves en archivos versionados.
- Supabase creado y variables cargadas en `.env.local`.
- Pendientes: cuenta Gmail dedicada (se necesita en la fase 3). Cargar las variables de Supabase en Vercel antes de publicar la fase 1. Cambiar la contraseña de la base de datos, que se compartió en el chat.
- Decisiones de la sección 3: menores con el valor por defecto (casilla y `es_menor` editable por admin). Textos de la fiesta provisionales en `src/config/evento.ts`. Limpieza posterior: primero respaldo completo descargable, luego se decide en la fase 8 si se anonimiza.
- Tabla técnica agregada fuera del plan: `rate_limits`, para el límite de intentos por IP (guarda un hash, no la IP).
