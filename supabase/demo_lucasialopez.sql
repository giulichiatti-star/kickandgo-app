-- Datos de demo (inventados) para la cuenta lucasialopez1@gmail.com
-- Crea un equipo con plantilla, partidos, convocatorias, entrenos,
-- tarjetas y una lesión, para que la cuenta se vea operativa en una demo.
-- Ejecutar en Supabase SQL Editor.

do $$
declare
  v_user_id uuid := 'fa51827d-35ec-4743-a18c-a51d36c869a3';
  v_equipo_id uuid;
begin

  -- 1) Equipo -------------------------------------------------
  insert into equipos (user_id, nombre, tipo_equipo)
  values (v_user_id, 'CD Demo Fútbol', '11')
  returning id into v_equipo_id;

  -- 2) Plantilla (18 jugadores) --------------------------------
  create temporary table tmp_jug (id uuid, dorsal int) on commit drop;

  insert into jugadores (user_id, equipo_id, nombre, dorsal, posicion, pie, nacimiento, estado, tipo_equipo, peso_kg, altura_cm)
  values
    (v_user_id, v_equipo_id, 'Marc Vidal', 1, 'Portero', 'Derecho', '1998-03-12', 'activo', '11', 82, 188),
    (v_user_id, v_equipo_id, 'Dani Roca', 13, 'Portero', 'Izquierdo', '2001-07-24', 'activo', '11', 80, 190),
    (v_user_id, v_equipo_id, 'Pol Serrano', 2, 'Lateral derecho', 'Derecho', '1999-01-05', 'activo', '11', 74, 178),
    (v_user_id, v_equipo_id, 'Aleix Ferrer', 3, 'Central', 'Derecho', '1997-11-18', 'activo', '11', 81, 186),
    (v_user_id, v_equipo_id, 'Bruno Casas', 4, 'Central', 'Izquierdo', '2000-05-02', 'activo', '11', 79, 184),
    (v_user_id, v_equipo_id, 'Nil Prats', 5, 'Lateral izquierdo', 'Izquierdo', '1998-09-30', 'activo', '11', 73, 176),
    (v_user_id, v_equipo_id, 'Toni Vega', 15, 'Central', 'Derecho', '2002-02-14', 'activo', '11', 78, 183),
    (v_user_id, v_equipo_id, 'Marc Puig', 6, 'Mediocampista', 'Derecho', '1999-06-21', 'activo', '11', 71, 175),
    (v_user_id, v_equipo_id, 'Oriol Camps', 8, 'Mediocampista', 'Derecho', '2000-12-09', 'activo', '11', 72, 177),
    (v_user_id, v_equipo_id, 'Gerard Mas', 14, 'Mediocampista', 'Izquierdo', '2001-04-17', 'activo', '11', 70, 173),
    (v_user_id, v_equipo_id, 'Xavi Soler', 10, 'Mediapunta', 'Izquierdo', '1998-08-08', 'activo', '11', 69, 172),
    (v_user_id, v_equipo_id, 'Jan Riera', 16, 'Mediocampista', 'Derecho', '2003-01-27', 'activo', '11', 68, 174),
    (v_user_id, v_equipo_id, 'Biel Torres', 7, 'Extremo', 'Derecho', '2000-03-03', 'activo', '11', 67, 171),
    (v_user_id, v_equipo_id, 'Sergi Font', 11, 'Extremo', 'Izquierdo', '1999-10-11', 'activo', '11', 66, 169),
    (v_user_id, v_equipo_id, 'Arnau Costa', 9, 'Delantero centro', 'Derecho', '1997-05-25', 'activo', '11', 77, 182),
    (v_user_id, v_equipo_id, 'Iker Duran', 17, 'Delantero centro', 'Izquierdo', '2001-09-19', 'activo', '11', 75, 180),
    (v_user_id, v_equipo_id, 'Marc Bosch', 12, 'Lateral derecho', 'Derecho', '2002-07-07', 'activo', '11', 73, 177),
    (v_user_id, v_equipo_id, 'Eric Domenech', 18, 'Extremo', 'Derecho', '2003-11-30', 'activo', '11', 68, 170);

  insert into tmp_jug (id, dorsal)
  select id, dorsal from jugadores where equipo_id = v_equipo_id;

  -- 3) Partidos (6 jugados) -------------------------------------
  insert into partidos (user_id, equipo_id, fecha, rival, local_visitante, formacion, gf, gc, estado)
  values
    (v_user_id, v_equipo_id, current_date - 35, 'UE Sant Martí', 'local', '433', 3, 1, 'finalizado'),
    (v_user_id, v_equipo_id, current_date - 28, 'CF Vallmora', 'visitante', '433', 1, 1, 'finalizado'),
    (v_user_id, v_equipo_id, current_date - 21, 'AE Montcada', 'local', '4231', 2, 0, 'finalizado'),
    (v_user_id, v_equipo_id, current_date - 14, 'CE Ripollet', 'visitante', '433', 0, 2, 'finalizado'),
    (v_user_id, v_equipo_id, current_date - 7, 'FC Cerdanyola', 'local', '433', 4, 2, 'finalizado'),
    (v_user_id, v_equipo_id, current_date + 6, 'UD Barberà', 'visitante', '433', 0, 0, 'programado');

  -- 4) Convocatoria más reciente ----------------------------------
  insert into convocatorias (user_id, equipo_id, rival, fecha, formacion, titulares, suplentes, hora_partido, hora_convocatoria, lugar)
  select
    v_user_id, v_equipo_id, 'UD Barberà', (current_date + 6)::text, '433',
    (select jsonb_agg(jsonb_build_object('id', j.id, 'nombre', j.nombre, 'dorsal', j.dorsal, 'posicion', j.posicion, 'cat',
        case when j.posicion = 'Portero' then 'POR'
             when j.posicion in ('Lateral derecho','Central','Lateral izquierdo') then 'DEF'
             when j.posicion in ('Mediocampista','Mediapunta') then 'MED'
             else 'DEL' end))
     from (select * from jugadores where equipo_id = v_equipo_id order by dorsal limit 11) j),
    (select jsonb_agg(jsonb_build_object('id', j.id, 'nombre', j.nombre, 'dorsal', j.dorsal, 'posicion', j.posicion, 'cat',
        case when j.posicion = 'Portero' then 'POR'
             when j.posicion in ('Lateral derecho','Central','Lateral izquierdo') then 'DEF'
             when j.posicion in ('Mediocampista','Mediapunta') then 'MED'
             else 'DEL' end))
     from (select * from jugadores where equipo_id = v_equipo_id order by dorsal offset 11 limit 7) j),
    '18:00', '17:00', 'Camp Municipal Demo';

  -- 5) Entrenamientos (últimas 3 semanas, con asistencia) ---------
  insert into entrenamientos (user_id, equipo_id, fecha, objetivo, notas, ejercicios, duracion, asistencia)
  select v_user_id, v_equipo_id, current_date - 25, 'Trabajo táctico colectivo',
    'Buena intensidad, falta pulir la salida de balón.',
    '[{"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
      {"nombre":"Rondo 5vs2 + comodines","categoria":"Posesión","duracion_min":15,"intensidad":"Baja"},
      {"nombre":"Transición 6vs4 con apoyo","categoria":"Transiciones","duracion_min":20,"intensidad":"Media"},
      {"nombre":"Partido condicionado 9vs9","categoria":"Partido","duracion_min":30,"intensidad":"Alta"}]'::jsonb,
    80,
    (select jsonb_object_agg(id, true) from tmp_jug);

  insert into entrenamientos (user_id, equipo_id, fecha, objetivo, notas, ejercicios, duracion, asistencia)
  select v_user_id, v_equipo_id, current_date - 18, 'Trabajo de finalización',
    'Dos jugadores no asistieron por trabajo.',
    '[{"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
      {"nombre":"Finalización ante portero","categoria":"Finalización","duracion_min":20,"intensidad":"Alta"},
      {"nombre":"Definición con pierna débil","categoria":"Finalización","duracion_min":15,"intensidad":"Media"},
      {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}]'::jsonb,
    60,
    (select jsonb_object_agg(id, (dorsal not in (11, 17))) from tmp_jug);

  insert into entrenamientos (user_id, equipo_id, fecha, objetivo, notas, ejercicios, duracion, asistencia)
  select v_user_id, v_equipo_id, current_date - 4, 'Activación pre-partido',
    'Sesión suave de cara al partido del finde.',
    '[{"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
      {"nombre":"Balón parado ofensivo (córners)","categoria":"Balón parado","duracion_min":15,"intensidad":"Media"},
      {"nombre":"Reflejos y blocajes portero","categoria":"Porteros","duracion_min":20,"intensidad":"Media"}]'::jsonb,
    50,
    (select jsonb_object_agg(id, true) from tmp_jug);

  -- 6) Tarjetas -----------------------------------------------
  insert into tarjetas (user_id, equipo_id, jugador_id, tipo, fecha, minuto, motivo)
  select v_user_id, v_equipo_id, id, 'amarilla', (current_date - 21), 63, 'Falta táctica'
  from tmp_jug where dorsal = 4;

  insert into tarjetas (user_id, equipo_id, jugador_id, tipo, fecha, minuto, motivo)
  select v_user_id, v_equipo_id, id, 'amarilla', (current_date - 14), 40, 'Protesta'
  from tmp_jug where dorsal = 8;

  -- 7) Lesión activa (la tabla lesiones no tiene equipo_id) -----
  insert into lesiones (user_id, jugador_id, tipo, zona, gravedad, fecha_inicio, alta)
  select v_user_id, id, 'Muscular', 'Isquiotibial', 'leve', (current_date - 10), false
  from tmp_jug where dorsal = 11;

  update jugadores set estado = 'lesionado'
  where equipo_id = v_equipo_id and dorsal = 11;

end $$;
