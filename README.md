# Ukhu Pacha Pass

Registro, pagos y acceso con QR para la fiesta de Halloween del sábado 31 de octubre de 2026 (Santa María, Cusco).

El plan completo está en `docs/plan.md` y el avance en `docs/progreso.md`.

## Requisitos

- Node.js 20 o superior
- Una cuenta de Supabase (plan gratuito), una de Vercel y una cuenta Gmail dedicada al evento

## Correr en local

```
npm install
cp .env.example .env.local   # y completa los valores
npm run dev
```

Abre http://localhost:3000.

Otros comandos: `npm run build`, `npm run lint`, `npx tsc --noEmit`.

## Variables de entorno

Están listadas en `.env.example`. En local van en `.env.local` (no se sube a git) y en producción se cargan en Vercel, en Project Settings > Environment Variables.

| Variable | Dónde se usa | Nota |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Servidor y cliente | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Servidor y cliente | Clave pública. Con RLS sin políticas no da acceso a datos |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor | Acceso total a la base. Nunca con prefijo `NEXT_PUBLIC_` |
| `GUARD_PIN` | Solo servidor | PIN compartido de los guardias |
| `SESSION_SECRET` | Solo servidor | Firma de cookies. 32 caracteres aleatorios o más |
| `GMAIL_USER` | Solo servidor | Cuenta Gmail del evento |
| `GMAIL_APP_PASSWORD` | Solo servidor | Contraseña de aplicación de esa cuenta |
| `APP_URL` | Servidor | URL pública, usada en los correos |
| `TICKET_PRICE` | Servidor | Precio por defecto de la entrada (20) |
| `EVENT_CAPACITY` | Servidor | Aforo (250) |

Para generar `SESSION_SECRET`:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Base de datos

El esquema está en `supabase/migrations/`. Cada archivo se pega, en orden, en el SQL Editor de Supabase y se ejecuta una sola vez.

## Crear admins

No hay registro público de admins. Para cada uno de los 5:

1. Supabase > Authentication > Users > Add user > Create new user. Correo, contraseña y "Auto Confirm User" marcado.
2. Supabase > SQL Editor, cambiando el nombre y el correo:

```sql
insert into public.admin_profiles (id, nombre)
select id, 'Nombre del admin' from auth.users where email = 'correo@ejemplo.com';
```

Un usuario de Auth sin fila en `admin_profiles` no puede entrar al panel.

Para quitarle el acceso a un admin (por ejemplo, si pierde el celular), no borres su fila: su historial de pagos depende de ella. Desactívalo, y sus sesiones abiertas dejan de servir de inmediato:

```sql
update public.admin_profiles set activo = false where nombre = 'Nombre del admin';
```

Para cerrar sus sesiones sin desactivarlo: `update public.admin_profiles set sesion_desde = now() where nombre = '...';`. "Salir" en el panel hace lo mismo con la propia sesión.

Además, en Authentication > Sign In / Providers, desactiva "Allow new users to sign up".

El panel está en `/admin`. La sesión dura 12 horas y usa una cookie firmada con `SESSION_SECRET`.
