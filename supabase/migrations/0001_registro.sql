-- Fase 1: asistentes y límite de intentos por IP.
-- Pegar en Supabase > SQL Editor y ejecutar una sola vez.

create type estado_asistente as enum ('pendiente', 'pagado', 'ingresado', 'cancelado');
create type origen_asistente as enum ('web', 'admin', 'puerta');

create table public.attendees (
  id                uuid primary key default gen_random_uuid(),
  dni               text not null unique check (dni ~ '^[0-9]{8}$'),
  nombre            text not null check (char_length(nombre) between 3 and 120),
  -- opcional solo en el registro en puerta (sección 8 del plan)
  correo            text check (correo is null or char_length(correo) <= 254),
  celular           text not null check (celular ~ '^9[0-9]{8}$'),
  estado            estado_asistente not null default 'pendiente',
  es_menor          boolean not null default false,
  origen            origen_asistente not null default 'web',
  -- sin 0, O, 1, I, L
  codigo_corto      text unique check (codigo_corto is null or codigo_corto ~ '^[A-HJKMNP-Z2-9]{6}$'),
  qr_token          text unique,
  monto_pagado      numeric(10, 2),
  pagado_en         timestamptz,
  pagado_por        uuid,
  correo_enviado_en timestamptz,
  ingresado_en      timestamptz,
  ingresado_por     text,
  notas             text,
  creado_en         timestamptz not null default now()
);

create index attendees_estado_idx on public.attendees (estado);

-- Tabla técnica (no está en la sección 7 del plan): contador de intentos por IP
-- para el formulario público y, desde la fase 4, para el PIN de la puerta.
-- La clave guarda un hash de la IP, no la IP en claro (es un seudónimo: se borra en la fase 8).
create table public.rate_limits (
  clave          text primary key,
  intentos       integer not null,
  ventana_inicio timestamptz not null
);

-- RLS activado y sin políticas: solo el servidor (service role) lee y escribe.
alter table public.attendees enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.attendees, public.rate_limits from anon, authenticated;

-- Suma un intento de forma atómica y devuelve true si sigue dentro del límite.
create function public.registrar_intento(p_clave text, p_max integer, p_ventana_segundos integer)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_intentos integer;
begin
  insert into rate_limits as r (clave, intentos, ventana_inicio)
  values (p_clave, 1, now())
  on conflict (clave) do update set
    intentos = case
      when r.ventana_inicio < now() - make_interval(secs => p_ventana_segundos) then 1
      else r.intentos + 1
    end,
    ventana_inicio = case
      when r.ventana_inicio < now() - make_interval(secs => p_ventana_segundos) then now()
      else r.ventana_inicio
    end
  returning intentos into v_intentos;

  return v_intentos <= p_max;
end;
$$;

revoke execute on function public.registrar_intento(text, integer, integer) from public, anon, authenticated;
grant execute on function public.registrar_intento(text, integer, integer) to service_role;
