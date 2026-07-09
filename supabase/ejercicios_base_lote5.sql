-- ============================================================
-- EJERCICIOS BASE — Posesiones (LOTE 5: ps-01 a ps-20) — 20 tareas
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

insert into ejercicios_biblioteca
  (nombre, categoria, descripcion, complejidad, competitividad, duracion_min, intensidad,
   imagen_url, tags_ofensivos, tags_defensivos, es_base, activo, orden)
values
(
  'Posesiones — 3 zonas (2 laterales con portería + central)',
  'Posesiones',
  'Dividimos el campo en tres zonas: dos laterales con portería y portero, y una central. En cada zona lateral hay 2 jugadores. En la zona central jugamos una posesión entre dos equipos más dos comodines. El equipo en ataque busca mantener el balón, mientras que el equipo en defensa intenta robarlo y conectar con un jugador de una zona lateral. Quien pierde el balón pasa a defender en esa zona.',
  'En las zonas laterales podrán entrar 2 jugadores defensivos (2x2).',
  'Equipo ofensivo: 10 pases = 1 punto / Equipo defensivo: gol = 1 punto.',
  22, 'Media',
  '/ejercicios/ps-01.jpg',
  array['Regate','Cambios de orientación','Pase y circulación','Tiro','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 200
),
(
  'Circuito físico — eslalon + 1x1',
  'Posesiones',
  'Circuito físico combinado: eslalon técnico + duelo 1x1 con finalización. Sirve como calentamiento activo y preparación para partidos reducidos.',
  'Realizar el eslalon a máxima intensidad antes del 1x1.',
  'Ganar el 1x1 = 1 punto.',
  15, 'Alta',
  '/ejercicios/ps-02.jpg',
  array['Regate','Conducción','Tiro','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación']::text[],
  true, true, 201
),
(
  'Circuito físico — centro y remate',
  'Posesiones',
  'Trabajo de finalización partiendo desde banda con centro al área y remate. Rotación por postas para acumular repeticiones a alta intensidad.',
  'Ejecutar a máxima intensidad, centro con precisión.',
  'Gol = 1 punto.',
  15, 'Alta',
  '/ejercicios/ps-03.jpg',
  array['Amplitud ofensiva','Centros al área','Tiro','Remate','Desmarques']::text[],
  array['Anticipación','Despejes']::text[],
  true, true, 202
),
(
  'Circuito físico — 4 postas',
  'Posesiones',
  'Circuito físico-técnico de 4 postas. Cada posta trabaja una capacidad distinta (coordinación, cambio de dirección, salto, aceleración) combinada con acción con balón.',
  'Cambiar de posta cada 45''-60''.',
  'Registrar mejores tiempos por posta.',
  18, 'Alta',
  '/ejercicios/ps-04.jpg',
  array['Conducción','Controles orientados','Pase y circulación']::text[],
  array[]::text[],
  true, true, 203
),
(
  'Circuito físico — 7 postas',
  'Posesiones',
  'Circuito extenso de 7 postas para trabajar la resistencia específica del fútbol combinando coordinación, fuerza, velocidad y acción técnica con balón.',
  'Rotar cada posta a la señal del preparador.',
  'Completar el circuito en el menor tiempo posible.',
  22, 'Alta',
  '/ejercicios/ps-05.jpg',
  array['Conducción','Controles orientados','Pase y circulación']::text[],
  array[]::text[],
  true, true, 204
),
(
  'Circuito físico — 6 postas',
  'Posesiones',
  'Circuito de 6 postas combinando trabajo físico (vallas, escalera, aros, conos) con acción técnica final. Ideal para preparación física integrada.',
  'Ejecutar a máxima intensidad cada posta.',
  'Menor tiempo total del circuito = ganador.',
  20, 'Alta',
  '/ejercicios/ps-06.jpg',
  array['Conducción','Controles orientados','Pase y circulación']::text[],
  array[]::text[],
  true, true, 205
),
(
  'Circuito físico + posesión — juego posicional zona central',
  'Posesiones',
  'Juego posicional en zona central. El equipo en fase ofensiva circula el balón entre jugadores exteriores e interiores, buscando conservar la posesión el mayor tiempo posible. En caso de pérdida, solo los jugadores interiores pueden presionar para recuperar. Los defensores exteriores, posicionales en sus líneas, solo podrán intervenir inicialmente cerrando líneas de pase para interceptar, y replegarán una vez recuperado.',
  'Tras pérdida todos podrán robar al jugador que ha robado (no solo los de dentro).',
  'Ganará el equipo que haga más goles tras las dos series.',
  22, 'Media',
  '/ejercicios/ps-07.jpg',
  array['Último pase','Desmarque de ruptura','Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Repliegue','Interceptación','Presión tras pérdida']::text[],
  true, true, 206
),
(
  'Posesiones — 3 equipos con comodín y 2 porterías interiores',
  'Posesiones',
  'Jugamos una posesión entre tres equipos y un comodín. Dos de ellos estarán en posesión del balón, mientras que el tercero actuará como equipo defensivo e intentará recuperarlo. El objetivo del equipo defensor será robar la pelota y finalizar la acción con un gol en una de las dos porterías. Solo el equipo que pierde el balón podrá defender la portería, mientras que el otro equipo permanecerá.',
  'Limitación técnica de 2 toques por jugador.',
  'Ganará el equipo que menos balones pierda.',
  22, 'Alta',
  '/ejercicios/ps-08.jpg',
  array['Regate','Último pase','Desmarque de ruptura','Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Repliegue','Presión tras pérdida']::text[],
  true, true, 207
),
(
  'Posesiones — juego posicional zona central con presión',
  'Posesiones',
  'Juego posicional en zona central. El equipo en fase ofensiva circula el balón entre exteriores e interiores buscando conservar la posesión el mayor tiempo posible. En caso de pérdida, solo los jugadores interiores pueden presionar para recuperar. Los defensores exteriores, posicionales en sus líneas, cierran líneas de pase para interceptar y replegarán tras la recuperación.',
  'Tras pérdida todos podrán robar al jugador que ha robado.',
  'Ganará el equipo que haga más goles tras las dos series.',
  22, 'Media',
  '/ejercicios/ps-09.jpg',
  array['Último pase','Desmarque de ruptura','Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Repliegue','Interceptación','Presión tras pérdida']::text[],
  true, true, 208
),
(
  'Posesiones — 3 equipos + comodín con 2 porterías internas',
  'Posesiones',
  'Posesión entre tres equipos y un comodín. Dos equipos mantienen el balón mientras el tercero actúa como equipo defensor e intenta recuperarlo. El defensor busca robar y finalizar con gol en una de las 2 porterías. Solo el equipo que pierde el balón defiende su portería; el otro permanece.',
  'Limitación técnica de 2 toques por jugador.',
  'Ganará el equipo que menos balones pierda.',
  22, 'Alta',
  '/ejercicios/ps-10.jpg',
  array['Regate','Último pase','Desmarque de ruptura','Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Repliegue','Presión tras pérdida']::text[],
  true, true, 209
),
(
  'Posesiones — 2 cuadrados con miniporterías (defender vs mantener)',
  'Posesiones',
  'Competición entre dos equipos. Dividimos el espacio en dos cuadrados, tal y como se aprecia en la imagen. Un equipo asume el rol de defender y hacer gol en las miniporterías, mientras que el otro debe mantener la posesión a lo largo de todo el espacio. Los jugadores en posesión no pueden moverse del espacio delimitado en el que se encuentran, pero sí pueden cambiar el balón.',
  'El equipo en posesión, al cambiar de espacio, no puede repetir el mismo espacio desde el que llegó el balón.',
  'Gana el equipo que más goles consiga.',
  22, 'Media',
  '/ejercicios/ps-11.jpg',
  array['Tercer hombre','Amplitud ofensiva','Cambios de orientación','Pase y circulación','Tiro','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación','Repliegue','Interceptación','Presión tras pérdida','Vigilancias']::text[],
  true, true, 210
),
(
  'Posesiones — 2 equipos + comodines con 4 miniporterías',
  'Posesiones',
  'Dividimos al grupo en 2 equipos + comodines. Se juega una posesión de balón en superioridad con el objetivo de dar un número de pases establecidos para poder hacer gol en una de las 4 miniporterías que hay en las 4 esquinas. Cambiar roles tras robo y si marca continúa con la posesión de balón.',
  '6 pases para hacer gol / Limitación de toques (2 toques).',
  'Gol en portería pequeña = 1 punto.',
  22, 'Alta',
  '/ejercicios/ps-12.jpg',
  array['Regate','Amplitud ofensiva','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 211
),
(
  'Posesiones — 2 subespacios con cambio de orientación',
  'Posesiones',
  'Dividimos al equipo en 2 grupos + comodines para una posesión de balón en 2 subespacios iguales. El objetivo es mantener la posesión de balón el mayor tiempo posible y además trabajar los cambios de orientación a los cuadrados opuestos.',
  'Limitación de toques (3 toques).',
  'Cambio de orientación al cuadrado = 1 punto.',
  20, 'Media',
  '/ejercicios/ps-13.jpg',
  array['Amplitud ofensiva','Cambios de orientación','Pase y circulación','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 212
),
(
  'Posesiones — mantener y transición a portería',
  'Posesiones',
  'Se jugará una posesión en la cual el objetivo del equipo poseedor es mantener el balón y ser equipo defensor en la transición cuando lo pierda, y el equipo defensivo tiene que robar y cuando lo consigue realiza una transición rápida para intentar marcar gol. Cambiar rol en cada serie.',
  'Limitación de toques (2 toques).',
  'Gol en portería = 1 punto.',
  22, 'Alta',
  '/ejercicios/ps-14.jpg',
  array['Regate','Último pase','Desmarque de ruptura','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Temporización','Basculaciones','Repliegue','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 213
),
(
  'Posesiones — 2 grupos con postas físicas previas',
  'Posesiones',
  'Dividimos al equipo en dos grupos de 8 jugadores. Jugarán una posesión de balón pero antes de entrar siempre realizarán un trabajo previo de postas. A la señal del preparador físico irán entrando de manera sucesiva y en cada serie irán cambiando el orden de salida para que todos trabajen el mismo tiempo. Los comodines azules irán entrando al mismo tiempo que los otros compañeros.',
  'Provocar igualdad numérica.',
  '6 pases = 1 punto.',
  25, 'Alta',
  '/ejercicios/ps-15.jpg',
  array['Pase y circulación','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 214
),
(
  'Posesiones — 2 equipos + comodines exteriores con presión',
  'Posesiones',
  'Enfrentados dos equipos más los comodines para dar superioridad. El objetivo es mantener la posesión de balón el máximo tiempo posible y el equipo defensor trabaja la presión y cuando consiga robar se intercambian roles.',
  'Limitación de toques (2 toques) / Se puede robar a comodines exteriores.',
  '10 pases = 1 punto / Cada robo = Cambio de rol.',
  22, 'Media',
  '/ejercicios/ps-16.jpg',
  array['Amplitud ofensiva','Pases filtrados','Pase y circulación','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 215
),
(
  'Posesiones — 2 subespacios con transición y robo',
  'Posesiones',
  '2 equipos como se aprecia en la imagen. Se empieza en un subespacio y el objetivo del equipo defensor es robar y realizar un pase a uno de sus compañeros que están esperando en el otro subespacio para realizar una rápida transición y cambiar los roles y así de manera sucesiva.',
  'Limitación de toques (2 toques) / Entra un jugador más a defender.',
  'Cada robo y cambio de subespacio = Cambio de rol.',
  22, 'Media',
  '/ejercicios/ps-17.jpg',
  array['Amplitud ofensiva','Cambios de orientación','Pases filtrados','Pase y circulación','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Ayudas defensivas','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 216
),
(
  'Posesiones — 3 grupos con cambio de subespacio',
  'Posesiones',
  'Dividimos al equipo en 3 grupos como vemos en la imagen. 2 equipos juegan una posesión de balón y uno actúa de comodines. Se comienza en un subespacio y hay que dar un número de pases para conectar con el azul colocado en la franja central + 3er hombre para poder cambiar de subespacio. Cambio de roles cada serie. El comodín interviene en ambos subespacios.',
  '6 pases para progresar / Limitación de toques (2 toques) / Puedo robar a comodines exteriores.',
  'Cambiar de subespacio = 1 punto.',
  22, 'Alta',
  '/ejercicios/ps-18.jpg',
  array['Tercer hombre','Amplitud ofensiva','Cambios de orientación','Descargas','Pase y circulación','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 217
),
(
  'Posesiones — 3 grupos conectando con central y tercer hombre',
  'Posesiones',
  'Dividimos al equipo en 3 grupos como vemos en la imagen. 2 equipos juegan una posesión de balón y uno actúa de comodines. Se comienza en un subespacio y hay que dar un número de pases para conectar con el azul colocado en la franja central + 3er hombre para poder cambiar de subespacio. Cambio de roles cada serie. El comodín interviene en ambos subespacios.',
  '6 pases para progresar / Limitación de toques (2 toques) / Puedo robar a comodines exteriores.',
  'Cambiar de subespacio = 1 punto.',
  22, 'Alta',
  '/ejercicios/ps-19.jpg',
  array['Tercer hombre','Amplitud ofensiva','Cambios de orientación','Descargas','Pase y circulación','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 218
),
(
  'Posesiones — 3 grupos con conexión al hombre central',
  'Posesiones',
  'Dividimos al equipo en 3 grupos. 2 equipos juegan una posesión de balón y uno actúa de comodines. Se comienza en un subespacio y hay que dar un número de pases para conectar con el jugador colocado en la franja central + 3er hombre para poder cambiar de subespacio. Cambio de roles cada serie. El comodín interviene en ambos subespacios.',
  '6 pases para progresar / Limitación de toques (2 toques) / Puedo robar a comodines exteriores.',
  'Cambiar de subespacio = 1 punto.',
  22, 'Alta',
  '/ejercicios/ps-20.jpg',
  array['Tercer hombre','Amplitud ofensiva','Cambios de orientación','Descargas','Pase y circulación','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 219
)
on conflict do nothing;
