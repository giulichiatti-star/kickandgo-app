-- ============================================================
-- TIPO DE EQUIPO: Fútbol 11 o Fútbol 7
-- Un solo codebase parametrizado por este valor.
-- Pega en Supabase → SQL Editor → Run
-- ============================================================

alter table public.profiles
  add column if not exists tipo_equipo text not null default '11'
  check (tipo_equipo in ('11', '7'));

-- Se elige al crear el equipo y NO se cambia después (regla de negocio).
-- La app lee profiles.tipo_equipo y ramifica:
--   · Convocatoria: 11 titulares vs 7 titulares
--   · Pizarra: 11 puntos vs 7 puntos
--   · Formaciones disponibles (F11: 4-3-3, 4-4-2... | F7: 2-3-1, 3-2-1, 2-2-2, 1-3-2, 3-1-2)
