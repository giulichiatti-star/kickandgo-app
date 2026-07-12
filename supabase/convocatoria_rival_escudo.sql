-- Logo opcional del rival para el PDF de convocatoria.
-- Ejecutar en Supabase SQL Editor.

alter table convocatorias add column if not exists rival_escudo_url text;
