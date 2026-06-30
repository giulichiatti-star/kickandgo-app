-- Captación de leads desde la landing + flag de admin en profiles

alter table public.profiles add column if not exists is_admin boolean default false;

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  email          text not null,
  telefono       text,
  equipo_nombre  text,
  estado         text not null default 'nuevo', -- nuevo | contactado | activo | descartado
  notas_admin    text default '',
  creado         timestamptz default now(),
  activado_en    timestamptz,
  cuenta_user_id uuid references auth.users(id)
);

alter table public.leads enable row level security;

drop policy if exists leads_insert_publico on public.leads;
create policy leads_insert_publico on public.leads
  for insert with check (true);

drop policy if exists leads_admin_select on public.leads;
create policy leads_admin_select on public.leads
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists leads_admin_update on public.leads;
create policy leads_admin_update on public.leads
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
