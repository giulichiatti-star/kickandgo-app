-- Límite de equipos por cuenta: por defecto 2. Para dar excepción a un
-- usuario concreto, ejecuta:
--   update profiles set max_equipos = 5 where email = 'cliente@ejemplo.com';
-- Ejecutar en Supabase SQL Editor.

alter table profiles add column if not exists max_equipos int default 2;
