-- Analítica de uso: registra tiempo (segundos) que cada usuario pasa en cada
-- ruta de la app, para el panel admin (ranking de usuarios activos, tiempo por
-- sección). Tabla nueva, aislada — no modifica ninguna tabla existente.
-- Ejecutar en Supabase SQL Editor.

create table if not exists analytics_eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ruta text not null,
  segundos int not null default 0,
  creado timestamptz not null default now()
);

create index if not exists analytics_eventos_user_idx on analytics_eventos (user_id);
create index if not exists analytics_eventos_creado_idx on analytics_eventos (creado);

alter table analytics_eventos enable row level security;

-- Cualquier usuario logueado puede registrar sus propios eventos.
drop policy if exists "analytics_insert_own" on analytics_eventos;
create policy "analytics_insert_own"
  on analytics_eventos for insert with check (auth.uid() = user_id);

-- Cada usuario ve solo sus eventos; el admin ve los de todos (reutiliza
-- public.is_admin() ya definida en migracion_crm.sql).
drop policy if exists "analytics_select_own_or_admin" on analytics_eventos;
create policy "analytics_select_own_or_admin"
  on analytics_eventos for select using (auth.uid() = user_id or public.is_admin());
