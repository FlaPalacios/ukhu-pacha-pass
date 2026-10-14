-- Fase 4: ingreso en la puerta y auditoría de escaneos.
-- Pegar en Supabase > SQL Editor y ejecutar una sola vez, después de 0004.

create type resultado_escaneo as enum ('valido', 'repetido', 'no_pagado', 'cancelado', 'no_encontrado');
create type metodo_escaneo as enum ('qr', 'codigo', 'dni');

create table public.scan_log (
  id          uuid primary key default gen_random_uuid(),
  attendee_id uuid references public.attendees (id) on delete set null,
  resultado   resultado_escaneo not null,
  metodo      metodo_escaneo not null,
  -- quién escaneó: nombre del admin o "guardia"
  dispositivo text not null check (char_length(dispositivo) <= 60),
  creado_en   timestamptz not null default now()
);

create index scan_log_creado_idx on public.scan_log (creado_en desc);

alter table public.scan_log enable row level security;
revoke all on public.scan_log from anon, authenticated;

-- Marca el ingreso y registra el escaneo en una sola llamada.
-- El ingreso es UNA instrucción atómica: UPDATE ... WHERE estado = 'pagado' RETURNING.
-- Si dos celulares escanean el mismo QR a la vez, solo uno actualiza la fila;
-- el otro no encuentra estado 'pagado' y recibe 'repetido'.
-- p_valor ya viene validado y normalizado desde el servidor.
create function public.registrar_ingreso(p_metodo metodo_escaneo, p_valor text, p_por text)
returns table (
  resultado     resultado_escaneo,
  nombre        text,
  codigo_corto  text,
  es_menor      boolean,
  ingresado_en  timestamptz,
  ingresado_por text,
  ingresados    bigint
)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v attendees;
  v_resultado resultado_escaneo;
begin
  update attendees a set
    estado        = 'ingresado',
    ingresado_en  = now(),
    ingresado_por = p_por
  where a.estado = 'pagado'
    and case p_metodo
          when 'qr'     then a.qr_token = p_valor
          when 'codigo' then a.codigo_corto = p_valor
          when 'dni'    then a.dni = p_valor
        end
  returning a.* into v;

  if found then
    v_resultado := 'valido';
  else
    -- No cambió nada: se busca solo para explicar por qué.
    select * into v from attendees a
    where case p_metodo
            when 'qr'     then a.qr_token = p_valor
            when 'codigo' then a.codigo_corto = p_valor
            when 'dni'    then a.dni = p_valor
          end;

    v_resultado := case
      when v.id is null              then 'no_encontrado'
      when v.estado = 'ingresado'    then 'repetido'
      when v.estado = 'cancelado'    then 'cancelado'
      else                                'no_pagado'
    end;
  end if;

  insert into scan_log (attendee_id, resultado, metodo, dispositivo)
  values (v.id, v_resultado, p_metodo, p_por);

  return query select
    v_resultado,
    v.nombre,
    v.codigo_corto,
    coalesce(v.es_menor, false),
    v.ingresado_en,
    v.ingresado_por,
    (select count(*) from attendees where estado = 'ingresado');
end;
$$;

revoke execute on function public.registrar_ingreso(metodo_escaneo, text, text) from public, anon, authenticated;
grant execute on function public.registrar_ingreso(metodo_escaneo, text, text) to service_role;
