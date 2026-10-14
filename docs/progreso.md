# Progreso de Ukhu Pacha Pass

Registro de cierres de fase. Lo actualiza la skill `/cierre-de-fase`. Fechas según la sección 12 del plan. Congelamiento de cambios: miércoles 28 de octubre.

| Fase | Fechas previstas | Estado | Cierre |
|---|---|---|---|
| 0. Preparación | Mar 13 | APROBADA | Mar 13 |
| 1. Registro público | Mié 14 a Vie 16 | APROBADA | Mar 13 |
| 2. Panel admin | Vie 16 a Dom 18 | APROBADA | Mar 13 |
| 3. QR y correo | Lun 19 a Mié 21 | APROBADA | Mar 13 |
| 4. Escáner | Jue 22 a Vie 23 | APROBADA | Mié 14 |
| 5. Resumen y gastos | Sáb 24 | APROBADA | Mié 14 |
| 6. Pulido visual | Dom 25 | APROBADA | Mié 14 |
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

### Fase 3: QR y correo. Martes 13 de octubre. APROBADA

- Criterio: un pagado recibe un correo con QR legible. Probado por el usuario con su correo: llegó, el QR se lee (`UPP:<token>`) y el enlace abre la entrada. `correo_enviado_en` quedó registrado en los dos asistentes de prueba.
- `/entrada/[token]`: token válido muestra QR, código y nombre, sin DNI. Token inventado o texto basura: "Entrada no encontrada". noindex y force-dynamic.
- `/admin/correos`: resumen (por enviar, con error, enviados, sin correo), lote con tope 40, reintento de fallidos. Reenvío individual y enlace para WhatsApp en la ficha.
- tsc, lint y build sin errores. No hay `npm test`. Sin secretos en el bundle del cliente. `npm audit --omit=dev` sin vulnerabilidades (nodemailer fijado en 10.0.10: <=10.0.8 tiene avisos altos y 10.1.0 era de hace 3 días).
- revisor-seguridad: sin CRÍTICOS ni ALTOS. Corregidos los 5 BAJOS: un solo lote a la vez (reserva atómica en rate_limits por 60 s), rechazos 4xx de Gmail detienen el lote, si el correo salió y solo falla el guardado no se marca error a la persona, timeouts de 10 s en la conexión SMTP, y en producción el envío exige APP_URL con https.
- Prueba 13.3 (fallo de correo y reintento): la lógica está y fue revisada, pero el fallo por dirección rechazada no se simuló contra Gmail. Requiere prueba manual en la fase 7: poner a mano `correo_error` en un registro de prueba y usar "Reintentar".
- Pendientes: cargar `APP_URL=https://ukhu-pacha-pass.vercel.app`, `GMAIL_USER` y `GMAIL_APP_PASSWORD` en Vercel. Revisar en producción que la cookie salga con Secure (pendiente de la fase 2).
- Decisión fuera del plan: columna `attendees.correo_error` (la sección 8 pide registrar el error del envío).

### Fase 4: Escáner. Miércoles 14 de octubre. APROBADA (3 vueltas)

- Criterio: dos celulares escaneando el mismo QR, solo uno ingresa. Probado contra la base: 10 escaneos simultáneos del mismo token dan exactamente 1 válido y 9 repetido. La función `registrar_ingreso` es un único UPDATE ... WHERE estado = 'pagado' RETURNING, con el registro en scan_log en la misma transacción.
- Probado: código corto (también en minúsculas), DNI con confirmación previa del nombre, pendiente -> no pagado, cancelado -> cancelado (estado intacto), inexistente y QR ajeno -> no encontrado, menor con franja propia, una fila de scan_log por escaneo, sesión de guardia sin acceso al panel, sin sesión -> "volver a ingresar el PIN", Origin ajeno o "null" -> 403, cuerpo no JSON -> 415.
- PIN (probado con el cuerpo real que arma React): 8 intentos errados por IP en 15 min, el 9.º bloqueado; un acierto reinicia el contador. Mínimo 8 caracteres. IPv6 agrupada por /64.
- tsc, lint y build sin errores. No hay `npm test`. Sin secretos en el bundle del cliente. `npm audit --omit=dev` sin vulnerabilidades. jsqr 1.4.0 fijado.
- Vuelta 1, NO APROBADA: probador-puerta ALTO (las Server Actions se ejecutan en fila: un escaneo colgado frenaba a los siguientes y luego se marcaban tarde) y ALTO (el límite del PIN contaba también los aciertos). Corregido: escaneo por ruta HTTP con fetch y corte a 8 s; límite que no castiga aciertos. Más MEDIOS: sesión vencida, base caída vs sesión, relectura del mismo QR, cámara cortada, búsqueda por DNI con confirmación, datos mínimos al guardia, puesto (Puerta 1 / Puerta 2).
- Vuelta 2, NO APROBADA: la conversión de "repetido" a "válido" en el cliente tras un timeout (agregada en la vuelta 1) podía dar un falso válido con un QR copiado. Eliminada por completo. Corregidos además: PIN con pedidos simultáneos (se reserva el intento antes de comparar), Origin mal formado, doble toque en Confirmar, cámara en pausa, IPv6.
- Vuelta 3: probador-puerta LISTO, revisor-seguridad SIN BLOQUEOS. Corregido el BAJO de IPv4 escrita como IPv6.
- Pendientes:
  - Decisión del usuario (14 oct): el PIN se queda en 6 dígitos y el mínimo se bajó a 6. Riesgo aceptado (los revisores sugerían 8+ caracteres). Recomendación: que no sea obvio (123456, fechas conocidas).
  - Migración de la fase 5: agregar 'por_confirmar' a resultado_escaneo y registrar en scan_log la consulta por DNI y el "No coincide".
  - Capacitación (fase 8): tras un "Sin respuesta", si al reintentar sale "Ya ingresó" con su puesto y hora de segundos atrás, pedir el DNI físico o llamar a un admin. Los guardias usan datos móviles o el punto de acceso de la organización, no el WiFi del local (el límite de PIN es por IP).
  - Pruebas con celulares reales (fase 7): lista de 17 pasos del probador-puerta (cámara trasera Android/iPhone, QR en pantalla y papel, poca luz, tiempo < 2 s, modo avión, 3G lento, QR copiado, dos celulares, DNI y doble toque, cámara interrumpida, PIN, sesión vencida, registro rápido, menor, carga con 4 a 6 celulares).
