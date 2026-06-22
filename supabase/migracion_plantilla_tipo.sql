-- Plantillas separadas por tipo de equipo (un entrenador puede tener F11, F9 y F7).
-- Cada jugador pertenece a un tipo. Los existentes se asignan a '11' por defecto.
alter table jugadores add column if not exists tipo_equipo text not null default '11';

-- (opcional) permitir '9' además de '11' y '7' en el perfil — sin check, texto libre.
