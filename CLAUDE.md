# Ukhu Pacha Pass

Sistema web de registro, pagos y acceso con QR para la fiesta de Halloween del sábado 31 de octubre de 2026 (Santa María, Cusco). De 200 a 250 personas. Costo objetivo: 0 soles.

El plan completo está en `docs/plan.md`. Léelo entero antes de escribir código. El avance se registra en `docs/progreso.md`.

## Stack

Next.js (App Router) con TypeScript estricto, Tailwind, Zod, Supabase (PostgreSQL y Auth), Nodemailer con Gmail, `qrcode`, Vercel.

## Forma de trabajo

- Una fase a la vez, en el orden de la sección 12 del plan. No empieces la siguiente sin cumplir el criterio de terminado.
- Antes de programar una fase, di en pocas líneas qué vas a hacer.
- Al terminar una fase, detente y avísame. Yo correré /cierre-de-fase, y solo el veredicto APROBADA permite avanzar.
- Congelamiento de cambios: miércoles 28 de octubre. Después de esa fecha solo se corrigen errores.
- Mantén el código simple. No agregues librerías que no hagan falta.
- Si algo del plan no está claro, usa el valor por defecto de la sección 3 y déjalo anotado. No inventes funciones que el plan no pide.

## Reglas que no se negocian

1. Toda la lógica sensible (pagos, token, ingreso, PIN, correo) va en el servidor.
2. El ingreso se marca con una sola instrucción atómica: actualizar a `ingresado` solo si el estado actual es `pagado` y devolver la fila. Nunca leer y luego escribir en dos pasos.
3. Validar todo con Zod en el servidor. Consultas parametrizadas.
4. RLS activado y sin políticas públicas. Los datos se leen y escriben solo desde el servidor.
5. Ninguna clave en el cliente ni en el repositorio. `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_APP_PASSWORD`, `GUARD_PIN` y `SESSION_SECRET` viven solo en variables de entorno del servidor y nunca llevan el prefijo `NEXT_PUBLIC_`.
6. El QR contiene `UPP:<token>` con un token aleatorio. Nunca el DNI ni una URL.
7. El DNI va enmascarado salvo en la vista de admin. `/entrada/[token]` nunca muestra el DNI completo.
8. Nunca registrar datos personales en logs de errores.
9. Solo un admin marca pagos o crea registros en puerta. El guardia solo escanea y busca.
10. Si algo falla en la puerta, el sistema muestra un error claro. Nunca un falso "válido".

## Textos y estilo

- Interfaz en español. Nombres internos de tablas y campos como en la sección 7 del plan, de forma consistente.
- Sin emojis. Para cualquier pantalla o componente sigue la skill `identidad-visual`.

## Archivos de entorno

Nunca crees ni edites `.env` ni `.env.local`. Mantén `.env.example` actualizado, sin valores reales, y pídele al usuario que complete los valores.

## Supervisión

- `revisor-seguridad` (subagente, solo lectura): seguridad y datos personales. Se usa al cerrar cada fase desde la 1.
- `probador-puerta` (subagente): escáner e ingreso atómico. Se usa desde la fase 4.
- Los hooks de `.claude/settings.json` bloquean secretos y comandos destructivos, y revisan tipos después de cada edición. Si un hook te bloquea, corrige el problema de fondo. No intentes saltarlo.
