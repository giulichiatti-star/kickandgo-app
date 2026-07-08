-- ============================================================
-- EJERCICIOS BASE — extender ejercicios_biblioteca
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Nuevas columnas (aditivo, no rompe existente)
alter table ejercicios_biblioteca
  add column if not exists imagen_url text,
  add column if not exists complejidad text,
  add column if not exists competitividad text,
  add column if not exists tags_ofensivos text[] default '{}',
  add column if not exists tags_defensivos text[] default '{}',
  add column if not exists video_url text;

-- 2. Índice GIN para búsqueda por tags (rápido con arrays)
create index if not exists idx_ejercicios_tags_of on ejercicios_biblioteca using gin (tags_ofensivos);
create index if not exists idx_ejercicios_tags_def on ejercicios_biblioteca using gin (tags_defensivos);

-- 3. Política RLS: cualquier usuario autenticado puede LEER ejercicios base (es_base=true)
--    Los propios (es_base=false) siguen con la política de user_id existente.
drop policy if exists "lectura_publica_ejercicios_base" on ejercicios_biblioteca;
create policy "lectura_publica_ejercicios_base" on ejercicios_biblioteca
  for select
  to authenticated
  using (es_base = true and activo = true);

-- 4. Seed: 4 ejercicios de "Partidos reducidos" con imágenes en /ejercicios/pr-01..04.jpg
insert into ejercicios_biblioteca
  (nombre, categoria, descripcion, complejidad, competitividad, duracion_min, intensidad,
   imagen_url, tags_ofensivos, tags_defensivos, es_base, activo, orden)
values
(
  'Enfrentamientos, juegos de posición complejos',
  'Partidos reducidos',
  'Juego posicional + transiciones. Iniciarán amarillos jugando y si consiguen dar un número de pases marcados podrán realizar un cambio de orientación buscando a uno de los 2 extremos para una transición rápida en superioridad. Cada acción de ataque volvemos a empezar en el espacio y siempre empieza el equipo que ha recibido el ataque, a no ser que haya marcado gol. Cada jugador trabaja en su zona asignada rotando por posiciones.',
  '5 pases para progresar / Limitación de toques (3 toques).',
  'Gol en portería = 1 punto.',
  20, 'Media',
  '/ejercicios/pr-01.jpg',
  array['Amplitud ofensiva','Cambios de orientación','Pases filtrados','Pase y circulación','Tiro','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura']::text[],
  true, true, 101
),
(
  'Partidos reducidos con estación de fuerza',
  'Partidos reducidos',
  'Partido con dos espacios y estación de trabajo de fuerza intermedia. El objetivo de cada equipo será finalizar en la miniportería rival. Cada vez que un equipo encaje un gol, uno de sus jugadores deberá abandonar el recuadro, completar la estación de fuerza y posteriormente incorporarse al otro recuadro para reforzar a sus compañeros. Esta dinámica genera variación constante en la superioridad numérica.',
  'Se tendrá que defender 3 metros alejados de la portería.',
  'Perderá el equipo que se quede sin jugadores en uno de los dos espacios.',
  25, 'Alta',
  '/ejercicios/pr-02.jpg',
  array['Tercer hombre','Regate','Pared','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Temporización','Interceptación','Presión tras pérdida']::text[],
  true, true, 102
),
(
  'Enfrentamientos, partidos reducidos con transición',
  'Partidos reducidos',
  'La transición defensiva es la clave: cuando robe el equipo azul, el equipo amarillo no realizará presión tras pérdida en zona adelantada (queremos que se produzca el ataque por parte del equipo robador). En caso de robo del equipo defensivo que no haya podido conectar con jugadores exteriores, meteremos otro balón para que se produzca el segundo ataque igualmente.',
  'Limitaremos el tiempo para poder atacar.',
  'Contabilizaremos los goles de cada equipo.',
  20, 'Alta',
  '/ejercicios/pr-03.jpg',
  array['Regate','Último pase','Pared','Pase y circulación','Tiro','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Temporización','Anticipación','Basculaciones','Interceptación','Cobertura','Vigilancias']::text[],
  true, true, 103
),
(
  'Partidos reducidos, posesiones con franjas',
  'Partidos reducidos',
  'El objetivo del equipo ofensivo será dar un mínimo de pases para hacer gol, mientras que los jugadores defensivos tratarán de robar el balón para conectar con sus compañeros que se encuentran en la franja central. Si esto ocurre, una vez los jugadores de la franja central reciben el balón, conectarán con el grupo del otro espacio y ahora el equipo defensivo será el que ha perdido la pelota, tratando de robar el balón.',
  'El equipo que roba el balón también podrá hacer gol.',
  'Perderá el equipo que reciba más goles tras las dos series.',
  20, 'Media',
  '/ejercicios/pr-04.jpg',
  array['Amplitud ofensiva','Pase y circulación','Tiro','Desmarques']::text[],
  array['Entrada','Acoso','Basculaciones','Presión tras pérdida']::text[],
  true, true, 104
)
on conflict do nothing;
