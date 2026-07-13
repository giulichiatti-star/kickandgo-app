-- Notas libres por día en el Calendario (independientes de entrenos/convocatorias).
-- Ejecutar en Supabase SQL Editor.

create table if not exists calendario_notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  equipo_id uuid,
  fecha date not null,
  texto text not null default '',
  creado timestamptz not null default now()
);

create unique index if not exists calendario_notas_equipo_fecha_uk
  on calendario_notas (equipo_id, fecha);

alter table calendario_notas enable row level security;

create policy if not exists "calendario_notas_select_own"
  on calendario_notas for select using (auth.uid() = user_id);
create policy if not exists "calendario_notas_insert_own"
  on calendario_notas for insert with check (auth.uid() = user_id);
create policy if not exists "calendario_notas_update_own"
  on calendario_notas for update using (auth.uid() = user_id);
create policy if not exists "calendario_notas_delete_own"
  on calendario_notas for delete using (auth.uid() = user_id);
