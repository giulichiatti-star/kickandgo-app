-- Registro interno de accesos "ver como cliente" (soporte técnico).
-- Solo visible para admin — nunca se muestra al cliente ni se le notifica.
-- Ejecutar en Supabase SQL Editor.

create table if not exists admin_accesos (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  cliente_email text not null,
  creado timestamptz not null default now()
);

create index if not exists admin_accesos_cliente_idx on admin_accesos (cliente_id);

alter table admin_accesos enable row level security;

-- Solo admin puede leer el log. Los inserts los hace exclusivamente la Edge
-- Function con la service role key (bypassa RLS), nunca el cliente directo.
drop policy if exists "admin_accesos_select_admin" on admin_accesos;
create policy "admin_accesos_select_admin"
  on admin_accesos for select using (public.is_admin());
