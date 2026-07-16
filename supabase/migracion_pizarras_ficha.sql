-- Ficha de ejercicio en la Pizarra táctica: explicación, duración, jugadores
-- convocados y día vinculado (para que aparezca en el calendario de Entrenamientos).
-- Pega en Supabase → SQL Editor → Run.

alter table pizarras_tacticas
  add column if not exists descripcion   text  not null default '',
  add column if not exists duracion_min  int   not null default 15,
  add column if not exists jugadores     jsonb not null default '[]'::jsonb,
  add column if not exists fecha         date;

create index if not exists pizarras_tacticas_fecha_idx on pizarras_tacticas (fecha);
