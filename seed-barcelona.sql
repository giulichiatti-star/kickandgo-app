-- ================================================================
-- SEED FC BARCELONA — La Liga EA Sports 2024-25
-- KickAndGo Demo Data
-- ================================================================
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → Authentication → Users
-- 2. Copia tu User ID (el UUID largo) y pégalo abajo donde dice TU-USER-ID-AQUI
-- 3. Abre el SQL Editor de Supabase, pega este archivo y pulsa RUN
-- ================================================================

DO $$
DECLARE
  uid UUID := 'TU-USER-ID-AQUI';  -- ← REEMPLAZA ESTE VALOR
  jid_stegen    UUID;
  jid_pena      UUID;
  jid_szczesny  UUID;
  jid_araujo    UUID;
  jid_kounde    UUID;
  jid_cubarsi   UUID;
  jid_inigo     UUID;
  jid_balde     UUID;
  jid_christensen UUID;
  jid_pedri     UUID;
  jid_gavi      UUID;
  jid_dejong    UUID;
  jid_olmo      UUID;
  jid_fermin    UUID;
  jid_casado    UUID;
  jid_raphinha  UUID;
  jid_yamal     UUID;
  jid_ferran    UUID;
  jid_lewa      UUID;
  jid_pau       UUID;
BEGIN

-- ================================================================
-- 1. PERFIL DEL CLUB
-- ================================================================
UPDATE profiles SET
  club_nombre  = 'FC Barcelona',
  tipo_equipo  = '11',
  competicion  = '{
    "nombre": "La Liga EA Sports 2024-25",
    "tabla": [
      {"pos":1,"ico":"🔵","nom":"FC Barcelona","pj":38,"pg":27,"pe":7,"pp":4,"gf":79,"gc":34,"pts":88,"forma":["V","V","V","E","V"],"miEquipo":true},
      {"pos":2,"ico":"⚪","nom":"Real Madrid","pj":38,"pg":23,"pe":8,"pp":7,"gf":74,"gc":43,"pts":77,"forma":["V","D","V","V","E"]},
      {"pos":3,"ico":"🔴","nom":"Atlético Madrid","pj":38,"pg":21,"pe":8,"pp":9,"gf":65,"gc":38,"pts":71,"forma":["V","V","D","V","D"]},
      {"pos":4,"ico":"🔴","nom":"Athletic Club","pj":38,"pg":19,"pe":7,"pp":12,"gf":57,"gc":44,"pts":64,"forma":["E","V","V","D","V"]},
      {"pos":5,"ico":"🟡","nom":"Villarreal CF","pj":38,"pg":18,"pe":8,"pp":12,"gf":60,"gc":50,"pts":62,"forma":["V","D","V","E","D"]},
      {"pos":6,"ico":"🔵","nom":"Real Sociedad","pj":38,"pg":16,"pe":9,"pp":13,"gf":52,"gc":47,"pts":57,"forma":["D","V","D","V","D"]},
      {"pos":7,"ico":"🟢","nom":"Real Betis","pj":38,"pg":15,"pe":11,"pp":12,"gf":54,"gc":51,"pts":56,"forma":["E","V","D","V","E"]},
      {"pos":8,"ico":"🔵","nom":"Rayo Vallecano","pj":38,"pg":14,"pe":8,"pp":16,"gf":45,"gc":53,"pts":50,"forma":["D","V","D","E","V"]},
      {"pos":9,"ico":"🔴","nom":"Osasuna","pj":38,"pg":13,"pe":10,"pp":15,"gf":48,"gc":54,"pts":49,"forma":["E","D","V","D","V"]},
      {"pos":10,"ico":"🔵","nom":"Celta Vigo","pj":38,"pg":13,"pe":8,"pp":17,"gf":50,"gc":58,"pts":47,"forma":["V","E","D","V","D"]},
      {"pos":11,"ico":"🔵","nom":"Girona FC","pj":38,"pg":13,"pe":6,"pp":19,"gf":48,"gc":62,"pts":45,"forma":["D","V","D","D","E"]},
      {"pos":12,"ico":"🔴","nom":"RCD Mallorca","pj":38,"pg":12,"pe":8,"pp":18,"gf":38,"gc":54,"pts":44,"forma":["D","E","V","D","D"]},
      {"pos":13,"ico":"🔵","nom":"Getafe CF","pj":38,"pg":11,"pe":10,"pp":17,"gf":37,"gc":52,"pts":43,"forma":["E","D","V","E","D"]},
      {"pos":14,"ico":"🟡","nom":"UD Las Palmas","pj":38,"pg":11,"pe":8,"pp":19,"gf":40,"gc":58,"pts":41,"forma":["D","D","E","V","D"]},
      {"pos":15,"ico":"⚪","nom":"CD Leganés","pj":38,"pg":10,"pe":9,"pp":19,"gf":36,"gc":57,"pts":39,"forma":["D","E","D","V","D"]},
      {"pos":16,"ico":"⚪","nom":"Sevilla FC","pj":38,"pg":9,"pe":10,"pp":19,"gf":40,"gc":61,"pts":37,"forma":["E","D","D","V","D"]},
      {"pos":17,"ico":"🟠","nom":"Valencia CF","pj":38,"pg":9,"pe":8,"pp":21,"gf":37,"gc":64,"pts":35,"forma":["D","D","E","D","V"]},
      {"pos":18,"ico":"🟣","nom":"Real Valladolid","pj":38,"pg":7,"pe":8,"pp":23,"gf":31,"gc":70,"pts":29,"forma":["D","D","D","E","D"]},
      {"pos":19,"ico":"🔵","nom":"RCD Espanyol","pj":38,"pg":6,"pe":8,"pp":24,"gf":33,"gc":72,"pts":26,"forma":["D","D","D","D","E"]},
      {"pos":20,"ico":"🔵","nom":"Deportivo Alavés","pj":38,"pg":5,"pe":9,"pp":24,"gf":29,"gc":74,"pts":24,"forma":["D","D","D","E","D"]}
    ],
    "goleadores": [
      {"ini":"RA","nom":"Raphinha","club":"FC Barcelona","goles":26,"asist":15,"pj":36,"miEquipo":true},
      {"ini":"KM","nom":"Kylian Mbappé","club":"Real Madrid","goles":21,"asist":8,"pj":34},
      {"ini":"RL","nom":"Robert Lewandowski","club":"FC Barcelona","goles":18,"asist":7,"pj":35,"miEquipo":true},
      {"ini":"AG","nom":"Antoine Griezmann","club":"Atlético Madrid","goles":16,"asist":6,"pj":33},
      {"ini":"LY","nom":"Lamine Yamal","club":"FC Barcelona","goles":12,"asist":18,"pj":37,"miEquipo":true},
      {"ini":"AI","nom":"Ayoze Ibáñez","club":"Villarreal CF","goles":15,"asist":4,"pj":35},
      {"ini":"DO","nom":"Dani Olmo","club":"FC Barcelona","goles":11,"asist":9,"pj":29,"miEquipo":true},
      {"ini":"IM","nom":"Imanol Sarriegi","club":"Athletic Club","goles":13,"asist":3,"pj":32},
      {"ini":"FL","nom":"Fermín López","club":"FC Barcelona","goles":9,"asist":6,"pj":30,"miEquipo":true},
      {"ini":"AS","nom":"Alexander Sørloth","club":"Villarreal CF","goles":12,"asist":2,"pj":30}
    ],
    "calendario_jugado": [],
    "proximas_fechas": []
  }'::jsonb
