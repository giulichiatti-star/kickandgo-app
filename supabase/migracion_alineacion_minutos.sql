-- Minutos jugados por jugador.
-- Guarda la alineación real del partido para poder derivar minutos:
--   { titulares:[{id,nombre,dorsal}], suplentes:[...],
--     cambios:[{min,saleId,entraId}], duracion:<minutos> }
-- Columna nullable y aditiva: los partidos históricos quedan NULL
-- y el frontend los trata como "sin datos de minutos" (no rompe nada).
alter table partidos add column if not exists alineacion jsonb;
