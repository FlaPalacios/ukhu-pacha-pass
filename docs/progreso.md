# Progreso de Ukhu Pacha Pass

Registro de cierres de fase. Lo actualiza la skill `/cierre-de-fase`. Fechas según la sección 12 del plan. Congelamiento de cambios: miércoles 28 de octubre.

| Fase | Fechas previstas | Estado | Cierre |
|---|---|---|---|
| 0. Preparación | Mar 13 | APROBADA | Mar 13 |
| 1. Registro público | Mié 14 a Vie 16 | APROBADA | Mar 13 |
| 2. Panel admin | Vie 16 a Dom 18 | APROBADA | Mar 13 |
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

### Fase 1: Registro público. Martes 13 de octubre. APROBADA

- Criterio: registro de punta a punta probado en local contra Supabase. La fila quedó en `pendiente`, origen `web`, celular normalizado ("+51 900 000 001" quedó como 900000001).
- Pruebas de la sección 13.1: DNI inválido y campos vacíos (mensajes por campo en cliente y servidor), DNI repetido ("Ya estás registrado" sin revelar datos).
- Anti-spam: honeypot lleno no guarda nada. Límite atómico por IP (10 llamadas paralelas con tope 5 dieron exactamente 5). Tope de registro: 20 por IP cada 10 minutos.
- RLS: con la clave anon, `attendees`, `rate_limits` y la RPC devuelven 401 (42501).
- tsc, lint y build sin errores. No hay `npm test`. No hay claves en el bundle del cliente. Cabeceras de seguridad activas (X-Frame-Options DENY, frame-ancestors 'none', nosniff, Referrer-Policy).
- revisor-seguridad: sin CRÍTICOS ni ALTOS. Corregidos: cabeceras de seguridad, tope por IP, la confirmación pide DNI y correo.
- Pendientes para fases siguientes:
  - Fase 2 (MEDIO): alguien puede registrar el DNI de otra persona con su propio correo. Al marcar el pago, mostrar nombre y correo enmascarado para que el coordinador los confirme con quien paga.
  - Fase 2 en adelante: cada migración nueva debe repetir `enable row level security` y `revoke all ... from anon, authenticated`.
  - Fase 4: cambiar el hash de IP a HMAC con `SESSION_SECRET` cuando esa variable exista.
  - Fase 5: neutralizar en el CSV las celdas que empiecen con =, +, - o @.
  - Fase 8: borrar `rate_limits` en el script de limpieza.
- Datos de prueba en la base: una fila ficticia (DNI 10000001) y claves `prueba:*` en `rate_limits`. Se pueden borrar desde el Table Editor.

### Fase 2: Panel admin. Martes 13 de octubre. APROBADA

- Criterio: un admin marca pagos y los cambios quedan en el historial. Probado en local contra Supabase con una sesión de admin firmada con SESSION_SECRET (el login con contraseña real lo prueba el usuario).
- Probado en el navegador: lista, búsqueda (nombre, código), filtros con conteos, marcar pagado, revertir, cancelar (exige confirmación), reactivar, editar (DNI inválido muestra error sin borrar lo escrito; es_menor y notas guardados), registro manual con pago inmediato y origen puerta, DNI repetido rechazado, salir.
- Prueba 13.2: pagar, revertir, cancelar, reactivar y volver a pagar conserva el código (RYTYPQ) y el token. Historial con los 5 movimientos.
- Atomicidad: 6 llamadas simultáneas a marcar_pagado sobre el mismo asistente, exactamente 1 aceptada.
- Acceso: sin cookie o con firma falsa, /admin/asistentes redirige a /admin/login. Con la clave anon, admin_profiles, payment_log y las RPC devuelven 401.
- tsc, lint y build sin errores. No hay `npm test`. Sin claves en el bundle del cliente.
- revisor-seguridad: sin CRÍTICOS ni ALTOS. Corregidos: MEDIO (no se podía quitar el acceso a un admin con historial; ahora `activo` y `sesion_desde` en admin_profiles, migración 0003), BAJO (salir invalida la sesión en el servidor) y BAJO (adminActual exige rol admin explícito).
- Pendientes:
  - El usuario debe ejecutar `supabase/migrations/0003_sesiones_admin.sql` antes de publicar; sin ella el panel no deja entrar.
  - El usuario prueba el login real en local y en Vercel, y revisa que la cookie salga con Secure en producción.
  - Fase 4: el rol guardia debe usar un id que no pueda coincidir con un admin.
- Decisiones: token y código corto se generan al marcar pagado (adelantado de la fase 3, como dice la sección 8). Cache Components de Next 16 desactivado. `/admin` redirige a la lista hasta la fase 5. Correo opcional en el registro manual.
- Datos de prueba: DNI 10000001 y 10000002 (pagados).
