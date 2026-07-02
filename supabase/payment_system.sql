-- ============================================================
-- SISTEMA DE AVISOS DE PAGO — ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de avisos "ya pagué" enviados desde email
create table if not exists payment_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  metodo      text not null check (metodo in ('transferencia', 'bizum')),
  estado      text not null default 'pendiente' check (estado in ('pendiente', 'confirmado')),
  creado_en   timestamptz default now(),
  confirmado_en timestamptz,
  confirmado_por uuid references auth.users(id)
);

alter table payment_notifications enable row level security;

-- Admins pueden leer y actualizar; la Edge Function ya-pague inserta con service role
create policy "admins_select_payment_notifications" on payment_notifications
  for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins_update_payment_notifications" on payment_notifications
  for update using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- 2. pg_cron: programar emails y revisión de vencimientos
--    Reemplaza eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjb3F0eXd0amlqaGR5aGV0bGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE4MjU1MCwiZXhwIjoyMDk2NzU4NTUwfQ.Tn_ojsSX5HyPM8tIzjnN1PwRgH5lSeB-164e06ZmBgE con la clave real de
--    Supabase → Settings → API → service_role key
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Revisar vencimientos a las 8:50 UTC (10:50h Madrid verano / 9:50h invierno)
select cron.schedule(
  'revisar-vencimientos-daily',
  '50 7 * * *',
  $$
  select net.http_post(
    url     := 'https://ccoqtywtjijhdyhetlfy.supabase.co/functions/v1/revisar-vencimientos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjb3F0eXd0amlqaGR5aGV0bGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE4MjU1MCwiZXhwIjoyMDk2NzU4NTUwfQ.Tn_ojsSX5HyPM8tIzjnN1PwRgH5lSeB-164e06ZmBgE'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- Enviar emails de pago a las 9:00 UTC (11:00h Madrid verano / 10:00h invierno)
select cron.schedule(
  'send-payment-emails-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url     := 'https://ccoqtywtjijhdyhetlfy.supabase.co/functions/v1/send-payment-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjb3F0eXd0amlqaGR5aGV0bGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE4MjU1MCwiZXhwIjoyMDk2NzU4NTUwfQ.Tn_ojsSX5HyPM8tIzjnN1PwRgH5lSeB-164e06ZmBgE'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- Push notifications a las 8:30 UTC (10:30h Madrid verano)
select cron.schedule(
  'daily-notifications-push',
  '30 7 * * *',
  $$
  select net.http_post(
    url     := 'https://ccoqtywtjijhdyhetlfy.supabase.co/functions/v1/daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjb3F0eXd0amlqaGR5aGV0bGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE4MjU1MCwiZXhwIjoyMDk2NzU4NTUwfQ.Tn_ojsSX5HyPM8tIzjnN1PwRgH5lSeB-164e06ZmBgE'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- Ver los crons activos:
-- select * from cron.job;

-- Eliminar un cron si hace falta:
-- select cron.unschedule('send-payment-emails-daily');
