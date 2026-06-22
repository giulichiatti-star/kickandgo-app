-- ============================================================
-- AMONESTACIONES (tarjetas)
-- Pega en Supabase → SQL Editor → Run
-- ============================================================
create table if not exists public.tarjetas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  jugador_id  uuid references public.jugadores(id) on delete cascade,
  tipo        text not null default 'amarilla',  -- amarilla | roja
  fecha       date default now(),
  minuto      int,
  motivo      text default '',
  creado      timestamptz default now()
);
create index if not exists tarjetas_user_idx on public.tarjetas(user_id);

alter table public.tarjetas enable row level security;
drop policy if exists "own_select" on public.tarjetas;
drop policy if exists "own_modify" on public.tarjetas;
create policy "own_select" on public.tarjetas for select using (auth.uid() = user_id);
create policy "own_modify" on public.tarjetas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
