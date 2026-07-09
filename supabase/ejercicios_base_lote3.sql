-- ============================================================
-- EJERCICIOS BASE — Partidos reducidos (LOTE 3: pr-24 a pr-34) — 11 finales
-- Con esto quedan las 34 tareas cargadas de "Partidos reducidos".
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

insert into ejercicios_biblioteca
  (nombre, categoria, descripcion, complejidad, competitividad, duracion_min, intensidad,
   imagen_url, tags_ofensivos, tags_defensivos, es_base, activo, orden)
values
(
  'Partidos reducidos — 3 equipos con comodín rotativo',
  'Partidos reducidos',
  'Competición entre 3 equipos. 2 equipos juegan en el espacio y uno actúa de comodín. Los partidos se juegan a un gol y empieza siempre el portero del equipo que entra al espacio. El comodín genera superioridad, pero no puede hacer gol.',
  'Limitación técnica de 2 toques · Gol válido al primer toque.',
  'Gol en portería = 1 punto · Gol con el comodín de fondo = 2 puntos.',
  22, 'Alta',
  '/ejercicios/pr-24.jpg',
  array['Tercer hombre','Regate','Descargas','Pared','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 124
),
(
  'Partidos reducidos — 3 equipos, 2 goles se queda jugando',
  'Partidos reducidos',
  'Competición entre 3 equipos. 2 juegan en el espacio con la regla de que el equipo que haga 2 goles se queda jugando y el otro sale a actuar de comodín. Si transcurrido un tiempo (2''aprox) ningún equipo ha metido 2 goles, saldrá el que más tiempo lleve jugando dentro. El equipo por fuera solo da apoyo en los laterales.',
  'Gol válido al primer toque · Marcaje individual.',
  'Gol en portería = 1 punto.',
  22, 'Alta',
  '/ejercicios/pr-25.jpg',
  array['Regate','Remate','Pase y circulación','Tiro','Cobertura de balón','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Despejes','Basculaciones','Interceptación','Cobertura']::text[],
  true, true, 125
),
(
  'Partidos reducidos — 4 equipos en 3 espacios',
  'Partidos reducidos',
  'Modo competición entre 4 equipos con 3 espacios diferentes. 2 equipos se enfrentan en el espacio principal y 2 equipos en los 2 espacios pequeños tal como se aprecia en la imagen. El comodín genera superioridad y no puede hacer gol.',
  'Gol válido tras regate.',
  'Gol en portería = 1 punto · Equipo ganador sube de categoría.',
  25, 'Alta',
  '/ejercicios/pr-26.jpg',
  array['Regate','Pases filtrados','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 126
),
(
  'Partidos reducidos — 3 divisiones con condicionantes',
  'Partidos reducidos',
  'Partidos reducidos divididos en 3 campos con diferentes condicionantes: 1ª división — partido reducido con porterías grandes y porteros. 2ª división — partido en campo con 2 miniporterías. 3ª división — juego de posesión con el objetivo de que cada 8 pases = 1 punto. Los partidos pueden durar entre 1'' o 2''.',
  'Gol válido al primer toque.',
  'Gol en portería = 1 punto · Equipo ganador sube de categoría.',
  25, 'Media',
  '/ejercicios/pr-27.jpg',
  array['Regate','Pases filtrados','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 127
),
(
  'Partidos reducidos — jugadores dentro y fuera por goles',
  'Partidos reducidos',
  'Competición entre 3 equipos. 2 equipos juegan por dentro con los siguientes condicionantes: el jugador que pierda el balón sale a situarse por fuera de comodín; si un equipo hace gol recupera a 1 jugador de fuera; si un equipo pierde a todos sus jugadores pierde el partido. El equipo que no juega realiza trabajo con el preparador físico.',
  'Gol válido al primer toque · Finalizar en menos de 4 pases.',
  'Gol en portería = 1 punto.',
  22, 'Alta',
  '/ejercicios/pr-28.jpg',
  array['Regate','Amplitud ofensiva','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 128
),
(
  'Partidos reducidos — 3 equipos todos contra todos',
  'Partidos reducidos',
  'Partido reducido entre 3 equipos en modo competición. Cada serie se enfrentarán 2 equipos y jugarán todos contra todos. El equipo que está fuera realiza trabajo con el preparador físico.',
  'Gol válido al primer toque · Finalizar en menos de 4 pases.',
  'Gol en portería = 1 punto.',
  20, 'Alta',
  '/ejercicios/pr-29.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 129
),
(
  'Enfrentamientos, partidos reducidos — pierna no dominante',
  'Partidos reducidos',
  'El juego se inicia con un pase de un jugador exterior (tendrá su orden) a un jugador interior de su equipo para intentar hacer gol en cualquiera de las 2 porterías. Los balones se introducen cuando el balón anterior ha salido del recuadro o ha habido gol. Los jugadores exteriores que ya no tengan balón podrán hacer de apoyos (2 toques) con su equipo.',
  'Sólo valdrá el gol con la pierna no dominante.',
  'Ganará el equipo que gane más minipartidos.',
  20, 'Media',
  '/ejercicios/pr-30.jpg',
  array['Regate','Amplitud ofensiva','Pases filtrados','Pase y circulación','Tiro','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 130
),
(
  'Partidos reducidos con posesiones — esquinas y central',
  'Partidos reducidos',
  'Pequeñas posesiones en las esquinas situadas por fuera del campo durante un tiempo determinado. A la señal del entrenador o preparador físico todos pasan a jugar un partido en el espacio central y empezará el 1er equipo que llegue al balón situado en el centro del espacio. Designar portería que ataca cada equipo antes de empezar.',
  'Marcaje individual en el partido.',
  'Gol en portería = 1 punto.',
  22, 'Alta',
  '/ejercicios/pr-31.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 131
),
(
  'Partidos reducidos con posesiones — superioridad y conexión',
  'Partidos reducidos',
  '2 espacios. Empezamos en un espacio en superioridad con el objetivo de dar un número determinado de pases para poder hacer gol. Los jugadores que no intervienen esperan a que robe su equipo para poder conectar con ellos en el otro subespacio.',
  '5 pases para hacer gol · Gol en portería contraria al subespacio de posesión.',
  'Gol en portería = 1 punto.',
  20, 'Media',
  '/ejercicios/pr-32.jpg',
  array['Amplitud ofensiva','Cambios de orientación','Pases filtrados','Pase y circulación','Tiro','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Ayudas defensivas','Anticipación','Repliegue','Interceptación','Cobertura']::text[],
  true, true, 132
),
(
  'Partidos reducidos con posesiones — 4 espacios con reglas',
  'Partidos reducidos',
  '4 espacios y en cada uno unas reglas: Espacio 1 sin limitaciones técnicas. Espacio 2 con miniporterías y libre de toques. Espacio 3 con 3 toques por jugador. Espacio 4 minipartido. Cambiar espacios y equipos cada serie.',
  'Marcaje individual.',
  'Gol en portería = 1 punto · Equipo ganador sube de categoría.',
  25, 'Media',
  '/ejercicios/pr-33.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 133
),
(
  'Partidos reducidos con posesiones — posesión, minipartido y postas',
  'Partidos reducidos',
  'Juego de posesión y minipartidos. A la señal del entrenador el equipo sin balón cambia de espacio pasando por las postas: postas 1 y 2 sirven para cambiar del minipartido a la posesión, y las postas 3 y 4 viceversa. Postas: 1) 3 saltos a vallas + coordinación en escalera + desplazamiento; 2) ida y vuelta en 4 conos + desplazamiento; 3-4 similares.',
  'Marcaje individual.',
  'Gol en portería = 1 punto.',
  25, 'Alta',
  '/ejercicios/pr-34.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 134
)
on conflict do nothing;