WHERE id = uid;

-- ================================================================
-- 2. PLANTILLA — 20 JUGADORES
-- ================================================================
DELETE FROM jugadores WHERE user_id = uid;

INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 1,  'Marc ter Stegen',      'Portero',            'Derecho',    'lesion',  '11') RETURNING id INTO jid_stegen;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 13, 'Iñaki Peña',           'Portero',            'Derecho',    'activo',  '11') RETURNING id INTO jid_pena;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 25, 'Wojciech Szczęsny',    'Portero',            'Derecho',    'activo',  '11') RETURNING id INTO jid_szczesny;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 4,  'Ronald Araújo',        'Defensa Central',    'Derecho',    'activo',  '11') RETURNING id INTO jid_araujo;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 23, 'Jules Koundé',         'Lateral Derecho',    'Derecho',    'activo',  '11') RETURNING id INTO jid_kounde;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 34, 'Pau Cubarsí',          'Defensa Central',    'Izquierdo',  'activo',  '11') RETURNING id INTO jid_cubarsi;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 5,  'Iñigo Martínez',       'Defensa Central',    'Izquierdo',  'activo',  '11') RETURNING id INTO jid_inigo;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 3,  'Alejandro Baldé',      'Lateral Izquierdo',  'Izquierdo',  'activo',  '11') RETURNING id INTO jid_balde;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 15, 'Andreas Christensen',  'Defensa Central',    'Derecho',    'activo',  '11') RETURNING id INTO jid_christensen;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 8,  'Pedri',                'Mediocampista',      'Derecho',    'activo',  '11') RETURNING id INTO jid_pedri;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 6,  'Gavi',                 'Mediocampista',      'Izquierdo',  'activo',  '11') RETURNING id INTO jid_gavi;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 21, 'Frenkie de Jong',      'Mediocampista',      'Derecho',    'activo',  '11') RETURNING id INTO jid_dejong;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 20, 'Dani Olmo',            'Mediapunta',         'Derecho',    'activo',  '11') RETURNING id INTO jid_olmo;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 16, 'Fermín López',         'Mediocampista',      'Derecho',    'activo',  '11') RETURNING id INTO jid_fermin;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 17, 'Marc Casadó',          'Pivote',             'Derecho',    'activo',  '11') RETURNING id INTO jid_casado;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 11, 'Raphinha',             'Extremo Izquierdo',  'Derecho',    'activo',  '11') RETURNING id INTO jid_raphinha;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 27, 'Lamine Yamal',         'Extremo Derecho',    'Izquierdo',  'activo',  '11') RETURNING id INTO jid_yamal;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 7,  'Ferran Torres',        'Delantero',          'Izquierdo',  'activo',  '11') RETURNING id INTO jid_ferran;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 9,  'Robert Lewandowski',   'Delantero Centro',   'Derecho',    'activo',  '11') RETURNING id INTO jid_lewa;
INSERT INTO jugadores (user_id, dorsal, nombre, posicion, pie, estado, tipo_equipo)
VALUES (uid, 19, 'Pau Víctor',           'Delantero',          'Derecho',    'activo',  '11') RETURNING id INTO jid_pau;

