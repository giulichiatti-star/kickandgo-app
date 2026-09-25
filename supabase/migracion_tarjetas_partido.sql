-- Enlaza cada tarjeta con el partido en el que se produjo, para mantener
-- sincronizados el acta del partido (partidos.notas) y Disciplina (tarjetas).
-- Columna nullable y aditiva: las tarjetas manuales sin partido siguen igual.
-- Sin FK a propósito: borrar partidos en bloque desde Ajustes no debe fallar.
alter table tarjetas add column if not exists partido_id uuid;
create index if not exists tarjetas_partido_idx on tarjetas (partido_id);
