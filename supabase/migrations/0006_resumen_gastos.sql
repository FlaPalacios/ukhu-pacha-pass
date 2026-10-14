-- Fase 5: configuración, gastos y auditoría de consultas por DNI.
-- Pegar en Supabase > SQL Editor y ejecutar una sola vez, después de 0005.

-- Configuración: una sola fila (id siempre true).
create table public.settings (
  id             boolean primary key default true check (id),
  precio_entrada numeric(10, 2) not null default 20 check (precio_entrada > 0 and precio_entrada <= 1000),
  aforo          integer not null default 250 check (aforo > 0 and aforo <= 5000),
  nombre_evento  text not null default 'Ukhu Pacha Pass',
  fecha          date not null default '2026-10-31',
  actualizado_en timestamptz not null default now()
);

insert into public.settings default values;

create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  concepto   text not null check (char_length(concepto) between 2 and 120),
  monto      numeric(10, 2) not null check (monto > 0 and monto <= 100000),
  fecha      date not null default (now() at time zone 'America/Lima')::date,
  creado_por uuid not null references public.admin_profiles (id),
  creado_en  timestamptz not null default now()
);

-- RLS activado y sin políticas: solo el servidor (service role) lee y escribe.
alter table public.settings enable row level security;
alter table public.expenses enable row level security;
revoke all on public.settings, public.expenses from anon, authenticated;

-- Búsqueda por DNI en la puerta: la consulta previa y el "No coincide" también quedan en scan_log.
alter type resultado_escaneo add value if not exists 'por_confirmar';
alter type resultado_escaneo add value if not exists 'no_coincide';