-- ================================================================
-- 3. PARTIDOS LA LIGA 2024-25 (38 jornadas)
-- ================================================================
DELETE FROM partidos WHERE user_id = uid;

INSERT INTO partidos (user_id, fecha, rival, local_visitante, formacion, gf, gc, estado, notas, analisis_ia) VALUES
-- AGOSTO 2024
(uid,'2024-08-17','Real Valencia CF',           'local',     '433',3,1,'finalizado','[]','Victoria sólida. Raphinha y Lewandowski lideraron el ataque con dos goles cada uno.'),
(uid,'2024-08-24','Rayo Vallecano',             'visitante', '433',2,1,'finalizado','[]','Trabajo colectivo impecable. Primer punto fuera de casa del curso.'),
(uid,'2024-08-31','Real Valladolid',            'local',     '433',7,0,'finalizado','[]','Actuación demoledora. Mejor resultado de la temporada. Raphinha con hat-trick.'),
-- SEPTIEMBRE 2024
(uid,'2024-09-01','Real Madrid',                'visitante', '433',0,2,'finalizado','[]','Derrota en el Bernabéu. El equipo no encontró espacios ante una defensa muy cerrada.'),
(uid,'2024-09-14','Rayo Vallecano',             'local',     '433',2,2,'finalizado','[]','Empate frustrante en casa. Fallamos un penalti en el 89.'),
(uid,'2024-09-21','Getafe CF',                  'local',     '433',2,0,'finalizado','[]','Victoria trabajada contra un rival muy físico. Peña estuvo seguro bajo palos.'),
(uid,'2024-09-28','Girona FC',                  'visitante', '433',4,1,'finalizado','[]','Gran partido fuera de casa. Lamine Yamal con dos asistencias brillantes.'),
-- OCTUBRE 2024
(uid,'2024-10-05','Sevilla FC',                 'local',     '4231',4,0,'finalizado','[]','Partido dominado de principio a fin. Nuestro mejor fútbol de la temporada.'),
(uid,'2024-10-20','Real Madrid',                'local',     '433',4,0,'finalizado','[]','EL CLÁSICO. Noche histórica en Montjuïc. Hat-trick de Raphinha. Temporada marcada por este resultado.'),
(uid,'2024-10-26','Osasuna',                    'visitante', '433',4,2,'finalizado','[]','Remontada en Pamplona. Fuimos 0-2 abajo y reaccionamos con carácter.'),
-- NOVIEMBRE 2024
(uid,'2024-11-02','RCD Mallorca',               'local',     '433',5,1,'finalizado','[]','Goleada en casa. Todos los delanteros anotaron. Gran espectáculo.'),
(uid,'2024-11-10','Athletic Club',              'visitante', '433',1,0,'finalizado','[]','Victoria de mérito en San Mamés. Gol de Lewandowski en el 77.'),
(uid,'2024-11-23','Celta Vigo',                 'local',     '433',3,1,'finalizado','[]','Tres puntos importantes. Equipo ordenado y efectivo.'),
(uid,'2024-11-30','Real Sociedad',              'visitante', '433',1,2,'finalizado','[]','Derrota inesperada en Anoeta. El equipo no estuvo al nivel habitual.'),
-- DICIEMBRE 2024
(uid,'2024-12-07','UD Las Palmas',              'local',     '433',3,0,'finalizado','[]','Victoria cómoda. Olmo y Fermín con grandes actuaciones en mediocampo.'),
(uid,'2024-12-14','Valencia CF',               'visitante', '433',5,1,'finalizado','[]','Demolición en Mestalla. Raphinha marcó dos y dio dos asistencias.'),
(uid,'2024-12-21','Athletic Club',              'local',     '433',5,2,'finalizado','[]','Partido vibrante. 2-2 en el descanso y reacción espectacular en la segunda parte.'),
-- ENERO 2025
(uid,'2025-01-04','CD Leganés',                'visitante', '433',5,0,'finalizado','[]','Goleada histórica en Butarque. Temporada perfecta de visitante.'),
(uid,'2025-01-11','Deportivo Alavés',           'local',     '433',4,0,'finalizado','[]','Cuatro goles en 45 minutos. Eficiencia máxima.'),
(uid,'2025-01-18','Real Betis',                 'local',     '433',1,1,'finalizado','[]','Empate en casa. El Betis fue un rival muy incómodo con su juego largo.'),
(uid,'2025-01-25','CD Leganés',                'local',     '433',2,0,'finalizado','[]','Doble victoria sobre el Leganés en la temporada. Cubarsí sobresaliente.'),
-- FEBRERO 2025
(uid,'2025-02-01','Deportivo Alavés',           'visitante', '433',2,0,'finalizado','[]','Sin conceder fuera de casa. Koundé y Baldé dominaron sus bandas.'),
(uid,'2025-02-08','Atlético Madrid',            'local',     '4231',2,1,'finalizado','[]','Victoria sufrida ante el Atleti. Peña paró un penalti en el 83.'),
(uid,'2025-02-15','Celta Vigo',                'visitante', '433',1,1,'finalizado','[]','Empate en Balaídos. Muy buen ambiente y partido igualado.'),
(uid,'2025-02-22','Real Betis',                 'local',     '433',2,0,'finalizado','[]','Dos buenos partidos ante el Betis. Efectividad notable.'),
-- MARZO 2025
(uid,'2025-03-01','RCD Mallorca',              'visitante', '433',1,0,'finalizado','[]','Gol en propia puerta en el 61. Partido muy competido.'),
(uid,'2025-03-08','Osasuna',                    'local',     '433',3,1,'finalizado','[]','Goles de Lamine (x2) y Lewandowski. Espectáculo total.'),
(uid,'2025-03-15','Atlético Madrid',            'visitante', '433',1,2,'finalizado','[]','Derrota en el Metropolitano. Griezmann marcó dos en diez minutos.'),
(uid,'2025-03-22','Girona FC',                  'local',     '4231',4,0,'finalizado','[]','Actuación perfecta. Girona sin opciones en todo el partido.'),
-- ABRIL 2025
(uid,'2025-04-05','RCD Espanyol',              'local',     '433',4,0,'finalizado','[]','Derby catalán dominado. Yamal con actuación magistral.'),
(uid,'2025-04-13','Rayo Vallecano',             'local',     '433',2,0,'finalizado','[]','Victoria tranquila. El equipo maniobró con madurez.'),
(uid,'2025-04-19','RCD Espanyol',              'visitante', '433',2,0,'finalizado','[]','Segundo derby ganado. Temporada perfecta ante el Espanyol.'),
(uid,'2025-04-26','Real Sociedad',              'local',     '4231',1,0,'finalizado','[]','Gol de Fermín en el 54. Tres puntos clave para el título.'),
-- MAYO 2025
(uid,'2025-05-03','Villarreal CF',             'visitante', '433',2,2,'finalizado','[]','Empate en La Cerámica. El título cada vez más cerca.'),
(uid,'2025-05-10','Valencia CF',               'local',     '433',3,1,'finalizado','[]','Tres puntos en casa. Lewandowski llegó a 18 goles en liga.'),
(uid,'2025-05-17','Real Valladolid',           'visitante', '433',3,0,'finalizado','[]','Goleada en Zorrilla. El título matemáticamente cerca.'),
(uid,'2025-05-24','Sevilla FC',                'visitante', '433',1,0,'finalizado','[]','Gol de Raphinha en el 67. Un punto más hacia el título.'),
(uid,'2025-05-31','Getafe CF',                 'visitante', '433',2,1,'finalizado','[]','CAMPEONES DE LA LIGA EA SPORTS 2024-25. Último partido. Final con celebración histórica en Getafe.'),
(uid,'2025-05-03','Villarreal CF',             'local',     '433',2,1,'finalizado','[]','Victoria en casa ante el Villarreal. Goles de Ferran y Lewandowski.');

