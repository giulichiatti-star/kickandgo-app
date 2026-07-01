-- Distinción de clientes "Fundador" (primeros 50, precio bloqueado)
alter table public.profiles add column if not exists es_fundador boolean default false;
