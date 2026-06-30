-- CRM de leads + ciclo de vida de cuentas (contacto, alta, pago, suspensión)

-- 1. Progreso de respuesta en leads
alter table public.leads add column if not exists respondio text check (respondio in ('si','no')) default null;
alter table public.leads add column if not exists contactado_en timestamptz;

-- 2. Ciclo de vida de la suscripción en profiles
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists plan_estado text check (plan_estado in ('prueba','vencido','pagado','mora','baja')) default 'prueba';
alter table public.profiles add column if not exists prueba_vence timestamptz;
alter table public.profiles add column if not exists pago_vence timestamptz;
alter table public.profiles add column if not exists ultimo_pago_en timestamptz;

-- 3. Función security definer para comprobar admin sin recursión de RLS
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- 4. Policies de profiles: propio usuario + admin total
drop policy if exists "profile_select" on public.profiles;
drop policy if exists "profile_modify" on public.profiles;
drop policy if exists profiles_admin_select on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;

create policy profiles_admin_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy profiles_admin_update on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- 5. Cron diario de suspensión automática
-- NOTA: revisar-vencimientos se despliega con --no-verify-jwt (no requiere Authorization)
-- para no tener que guardar una clave secreta en este archivo SQL versionado en git.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'revisar-vencimientos-diario',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://ccoqtywtjijhdyhetlfy.supabase.co/functions/v1/revisar-vencimientos',
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  $$
);
