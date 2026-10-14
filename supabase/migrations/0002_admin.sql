-- Fase 2: admins, historial de pagos y acciones atómicas sobre asistentes.
-- Pegar en Supabase > SQL Editor y ejecutar una sola vez, después de 0001.

-- Perfil de cada admin, enlazado a su usuario de Supabase Auth.
create table public.admin_profiles (
  id        uuid primary key references auth.users (id) on delete cascade,
  nombre    text not null check (char_length(nombre) between 2 and 60),
  creado_en timestamptz not null default now()
);

alter table public.attendees
  add constraint attendees_pagado_por_fkey foreign key (pagado_por) references public.admin_profiles (id);

create type accion_pago as enum ('marcar_pagado', 'revertir', 'cancelar');

create table public.payment_log (
  id          uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references public.attendees (id) on delete cascade,
  accion      accion_pago not null,
  monto       numeric(10, 2),
  admin_id    uuid not null references public.admin_profiles (id),
  creado_en   timestamptz not null default now()
);

create index payment_log_attendee_idx on public.payment_log (attendee_id, creado_en desc);

-- RLS activado y sin políticas: solo el servidor (service role) lee y escribe.
alter table public.admin_profiles enable row level security;
alter table public.payment_log enable row level security;
revoke all on public.admin_profiles, public.payment_log from anon, authenticated;

-- Marca pagado solo si está pendiente. El token y el código se conservan si ya existían
-- (por ejemplo tras revertir y volver a pagar). Devuelve false si no cambió nada.
create function public.marcar_pagado(
  p_id uuid, p_monto numeric, p_admin uuid, p_token text, p_codigo text
)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update attendees set
    estado       = 'pagado',
    monto_pagado = p_monto,
    pagado_en    = now(),
    pagado_por   = p_admin,
    qr_token     = coalesce(qr_token, p_token),
    codigo_corto = coalesce(codigo_corto, p_codigo)
  where id = p_id and estado = 'pendiente';

  if not found then
    return false;
  end if;

  insert into payment_log (attendee_id, accion, monto, admin_id)
  values (p_id, 'marcar_pagado', p_monto, p_admin);
  return true;
end;
$$;

-- Vuelve a pendiente desde pagado o cancelado. Quien ya ingresó no se toca.
create function public.revertir_pago(p_id uuid, p_admin uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_monto numeric;
begin
  -- Bloquea la fila: nadie puede cambiar su estado hasta terminar esta función.
  select monto_pagado into v_monto
  from attendees
  where id = p_id and estado in ('pagado', 'cancelado')
  for update;

  if not found then
    return false;
  end if;

  update attendees set
    estado       = 'pendiente',
    monto_pagado = null,
    pagado_en    = null,
    pagado_por   = null
  where id = p_id;

  insert into payment_log (attendee_id, accion, monto, admin_id)
  values (p_id, 'revertir', v_monto, p_admin);
  return true;
end;
$$;

-- Cancela un registro pendiente o pagado. Quien ya ingresó no se toca.
create function public.cancelar_registro(p_id uuid, p_admin uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_monto numeric;
begin
  update attendees set estado = 'cancelado'
  where id = p_id and estado in ('pendiente', 'pagado')
  returning monto_pagado into v_monto;

  if not found then
    return false;
  end if;

  insert into payment_log (attendee_id, accion, monto, admin_id)
  values (p_id, 'cancelar', v_monto, p_admin);
  return true;
end;
$$;

revoke execute on function public.marcar_pagado(uuid, numeric, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.revertir_pago(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cancelar_registro(uuid, uuid) from public, anon, authenticated;
grant execute on function public.marcar_pagado(uuid, numeric, uuid, text, text) to service_role;
grant execute on function public.revertir_pago(uuid, uuid) to service_role;
grant execute on function public.cancelar_registro(uuid, uuid) to service_role;
