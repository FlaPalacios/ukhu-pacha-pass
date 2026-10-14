-- Fase 2 (corrección): poder quitar el acceso a un admin sin borrar su historial.
-- Pegar en Supabase > SQL Editor y ejecutar una sola vez, después de 0002.

-- activo = false: el admin no puede entrar ni usar una sesión ya abierta.
-- sesion_desde: las sesiones emitidas antes de esta hora dejan de valer
-- (se actualiza al salir, o a mano para cerrar todas las sesiones de un admin).
alter table public.admin_profiles
  add column activo boolean not null default true,
  add column sesion_desde timestamptz;
