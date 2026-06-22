-- Información de la liga / rivales cargada por el usuario (clasificación, goleadores, calendario)
-- Se guarda como JSON en el perfil. Estructura:
-- { "nombre": "...", "tabla": [...], "goleadores": [...], "calendario": [...] }
alter table profiles add column if not exists competicion jsonb default '{}'::jsonb;
