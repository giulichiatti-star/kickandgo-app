-- Añade hora del partido, hora de convocatoria y lugar a las convocatorias.
-- Ejecutar en Supabase SQL Editor.

alter table convocatorias add column if not exists hora_partido text;
alter table convocatorias add column if not exists hora_convocatoria text;
alter table convocatorias add column if not exists lugar text;
