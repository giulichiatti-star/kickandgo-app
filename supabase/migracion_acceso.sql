-- ============================================================
-- CONTROL DE ACCESO POR SUSCRIPCIÓN
-- Pega esto en Supabase → SQL Editor → Run
-- ============================================================

-- 1) Campo "activo": cada cuenta nace BLOQUEADA hasta que tú la habilites
alter table public.profiles
  add column if not exists activo boolean not null default false;

-- (opcional) datos de suscripción para tu control
alter table public.profiles
  add column if not exists plan text default 'free';
alter table public.profiles
  add column if not exists vence date;

-- 2) Para HABILITAR a un usuario que ya pagó (ejemplo):
--    update public.profiles set activo = true, plan = 'pro', vence = '2026-12-31'
--    where id = (select id from auth.users where email = 'cliente@email.com');

-- 3) Para BLOQUEAR a alguien que dejó de pagar:
--    update public.profiles set activo = false
--    where id = (select id from auth.users where email = 'cliente@email.com');
