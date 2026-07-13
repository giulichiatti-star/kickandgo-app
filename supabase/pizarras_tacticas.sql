-- Pizarra táctica: ejercicios/jugadas diseñadas por el entrenador (símbolos + frames).
-- Tabla nueva, aislada — no modifica ninguna tabla existente.
-- Ejecutar en Supabase SQL Editor.

create table if not exists pizarras_tacticas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  equipo_id uuid references equipos(id) on delete cascade,
  nombre text not null default 'Nuevo ejercicio',
  frames jsonb not null default '[]'::jsonb,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create index if not exists pizarras_tacticas_equipo_idx on pizarras_tacticas (equipo_id);

alter table pizarras_tacticas enable row level security;

drop policy if exists "pizarras_select_own" on pizarras_tacticas;
create policy "pizarras_select_own"
  on pizarras_tacticas for select using (auth.uid() = user_id);

drop policy if exists "pizarras_insert_own" on pizarras_tacticas;
create policy "pizarras_insert_own"
  on pizarras_tacticas for insert with check (auth.uid() = user_id);

drop policy if exists "pizarras_update_own" on pizarras_tacticas;
create policy "pizarras_update_own"
  on pizarras_tacticas for update using (auth.uid() = user_id);

drop policy if exists "pizarras_delete_own" on pizarras_tacticas;
create policy "pizarras_delete_own"
  on pizarras_tacticas for delete using (auth.uid() = user_id);