-- ================================================================
-- 4. TARJETAS AMARILLAS Y ROJAS
-- ================================================================
DELETE FROM tarjetas WHERE user_id = uid;

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2024-09-14', 34, 'Falta sobre el mediocampista rival' FROM jugadores WHERE user_id = uid AND nombre = 'Gavi';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2024-10-05', 67, 'Protesta al árbitro' FROM jugadores WHERE user_id = uid AND nombre = 'Gavi';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2024-11-10', 55, 'Entrada tardía' FROM jugadores WHERE user_id = uid AND nombre = 'Ronald Araújo';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'roja',     '2024-11-30', 72, 'Segunda amarilla — entrada por detrás' FROM jugadores WHERE user_id = uid AND nombre = 'Ronald Araújo';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2024-12-21', 45, 'Falta táctica en transición' FROM jugadores WHERE user_id = uid AND nombre = 'Marc Casadó';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2025-01-04', 30, 'Reclamación al colegiado' FROM jugadores WHERE user_id = uid AND nombre = 'Raphinha';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2025-02-08', 88, 'Tiempo de juego — simulación' FROM jugadores WHERE user_id = uid AND nombre = 'Ferran Torres';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2025-03-15', 41, 'Falta sobre Griezmann' FROM jugadores WHERE user_id = uid AND nombre = 'Frenkie de Jong';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2025-04-05', 19, 'Entrada fuerte en el derby' FROM jugadores WHERE user_id = uid AND nombre = 'Iñigo Martínez';

