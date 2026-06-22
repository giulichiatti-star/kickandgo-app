-- ============================================================
-- ENTRENAMIENTOS
-- Pega en Supabase → SQL Editor → Run
-- ============================================================
create table if not exists public.entrenamientos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fecha       date not null,
  objetivo    text default '',
  ejercicios  jsonb default '[]',     -- [{n, cat, min, intensidad}]
  duracion    int default 0,
  asistencia  jsonb default '{}',     -- { jugadorId: 'ok'|'no'|'duda' }
  creado      timestamptz default now()
);
create index if not exists entrenamientos_user_idx on public.entrenamientos(user_id);

alter table public.entrenamientos enable row level security;
drop policy if exists "own_select" on public.entrenamientos;
drop policy if exists "own_modify" on public.entrenamientos;
create policy "own_select" on public.entrenamientos for select using (auth.uid() = user_id);
create policy "own_modify" on public.entrenamientos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
