-- ============================================================
-- KICK AND GO · Esquema inicial (MVP)
-- Pega TODO esto en Supabase → SQL Editor → Run
-- ============================================================

-- 1) PERFIL DEL ENTRENADOR / CLUB ----------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  club_nombre  text default 'Mi club',
  descripcion  text default '',          -- ej: "Llavaneres 3ª"
  entrenador   text default '',
  escudo_url   text default '',
  creado       timestamptz default now()
);

-- 2) JUGADORES -----------------------------------------------
create table if not exists public.jugadores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  dorsal      int  default 0,
  posicion    text default 'Mediocampista',
  pie         text default 'Derecho',
  nacimiento  date,
  estado      text default 'activo',     -- activo | lesionado | sancionado
  foto_url    text default '',
  creado      timestamptz default now()
);
create index if not exists jugadores_user_idx on public.jugadores(user_id);

-- 3) PARTIDOS (para fases siguientes) ------------------------
create table if not exists public.partidos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  fecha         date,
  rival         text,
  local_visitante text default 'local',
  formacion     text default '433',
  gf            int default 0,
  gc            int default 0,
  estado        text default 'finalizado',
  notas         jsonb default '[]',
  analisis_ia   text default '',
  creado        timestamptz default now()
);
create index if not exists partidos_user_idx on public.partidos(user_id);

-- 4) CONVOCATORIAS -------------------------------------------
create table if not exists public.convocatorias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rival       text,
  fecha       text,
  formacion   text default '433',
  titulares   jsonb default '[]',
  suplentes   jsonb default '[]',
  creado      timestamptz default now()
);
create index if not exists convocatorias_user_idx on public.convocatorias(user_id);

-- ============================================================
-- SEGURIDAD: Row Level Security — cada usuario ve SOLO lo suyo
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.jugadores     enable row level security;
alter table public.partidos      enable row level security;
alter table public.convocatorias enable row level security;

-- Helper: políticas "dueño" para una tabla con columna user_id
do $$
declare t text;
begin
  foreach t in array array['jugadores','partidos','convocatorias'] loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_modify" on public.%I;', t);
    execute format($f$create policy "own_select" on public.%I for select using (auth.uid() = user_id);$f$, t);
    execute format($f$create policy "own_modify" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);$f$, t);
  end loop;
end $$;

-- Perfil: el dueño es la propia fila (id = auth.uid())
drop policy if exists "profile_select" on public.profiles;
drop policy if exists "profile_modify" on public.profiles;
create policy "profile_select" on public.profiles for select using (auth.uid() = id);
create policy "profile_modify" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- Crear perfil automáticamente al registrarse un usuario
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