INSERT INTO tarjetas (user_id, jugador_id, tipo, fecha, minuto, motivo)
SELECT uid, id, 'amarilla', '2025-05-03', 78, 'Falta táctica para frenar contraataque' FROM jugadores WHERE user_id = uid AND nombre = 'Marc Casadó';

-- ================================================================
-- 5. ENTRENAMIENTOS (10 sesiones)
-- ================================================================
DELETE FROM entrenamientos WHERE user_id = uid;

INSERT INTO entrenamientos (user_id, fecha, objetivo, notas, ejercicios, duracion, asistencia) VALUES
(uid, '2024-08-12', 'Puesta a punto pretemporada', 'Primera sesión del curso con el grupo completo.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Rondo 5vs2 + comodines","categoria":"Posesión","duracion_min":20,"intensidad":"Baja"},
  {"nombre":"Posesión 4vs4 + apoyos laterales","categoria":"Posesión","duracion_min":25,"intensidad":"Media"},
  {"nombre":"Partido condicionado 9vs9","categoria":"Partido","duracion_min":35,"intensidad":"Alta"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 105, '{}'::jsonb),

(uid, '2024-08-14', 'Automatismos 4-3-3', 'Trabajo táctico posicional. Énfasis en línea de tres y presión tras pérdida.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Presión tras pérdida (8 segundos)","categoria":"Presión","duracion_min":30,"intensidad":"Alta"},
  {"nombre":"Transición 6vs4 con apoyo","categoria":"Transiciones","duracion_min":25,"intensidad":"Alta"},
  {"nombre":"Finalización ante portero","categoria":"Finalización","duracion_min":20,"intensidad":"Alta"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 100, '{}'::jsonb),

(uid, '2024-09-10', 'Preparación vs Getafe (J3)', 'Sesión táctica enfocada en romper bloque bajo.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Posesión 4vs4 + apoyos laterales","categoria":"Posesión","duracion_min":20,"intensidad":"Media"},
  {"nombre":"Balón parado ofensivo (córners)","categoria":"Balón parado","duracion_min":20,"intensidad":"Media"},
  {"nombre":"Finalización con pierna débil","categoria":"Finalización","duracion_min":15,"intensidad":"Media"},
  {"nombre":"Partido condicionado 9vs9","categoria":"Partido","duracion_min":30,"intensidad":"Alta"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 110, '{}'::jsonb),

(uid, '2024-10-15', 'Preparación CLÁSICO vs Real Madrid', 'Análisis rival. Trabajo defensivo y transiciones rápidas. Flick insistió en la presión alta.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Transición 6vs4 con apoyo","categoria":"Transiciones","duracion_min":25,"intensidad":"Alta"},
  {"nombre":"Presión tras pérdida (8 segundos)","categoria":"Presión","duracion_min":30,"intensidad":"Alta"},
  {"nombre":"Finalización ante portero","categoria":"Finalización","duracion_min":25,"intensidad":"Alta"},
  {"nombre":"Balón parado ofensivo (córners)","categoria":"Balón parado","duracion_min":15,"intensidad":"Media"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 120, '{}'::jsonb),

(uid, '2024-10-17', 'Recuperación post Osasuna', 'Sesión regenerativa. Solo jugaron titulares del sábado.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Rondo 5vs2 + comodines","categoria":"Posesión","duracion_min":20,"intensidad":"Baja"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":20,"intensidad":"Baja"}
]'::jsonb, 55, '{}'::jsonb),

(uid, '2024-12-10', 'Físico intensivo — microciclo de carga', 'Con la ventana navideña, semana de trabajo físico exigente.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Presión tras pérdida (8 segundos)","categoria":"Presión","duracion_min":35,"intensidad":"Alta"},
  {"nombre":"Transición 6vs4 con apoyo","categoria":"Transiciones","duracion_min":30,"intensidad":"Alta"},
  {"nombre":"Partido condicionado 9vs9","categoria":"Partido","duracion_min":40,"intensidad":"Alta"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 130, '{}'::jsonb),

(uid, '2025-01-07', 'Inicio segunda vuelta — Reset táctico', 'Flick introduciendo variantes 4-2-3-1 para segunda vuelta.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Rondo 5vs2 + comodines","categoria":"Posesión","duracion_min":20,"intensidad":"Baja"},
  {"nombre":"Posesión 4vs4 + apoyos laterales","categoria":"Posesión","duracion_min":25,"intensidad":"Media"},
  {"nombre":"Transición 6vs4 con apoyo","categoria":"Transiciones","duracion_min":25,"intensidad":"Alta"},
  {"nombre":"Finalización ante portero","categoria":"Finalización","duracion_min":20,"intensidad":"Alta"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 115, '{}'::jsonb),

(uid, '2025-02-25', 'Preparación vs Betis (J25)', 'Trabajo de banda y centros laterales. Koundé con protocolo de recuperación.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Reflejos y blocajes portero","categoria":"Porteros","duracion_min":20,"intensidad":"Media"},
  {"nombre":"Posesión 4vs4 + apoyos laterales","categoria":"Posesión","duracion_min":20,"intensidad":"Media"},
  {"nombre":"Finalización ante portero","categoria":"Finalización","duracion_min":25,"intensidad":"Alta"},
  {"nombre":"Balón parado ofensivo (córners)","categoria":"Balón parado","duracion_min":15,"intensidad":"Media"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 105, '{}'::jsonb),

(uid, '2025-04-22', 'Semana de título — gestión de cargas', 'El equipo a 3 victorias del título. Gestión inteligente de minutos y cargas.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Rondo 5vs2 + comodines","categoria":"Posesión","duracion_min":20,"intensidad":"Baja"},
  {"nombre":"Finalización ante portero","categoria":"Finalización","duracion_min":20,"intensidad":"Media"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"}
]'::jsonb, 70, '{}'::jsonb),

(uid, '2025-05-28', 'Último entrenamiento de Liga — celebración', 'Sesión abierta a medios. El equipo ya era campeón. Ambiente festivo.', '[
  {"nombre":"Calentamiento dinámico con balón","categoria":"Calentamiento","duracion_min":15,"intensidad":"Baja"},
  {"nombre":"Rondo 5vs2 + comodines","categoria":"Posesión","duracion_min":20,"intensidad":"Baja"},
  {"nombre":"Partido condicionado 9vs9","categoria":"Partido","duracion_min":30,"intensidad":"Media"},
  {"nombre":"Estiramientos y vuelta a la calma","categoria":"Calentamiento","duracion_min":10,"intensidad":"Baja"}
]'::jsonb, 75, '{}'::jsonb);

-- ================================================================
-- FIN DEL SEED
-- ================================================================
RAISE NOTICE '✅ Seed FC Barcelona completado correctamente para el usuario %', uid;

END $$;
