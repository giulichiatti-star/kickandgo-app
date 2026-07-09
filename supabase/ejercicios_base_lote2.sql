-- ============================================================
-- EJERCICIOS BASE — Partidos reducidos (LOTE 2: pr-05 a pr-23)
-- Ejecutar en Supabase SQL Editor. Idempotente por conflict do nothing.
-- ============================================================

insert into ejercicios_biblioteca
  (nombre, categoria, descripcion, complejidad, competitividad, duracion_min, intensidad,
   imagen_url, tags_ofensivos, tags_defensivos, es_base, activo, orden)
values
(
  'Partidos reducidos con tercer hombre y contra',
  'Partidos reducidos',
  'Un equipo intenta contactar con comodín central para una descarga a un tercer hombre que se incorpora al otro espacio y finaliza sin oposición. Una vez realizado, los defensores pasan inmediatamente a defender en la franja central con el objetivo de cerrar línea de pases e impedir la progresión del equipo que se incorpora con balón nuevo, y así de forma sucesiva. En caso de interceptación o robo, el equipo defensor pasa a rol ofensivo.',
  'Limitación técnica de 2-3 toques por jugador · Progresar antes del 4º pase.',
  'Contabilizar goles (2 puntos) e interceptaciones (1 punto) para determinar equipo ganador.',
  20, 'Alta',
  '/ejercicios/pr-05.jpg',
  array['Tercer hombre','Pases filtrados','Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array['Cierre línea de pase','Basculaciones','Interceptación']::text[],
  true, true, 105
),
(
  'Partidos reducidos — finalización rápida por extremos',
  'Partidos reducidos',
  'Partido a espacios reducidos para trabajar la finalización. Se puede marcar de cualquier forma. Si el gol viene de un extremo exterior (que no puede salir de su espacio) y se realiza al primer toque, vale doble. Si marca vuelve a sacar el portero. Cambiar jugadores exteriores cada serie. El equipo que descansa realiza trabajo con preparador físico.',
  'Gol válido al primer toque · Finalizar en menos de 4 pases.',
  'Gol en portería = 1 punto · Gol al primer toque tras pase de extremo = 2 puntos.',
  20, 'Alta',
  '/ejercicios/pr-06.jpg',
  array['Regate','Último pase','Amplitud ofensiva','Cambios de orientación','Pases filtrados','Remate','Pase y circulación','Tiro','Cobertura de balón','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Anticipación','Despejes','Basculaciones','Repliegue','Interceptación']::text[],
  true, true, 106
),
(
  'Partidos reducidos — finalizaciones bidireccionales',
  'Partidos reducidos',
  'Finalizaciones rápidas. Se puede hacer gol en las 2 porterías, no hay direccionalidad. Un equipo trabaja a nivel ofensivo y otro a nivel defensivo. Cada vez que se finaliza, el entrenador mete el balón al equipo con rol ofensivo (hay que estar siempre activados). Si el equipo defensivo roba, debe dar 4 pases para poder finalizar en cualquier portería. Se cambian roles tras cada serie.',
  'Gol válido al primer toque · Finalizar en menos de 4 pases.',
  'Gol en portería = 1 punto.',
  20, 'Alta',
  '/ejercicios/pr-07.jpg',
  array['Regate','Amplitud ofensiva','Pared','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida','Vigilancias']::text[],
  true, true, 107
),
(
  'Partidos reducidos — espacios con premisas variables',
  'Partidos reducidos',
  'Partido con diferentes premisas alternables: los jugadores de detrás de la portería no pueden salir de la zona; o sí deben salir obligatoriamente; no se puede finalizar detrás de la línea discontinua (obligado a pasar el medio campo rival); o sí se puede finalizar detrás de la línea. El equipo que descansa realiza trabajo con preparador físico.',
  'Límite de 2 toques · Gol válido al primer toque.',
  'Gol en portería = 1 punto.',
  20, 'Media',
  '/ejercicios/pr-08.jpg',
  array['Tercer hombre','Regate','Último pase','Descargas','Pases filtrados','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Anticipación','Repliegue','Interceptación','Cobertura','Presión tras pérdida','Vigilancias']::text[],
  true, true, 108
),
(
  'Partidos reducidos — regate y transiciones',
  'Partidos reducidos',
  'Partido reducido dividido en 2 espacios para mejorar el regate y las transiciones. Se comienza en campo contrario buscando gol con buena circulación, con la premisa de que solo vale el gol después de regate. El equipo defensivo debe defender esos 1x1 y en caso de recuperación jugar a la otra zona con sus compañeros para reproducir la misma acción.',
  'Provocar igualdad numérica.',
  'Gol en portería = 1 punto.',
  20, 'Alta',
  '/ejercicios/pr-09.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación','Interceptación','Presión tras pérdida','Vigilancias']::text[],
  true, true, 109
),
(
  'Partidos reducidos — centrales azules y miniporterías',
  'Partidos reducidos',
  'Partido reducido en dos espacios donde los azules son los centrales de cada equipo. A nivel ofensivo trabajan salida de balón y a nivel defensivo defienden las miniporterías. En la 2ª serie el gol es válido solo si se marca en la portería contraria a la zona donde está la pelota. El comodín genera superioridad para ambos equipos.',
  'Límite de 2 toques · Gol válido al primer toque.',
  'Gol en portería pequeña = 1 punto.',
  22, 'Media',
  '/ejercicios/pr-10.jpg',
  array['Tercer hombre','Regate','Desdoblamientos','Último pase','Descargas','Pases filtrados','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 110
),
(
  'Partidos reducidos — zona de área con apoyos exteriores',
  'Partidos reducidos',
  'Partido en zona de área con apoyos exteriores y premisas: debo dar 4 pases para hacer gol; el jugador que roba puede tirar directamente a portería (si la pasa, hay que dar los 4 pases); tras rechace del portero, el equipo rival debe dar los 4 pases; el jugador exterior no puede tirar a portería (tiene 1 toque). Al llegar a 2 puntos o transcurridos 2 minutos se cambia de equipos.',
  'Gol válido al primer toque · Finalizar en menos de 4 pases.',
  'Gol en portería = 1 punto · Gol de cabeza, chilena o tacón = 2 puntos.',
  20, 'Alta',
  '/ejercicios/pr-11.jpg',
  array['Regate','Último pase','Amplitud ofensiva','Cambios de orientación','Pases filtrados','Pase y circulación','Tiro','Cobertura de balón','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Anticipación','Despejes','Basculaciones','Interceptación','Cobertura']::text[],
  true, true, 111
),
(
  'Partidos reducidos — comodines exteriores y superioridad',
  'Partidos reducidos',
  'Uso de comodines exteriores para generar superioridad. Si no se progresa por una zona, buscar la zona contraria. También se puede atacar por zona central, pero hay que dar un número de pases. El equipo defensivo debe robar el balón y defender centros laterales constantemente. En las zonas laterales solo puede haber un jugador. Los comodines solo juegan en su zona.',
  '5 pases para progresar por dentro · Puede entrar un defensa más en la zona lateral.',
  'Gol en portería = 1 punto · Gol tras centro y remate = 3 puntos.',
  22, 'Alta',
  '/ejercicios/pr-12.jpg',
  array['Regate','Desdoblamientos','Amplitud ofensiva','Cambios de orientación','Remate','Pase y circulación','Tiro','Cobertura de balón','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación','Despejes','Basculaciones','Repliegue','Interceptación','Cobertura']::text[],
  true, true, 112
),
(
  'Partidos reducidos — subespacios con apoyos exteriores',
  'Partidos reducidos',
  'Partido reducido en 2 espacios donde cada jugador debe jugar en su subespacio. El objetivo es progresar a la siguiente zona para contactar con apoyos exteriores y poder finalizar; el gol siempre debe venir precedido de un pase del jugador exterior. Si robo en campo contrario, sí puedo hacer gol directo. Cambiar jugadores exteriores cada serie.',
  'Limitación de 3 toques · Gol al primer toque.',
  'Gol en portería = 1 punto.',
  20, 'Media',
  '/ejercicios/pr-13.jpg',
  array['Tercer hombre','Regate','Último pase','Descargas','Pases filtrados','Pared','Pase y circulación','Tiro','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Anticipación','Interceptación','Cobertura','Presión tras pérdida','Vigilancias']::text[],
  true, true, 113
),
(
  'Partidos reducidos — buscar alejados en zonas laterales',
  'Partidos reducidos',
  'Partido reducido con el objetivo de buscar alejados. Cada jugador juega en su espacio. El equipo ofensivo deberá contactar con alejados para progresar en el juego e intentar hacer gol. El equipo defensivo debe robar y realizar contraataques. Cambiar roles y jugadores cada serie.',
  '3-4 pases para progresar · Puede entrar un jugador de la línea central cuando le gana espalda al rival.',
  'Gol en portería = 1 punto.',
  20, 'Media',
  '/ejercicios/pr-14.jpg',
  array['Regate','Último pase','Amplitud ofensiva','Pases filtrados','Desmarque de ruptura','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Anticipación','Repliegue','Interceptación','Cobertura','Presión tras pérdida','Vigilancias']::text[],
  true, true, 114
),
(
  'Partidos reducidos — rotación entre postas y minipartido',
  'Partidos reducidos',
  'Se comienza con trabajo de postas para luego entrar al 1er espacio a jugar una posesión de balón durante un tiempo estipulado. A la señal se desplazan al subespacio del minipartido para trabajar durante otro tiempo marcado y volver a empezar. La siguiente pareja empieza a la señal de cambio de subespacio.',
  'Marcaje individual · Gol válido tras regate.',
  'Gol en portería = 1 punto.',
  20, 'Media',
  '/ejercicios/pr-15.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 115
),
(
  'Partidos reducidos — minipartido con posta de regate',
  'Partidos reducidos',
  'Minipartido en el espacio por un tiempo determinado (45''-1''30'' aproximadamente). A la señal se realiza la posta exterior tanto en la ida como en la vuelta. Cambiar de posta en cada repetición y cambiar de espacio en cada serie.',
  'Gol válido tras regate.',
  'Gol en portería = 1 punto.',
  15, 'Media',
  '/ejercicios/pr-16.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 116
),
(
  'Partidos reducidos — cambios de orientación entre subespacios',
  'Partidos reducidos',
  'Los rojos inician en situación de superioridad en uno de los 2 subespacios más grandes con el objetivo de dar un número de pases para poder hacer gol; si lo consiguen, seguirán con la posesión. Si el amarillo roba, debe realizar un cambio de orientación al otro subespacio para cambiar roles. Los comodines siempre juegan con el equipo poseedor en ambos subespacios.',
  '5 pases para hacer gol · Limitación de 2 toques.',
  'Gol en portería = 1 punto.',
  20, 'Media',
  '/ejercicios/pr-17.jpg',
  array['Amplitud ofensiva','Cambios de orientación','Pases filtrados','Pase y circulación','Tiro','Cobertura de balón','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura']::text[],
  true, true, 117
),
(
  'Partidos reducidos — gol precedido de pase exterior',
  'Partidos reducidos',
  'Se inicia jugando por dentro con el objetivo de hacer el mayor número de goles posibles, con el condicionante de que para que el gol valga tiene que venir precedido de un pase de un compañero exterior. Cambiar jugadores exteriores cada serie.',
  'Gol válido al primer toque · Limitación de 2 toques.',
  'Gol en portería = 1 punto.',
  18, 'Media',
  '/ejercicios/pr-18.jpg',
  array['Tercer hombre','Regate','Último pase','Amplitud ofensiva','Descargas','Pases filtrados','Pared','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Cierre línea de pase','Ayudas defensivas','Anticipación','Repliegue','Interceptación']::text[],
  true, true, 118
),
(
  'Partidos reducidos con posesiones — alta intensidad',
  'Partidos reducidos',
  'Se juegan en 2 espacios. Uno de los espacios juega una posesión de balón y el otro un partido reducido. A la señal del entrenador o preparador físico tienen que cambiar todos los jugadores de espacios a alta intensidad (90%) para comenzar en la otra zona.',
  'Limitación de 3 toques · 4 pases máximos para finalizar.',
  'Gol en portería = 1 punto · 10 pases seguidos = 1 punto.',
  25, 'Alta',
  '/ejercicios/pr-19.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 119
),
(
  'Partidos reducidos — presión tras pérdida y alejamiento',
  'Partidos reducidos',
  'El equipo que pierde el balón en campo contrario tiene que realizar automáticamente una presión tras pérdida y recuperar el balón lo más rápido posible; así provocamos buena presión a nivel defensivo. A nivel ofensivo alejamos el balón de la zona de presión para intentar hacer gol. Los partidos se juegan por tiempo limitado (3'' aprox.) y contabilizamos el número de goles.',
  'Limitación de 3 toques.',
  'Gol en portería = 1 punto · Gol tras presión tras pérdida = 2 puntos.',
  18, 'Alta',
  '/ejercicios/pr-20.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación','Basculaciones','Interceptación','Cobertura','Presión tras pérdida']::text[],
  true, true, 120
),
(
  'Partidos reducidos — pases mínimos con superioridad',
  'Partidos reducidos',
  'Número de pases mínimo para poder entrar en la zona de ataque, a la cual siempre podrá incorporarse 1 jugador para crear superioridad. Si el equipo defensor roba en zona de ataque, tienen que finalizar rápido; pero si lo hacen en la zona de inicio, tienen que dar el número de pases para poder atacar. Si transcurrido un tiempo (2'' aprox.) ningún equipo ha metido 2 goles saldrá el que más tiempo dure.',
  '4 pases para progresar · Limitación de 3 toques.',
  'Gol en portería = 1 punto.',
  22, 'Media',
  '/ejercicios/pr-21.jpg',
  array['Regate','Pase y circulación','Tiro','Cobertura de balón','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Basculaciones','Interceptación','Cobertura','Presión tras pérdida','Vigilancias']::text[],
  true, true, 121
),
(
  'Partidos reducidos — pasillo central con comodines',
  'Partidos reducidos',
  'Se juega un partido reducido entre los 2 equipos en el pasillo central y un equipo comodín por fuera. Para que el gol sea válido, tiene que pasar el balón por los 3 pasillos sin perder la posesión el equipo ofensivo. Además, si el gol se produce desde un centro lateral del equipo comodín valdrá doble. Se juegan 3 partidos de 3'' cada uno para enfrentarnos todos contra todos.',
  'Limitación de 2 toques · Gol válido al primer toque.',
  'Gol en portería = 1 punto · Gol tras centro lateral = 2 puntos.',
  25, 'Alta',
  '/ejercicios/pr-22.jpg',
  array['Regate','Amplitud ofensiva','Cambios de orientación','Remate','Pase y circulación','Tiro','Cobertura de balón','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Despejes','Basculaciones','Interceptación','Cobertura']::text[],
  true, true, 122
),
(
  'Partidos reducidos — 3 equipos rotación comodín',
  'Partidos reducidos',
  'Competición entre 3 equipos a modo de todos contra todos. 2 equipos juegan en el espacio y uno actúa como comodín. Los partidos se juegan por tiempo limitado (3'' aprox.) y contabilizamos el número de goles.',
  'Limitación técnica de 2 toques.',
  'Gol en portería = 1 punto · Gol al primer toque tras centro = 2 puntos.',
  25, 'Alta',
  '/ejercicios/pr-23.jpg',
  array['Regate','Amplitud ofensiva','Remate','Pase y circulación','Tiro','Cobertura de balón','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Despejes','Basculaciones','Interceptación','Cobertura']::text[],
  true, true, 123
)
on conflict do nothing;
