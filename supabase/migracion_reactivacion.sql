-- ============================================================
-- REACTIVACIÓN POR INACTIVIDAD — emails escalonados (día 5/15/30)
-- Añade control de nivel + baja de emails comerciales (GDPR).
-- Ejecutar en Supabase → SQL Editor. Luego desplegar las funciones
-- y programar el cron (ver el bloque cron.schedule del final).
-- ============================================================

alter table profiles add column if not exists reactivacion_nivel   int         not null default 0;
alter table profiles add column if not exists reactivacion_email_en timestamptz;
-- Baja de emails comerciales/reactivación (el usuario puede desuscribirse).
alter table profiles add column if not exists email_baja           boolean     not null default false;

-- ── Cron: revisar inactivos a diario (9:20 UTC ≈ 11:20 Madrid verano) ──
-- ⚠️ Reemplaza <SERVICE_ROLE_KEY> por tu service_role real (Settings → API).
-- create extension if not exists pg_cron;  -- ya activada en payment_system.sql
-- create extension if not exists pg_net;

select cron.schedule(
  'reactivar-inactivos-daily',
  '20 9 * * *',
  $$
  select net.http_post(
    url     := 'https://ccoqtywtjijhdyhetlfy.supabase.co/functions/v1/reactivar-inactivos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- Ver crons:        select * from cron.job;
-- Quitar este cron: select cron.unschedule('reactivar-inactivos-daily');