- Datos de prueba: DNI 10000001 a 10000005 (varios ya ingresados) y filas de scan_log con dispositivo "prueba".

### Fase 5: Resumen y gastos. Miércoles 14 de octubre. APROBADA

- Criterio: los números coinciden con la base. Comparado por script: base y panel dan los mismos pendientes (0), pagados (0), ingresados (4), cancelados (1), recaudado (S/ 80.00) y vendidas (4 / 250).
- Probado contra Supabase: gasto "35,50" guardado como 35.5 con balance y equilibrio recalculados y luego quitado; gasto inválido rechazado; configuración 25/260 aplicada (monto sugerido 25) y vuelta a 20/250; configuración inválida rechazada; un guardia no pudo crear gastos ni cambiar la configuración; CSV sin sesión o con guardia da 401; CSV de admin con BOM, filas correctas, tildes y eñes; scan_log registra por_confirmar y no_coincide sin cambiar el estado; anon no lee settings ni expenses.
- tsc, lint y build sin errores. No hay `npm test`. Sin secretos en el bundle del cliente. `npm audit --omit=dev` sin vulnerabilidades.
- revisor-seguridad: sin CRÍTICOS ni ALTOS. Corregidos: MEDIO (el CSV de pagados, que se imprime para la puerta, ahora lleva solo nombre, DNI enmascarado ****1234, código, estado, menor e ingreso; el CSV "todos" sigue completo para admins), BAJO (noCoincide con código o QR responde 400 y nunca marca ingreso), BAJO (error revisado al anotar consulta por DNI), columna "Ingreso marcado por".
- Pendientes:
  - Fase 7 (prueba 13.13): abrir los dos CSV en Excel del usuario. Si todo aparece en una columna, cambiar el separador a punto y coma.
  - Opcional, no hecho: límite de fechas de gastos e historial de gastos borrados.
- Decisiones: precio y aforo en la tabla settings (con respaldo en TICKET_PRICE y EVENT_CAPACITY); las páginas públicas se regeneran cada 60 s; recaudado = suma de monto_pagado de pagados e ingresados (los cancelados no cuentan).
- Datos de prueba: DNI 10000006 (pagado, nombre "Prueba Ñandú Pérez").

### Fase 6: Pulido visual. Miércoles 14 de octubre. APROBADA (primera pasada; el usuario seguirá pidiendo ajustes)

- Pedido del usuario: textos más grandes, portada más limpia, en pantallas grandes ~70 % del ancho, ubicación con mapa o botón a Google Maps (a una cuadra del Colegio Santa María de los Andes), animaciones y fondos con niebla o textura (referencia: ghostsandgravestones.com), usar el logo Logo-Ukhu_Pacha_Pass.png, mantener los colores.
- Hecho: logo recortado (el PNG traía el cuadriculado pintado) en public/mascara.webp e ícono src/app/icon.png; páginas públicas en src/app/(publico) con niebla en capas que deriva (public/niebla.svg), grano (public/grano.svg) y un solo momento animado (la máscara sale de la niebla y flota); portada nueva (nombre grande, datos en franja, pasos, aviso de edad, Dónde con mapa embebido oscuro y botón a Google Maps, cierre con cerros); registro, confirmación y entrada a dos columnas en escritorio y con texto más grande; la máscara reemplaza a la chakana como logo en encabezados y panel.
- Revisión contra identidad-visual, pantalla por pantalla, capturas reales a 390 px (emulación de celular por el protocolo de Chrome) y 1440 px: portada, registro, confirmación, entrada, login, resumen, asistentes, gastos y puerta. Sin desborde horizontal en ninguna. Puerta sin niebla ni grano (verificado en el HTML). QR de la entrada sobre blanco y sin animación. prefers-reduced-motion detiene todo.
- Excepción documentada en la skill identidad-visual: la niebla usa bordes suaves (única excepción a "sin degradados"), solo en la parte pública.
- tsc, lint y build sin errores. No hay `npm test`. Sin secretos en el bundle del cliente.
- Pendientes:
  - El mapa embebido no se dibuja en Chrome sin ventana (Google lo permite solo dentro de iframes; la URL /maps/embed responde 200 sin X-Frame-Options). Verificar en un navegador real. Si no carga, queda el texto de respaldo y el botón a Google Maps.
  - Nombres reales de los coordinadores (src/config/evento.ts, PROVISIONAL).
  - Ajustes visuales que pida el usuario.
