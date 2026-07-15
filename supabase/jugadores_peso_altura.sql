-- Añade peso (kg) y altura (cm) a la ficha del jugador.
-- Ejecutar en Supabase SQL Editor.

alter table jugadores add column if not exists peso_kg numeric;
alter table jugadores add column if not exists altura_cm numeric;
