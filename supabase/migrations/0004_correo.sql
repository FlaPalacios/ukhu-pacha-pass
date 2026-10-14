-- Fase 3: registrar el error del último envío de QR por correo (sección 8 del plan).
-- Guarda solo un código técnico (por ejemplo "EENVELOPE 550"), nunca la dirección.
-- Pegar en Supabase > SQL Editor y ejecutar una sola vez, después de 0003.

alter table public.attendees
  add column correo_error text check (correo_error is null or char_length(correo_error) <= 120);
