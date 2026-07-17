-- ============================================================
-- INFORME GLOBAL (solo admin) — KickAndGo
-- 1) Añade "categoria" a los equipos.
-- 2) Da al admin permiso de SOLO LECTURA sobre los datos de todos
--    los clubes, para poder generar el informe global y los premios.
--
-- SEGURO: no borra datos ni cambia las políticas de los entrenadores.
-- Solo AÑADE políticas nuevas de SELECT para admin (se combinan con OR).
-- Requiere que exista public.is_admin() (ya creada en migracion_crm.sql).
-- Pega en Supabase → SQL Editor → Run.
-- ============================================================

-- 1) Categoría por edad (Alevín, Cadete, Senior…) y división/nivel (2ª RFEF, Regional…)
alter table equipos add column if not exists categoria text default '';
alter table equipos add column if not exists division  text default '';

-- 2) Lectura global para admin en las tablas de datos.
--    Cada policy es PERMISIVA y se suma (OR) a la del dueño: el entrenador
--    sigue viendo solo lo suyo; el admin además puede leer todo.

drop policy if exists "equipos_admin_select"        on equipos;
create policy "equipos_admin_select"        on equipos        for select using (public.is_admin());

drop policy if exists "jugadores_admin_select"      on jugadores;
create policy "jugadores_admin_select"      on jugadores      for select using (public.is_admin());

drop policy if exists "partidos_admin_select"       on partidos;
create policy "partidos_admin_select"       on partidos       for select using (public.is_admin());

drop policy if exists "tarjetas_admin_select"       on tarjetas;
create policy "tarjetas_admin_select"       on tarjetas       for select using (public.is_admin());

drop policy if exists "entrenamientos_admin_select" on entrenamientos;
create policy "entrenamientos_admin_select" on entrenamientos for select using (public.is_admin());

-- profiles ya tiene lectura admin (migracion_crm.sql). Si no la tuvieras,
-- descomenta:
-- drop policy if exists "profiles_admin_select" on profiles;
-- create policy "profiles_admin_select" on profiles for select using (public.is_admin());

select '✅ Informe global: categoria + lectura admin lista' as resultado;
