-- ============================================================
-- EJERCICIOS BASE — Finalizaciones (LOTE 4: fn-01..fn-20)
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

insert into ejercicios_biblioteca
  (nombre, categoria, descripcion, complejidad, competitividad, duracion_min, intensidad,
   imagen_url, tags_ofensivos, tags_defensivos, es_base, activo, orden)
values
(
  'Finalizaciones — desmarque de ruptura por intervalos',
  'Finalizaciones',
  'Trabajo de ruptura a través de los intervalos defensivos. Dividimos al equipo en dos grupos de 8 jugadores. El ejercicio comienza con el jugador ubicado en la posta número 1, quien realiza una conducción de balón entre picas y luego pasa al jugador número 3. A continuación, corre hasta la pica asignada y regresa para continuar la acción. El jugador número 3 combina con el número 2, quien a su vez juega para el remate final.',
  'Realizar toda la secuencia de pases al primer toque.',
  'Contabilizar número de goles de cada jugador.',
  18, 'Alta',
  '/ejercicios/fn-01.jpg',
  array['Tercer hombre','Último pase','Descargas','Desmarque de ruptura','Pase y circulación','Tiro','Conducción','Desmarques','Controles orientados']::text[],
  array[]::text[],
  true, true, 201
),
(
  'Finalizaciones — rondos con salida a finalizar',
  'Finalizaciones',
  'Cada equipo tendrá un rol. El equipo rojo debe conservar el balón hasta que lo pierda o salga del espacio delimitado. El equipo amarillo entra a robar en parejas. Una vez roban o el balón sale del espacio, realizan una finalización en ambas porterías. Si el balón robado no ha salido del espacio delimitado, pueden continuar con él para finalizar, y el otro compañero recibe un pase del entrenador.',
  'Máximo 1-2 toques por jugador en el rondo.',
  'Contabilizar el número de goles.',
  20, 'Alta',
  '/ejercicios/fn-02.jpg',
  array['Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación','Interceptación','Cobertura']::text[],
  true, true, 202
),
(
  'Enfrentamientos, finalizaciones — centros y remates',
  'Finalizaciones',
  'Ejercicio para trabajar los centros, remates y marcajes individuales. Nos distribuimos como se indica en la imagen y competimos entre dos equipos. La tarea comienza con un pase del entrenador al espacio para el centro de los laterales o extremos del equipo rojo. Una vez finalizado ese centro y remate, se realiza una transición rápida hacia la otra portería para defender otro centro.',
  'El centro debe ser por arriba.',
  'Ganará aquel equipo con más goles tras las dos series.',
  22, 'Alta',
  '/ejercicios/fn-03.jpg',
  array['Remate','Tiro','Centros al área']::text[],
  array['Anticipación','Despejes','Repliegue','Interceptación']::text[],
  true, true, 203
),
(
  'Finalizaciones — rectángulo central con pareja',
  'Finalizaciones',
  'Un rectángulo con dos jugadores ubicados en los lados largos de dicha figura. El resto de los jugadores se organizan en parejas, situándose cada uno en una de las porterías. Una pareja inicia desde una de las porterías, realizando un pase al jugador más alejado dentro del rectángulo central. Éste recibe y ejecuta una descarga orientada hacia el compañero ubicado en el lado opuesto del rectángulo.',
  'Introduciremos defensas en el pase atrás.',
  'Ganará la pareja que haga más goles.',
  18, 'Media',
  '/ejercicios/fn-04.jpg',
  array['Tercer hombre','Desdoblamientos','Último pase','Descargas','Desmarque de ruptura','Remate','Tiro','Centros al área','Desmarques']::text[],
  array[]::text[],
  true, true, 204
),
(
  'Finalizaciones con circuito físico — centros y remates',
  'Finalizaciones',
  'Una vez recuperan la posesión, ejecutan dos finalizaciones a través de centros y remate consecutivos, una con cada perfil, compitiendo entre sí para marcar gol y teniendo que volver hacia el cono como referencia para volver a entrar al remate. Tras finalizar, los jugadores regresan al punto de inicio realizando un trabajo de escaleras a máxima velocidad.',
  '1-2 toques por jugador en el rondo.',
  'Ganará el equipo que más goles anote.',
  25, 'Alta',
  '/ejercicios/fn-05.jpg',
  array['Remate','Pase y circulación','Tiro','Centros al área','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Anticipación','Interceptación','Cobertura']::text[],
  true, true, 205
),
(
  'Finalizaciones — mediocentro con último pase',
  'Finalizaciones',
  'Un mediocentro ubicado en el centro del campo recibe el pase, realiza un control orientado para sortear al defensor representado por un cono y a partir de ahí dispone de dos opciones para el último pase. La primera alternativa es conectar con el delantero que, con un desmarque de ruptura, ataca la espalda de la defensa señalizada con picas, buscando generar profundidad y ventaja.',
  'Atrasaremos más la línea defensiva para que el último pase sea más preciso.',
  'Sistema de puntuación por buen pase en profundidad y gol.',
  18, 'Alta',
  '/ejercicios/fn-06.jpg',
  array['Último pase','Desmarque de ruptura','Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array[]::text[],
  true, true, 206
),
(
  'Finalizaciones con circuito físico — postas técnicas',
  'Finalizaciones',
  'Circuito por postas: 1) Conducción alrededor de una pica + pase al jugador del inicio. 2) Saltos a vallas + sprint a la siguiente posta. 3) Conducción entre dos picas + pase al inicio + coordinación en escalera + sprint. 4) Pase a la posta 5 + sprint hasta allí. 5) Control + conducción rápida + pase a la posta 4 + carrera intensa a la posta 6. 6) Pase para la finalización del jugador de la posta 7 + sprint hasta la misma.',
  'Tiro con pierna no dominante.',
  'Gol = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-07.jpg',
  array['Regate','Pase y circulación','Tiro','Conducción','Controles orientados']::text[],
  array[]::text[],
  true, true, 207
),
(
  'Finalizaciones — control orientado y conducción',
  'Finalizaciones',
  'Control orientado o, alternativamente, conducción seguida de un tiro a portería. Una vez que el entrenador entrega el balón al jugador número 2, inicia la acción el jugador número 3, quien conduce el balón entre conos y centra al área para que ambos jugadores rematen. Tras finalizar las tres acciones, comienza el otro equipo. La rotación está marcada por números. Cambiar perfil cada serie.',
  'Realizar la conducción entre conos con pierna no dominante.',
  'Gana el equipo que más goles anote.',
  20, 'Alta',
  '/ejercicios/fn-08.jpg',
  array['Remate','Tiro','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array[]::text[],
  true, true, 208
),
(
  'Finalizaciones — pared y desmarque de banda',
  'Finalizaciones',
  'Trabajo por una banda. Colocamos dos porterías: una en el centro del campo y la otra en la línea de fondo (ambas con portero). Un jugador de cada grupo se coloca en el centro de varias picas (simulando contrarios) en la frontal del área. El primer jugador de cada grupo pasa el balón al compañero en las picas, quien devuelve una pared, sorteando a los defensores. Luego se desmarca rápidamente para rematar.',
  'Haremos toda la secuencia al primer toque.',
  'Contabilizaremos los goles de cada equipo.',
  20, 'Media',
  '/ejercicios/fn-09.jpg',
  array['Último pase','Descargas','Pases filtrados','Desmarque de ruptura','Pared','Tiro','Desmarques']::text[],
  array[]::text[],
  true, true, 209
),
(
  'Enfrentamientos, finalizaciones — 1x1 en banda + rondo',
  'Finalizaciones',
  'Los amarillos deben robar y conectar con uno de los dos extremos para generar una situación exterior de 1x1, seguida de un centro lateral que los rojos deberán defender en inferioridad numérica. Los amarillos que recuperaron el balón en el rondo transitan rápidamente para rematar el centro lateral. Si el jugador atacante en la banda no consigue desbordar en el 1x1, se introducirá un segundo balón.',
  'Máximo 2 toques por jugador en el rondo.',
  'Cada 10 pases consecutivos en el rondo = 1 punto · Gol en portería = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-10.jpg',
  array['Regate','Amplitud ofensiva','Cambios de orientación','Remate','Centros al área','Conducción','Desmarques','Controles orientados']::text[],
  array['Entrada','Acoso','Ayudas defensivas','Anticipación','Despejes','Repliegue','Cobertura']::text[],
  true, true, 210
),
(
  'Enfrentamientos, finalizaciones — 3v3 con temporización',
  'Finalizaciones',
  'Dividimos al grupo en dos equipos: amarillos y rojos. Tres jugadores rojos inician desde la línea de fondo. Dos de ellos se pasan el balón entre sí, mientras el tercero se queda temporizando en la frontal del área. Cuando los pasadores llegan a la línea opuesta, envían un pase a uno de los tres jugadores amarillos, ubicados cerca de las miniporterías. En ese momento, los dos rojos vuelven para defender.',
  'El equipo ofensivo tendrá un máximo de pases antes de finalizar.',
  'Ganará el equipo que más goles haga tras las cuatro series.',
  22, 'Alta',
  '/ejercicios/fn-11.jpg',
  array['Regate','Último pase','Desmarque de ruptura','Pase y circulación','Tiro','Conducción','Desmarques']::text[],
  array['Entrada','Acoso','Temporización','Ayudas defensivas','Repliegue','Interceptación']::text[],
  true, true, 211
),
(
  'Finalizaciones — pared y cambio de banda para remate',
  'Finalizaciones',
  'Realizamos una pared con el compañero y buscamos al compañero que se incorpora al ataque a máxima velocidad por banda contraria. El jugador que ha realizado la pared va a rematar a portería. Iremos rotando las posiciones en cada repetición para que todos los jugadores vayan ocupando todas las posiciones.',
  'Realizaremos toda la secuencia al primer toque.',
  'Trataremos de hacer más de 10-15 goles en cada serie.',
  20, 'Media',
  '/ejercicios/fn-12.jpg',
  array['Desdoblamientos','Remate','Pared','Pase y circulación','Centros al área']::text[],
  array[]::text[],
  true, true, 212
),
(
  'Finalizaciones con circuito físico — paredes y centros',
  'Finalizaciones',
  'Circuito físico con finalizaciones. Dividimos a los jugadores en las postas situadas en el centro del campo. Comenzamos realizando paredes entre las picas y en la última posta se realiza un pase para que el compañero finalice. Una vez finalizado se realiza el circuito a máxima velocidad cada uno por su perfil. Perfil derecho: velocidad, girar el cono, escaleras, saltos en aros y velocidad hasta cono.',
  'Tiro con pierna no dominante.',
  'Gol = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-13.jpg',
  array['Pared','Pase y circulación','Tiro','Desmarques','Controles orientados']::text[],
  array[]::text[],
  true, true, 213
),
(
  'Finalizaciones con circuito físico — 3 postas rotación',
  'Finalizaciones',
  'Dividimos al equipo en dos grupos de 8 jugadores. Circuito físico alternando elementos físicos y técnicos. Dividimos a los jugadores en las 3 postas establecidas y numeradas para su rotación. Iniciará el jugador situado en la posta 1 con una conducción de balón rápida hasta rodear la pica y dar un pase al compañero en la posta 1 + 3.',
  'Tiro al primer contacto.',
  'Gol = 1 punto · Competición entre los grupos.',
  25, 'Alta',
  '/ejercicios/fn-14.jpg',
  array['Pared','Pase y circulación','Tiro','Conducción','Controles orientados']::text[],
  array[]::text[],
  true, true, 214
),
(
  'Finalizaciones — 4 postas con cambios de orientación',
  'Finalizaciones',
  'Dividimos al equipo en dos grupos de 8 jugadores. Trabajo de finalizaciones a través de cambios de orientación y paredes atacando los espacios. En las postas enumeradas realizamos solamente pases tanto largo como en corto, una vez realizada las 4 acciones, este grupo pasa a realizar finalizaciones y el grupo que realizó finalizaciones rota por orden numérico para trabajar en todas las postas.',
  'Finalizar con pierna no dominante.',
  'Contabilizar número de goles de cada jugador.',
  25, 'Alta',
  '/ejercicios/fn-15.jpg',
  array['Último pase','Amplitud ofensiva','Cambios de orientación','Desmarque de ruptura','Pared','Tiro','Conducción','Controles orientados']::text[],
  array[]::text[],
  true, true, 215
),
(
  'Enfrentamientos, finalizaciones — 2v2 con superioridad',
  'Finalizaciones',
  'Realizaremos un trabajo de finalizaciones por puestos específicos con oposición haciendo hincapié en el trabajo del extremo que tiene que centrar tras recorte con pierna cambiada. Siempre se iniciará la jugada con mediocentro que dará un pase al desmarque de apoyo del delantero situado en diagonal, éste realiza pase al otro mediocentro que hace un cambio de orientación al extremo.',
  'El jugador rojo elige qué zona del área defender.',
  'Gol = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-16.jpg',
  array['Cambios de orientación','Descargas','Remate','Pase y circulación','Centros al área']::text[],
  array['Despejes']::text[],
  true, true, 216
),
(
  'Enfrentamientos, hábitos defensivos, finalizaciones — extremos vs laterales',
  'Finalizaciones',
  'Dividimos al equipo en dos grupos de 8 jugadores + 1 portero. Cada grupo utilizará medio campo. Extremos y laterales + 1 portero trabajarán conceptos específicos de extremos a nivel ofensivo y laterales a nivel defensivo. Los jugadores azules realizan tiros desde la frontal del área. Los jugadores amarillos trabajan la conducción + 1x1 contra jugador rojo.',
  'Finalizar con pierna no dominante.',
  'Gol = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-17.jpg',
  array['Regate','Tiro','Conducción']::text[],
  array['Entrada','Acoso','Temporización','Presión tras pérdida']::text[],
  true, true, 217
),
(
  'Enfrentamientos, finalizaciones — pared y 1x1 con recorte',
  'Finalizaciones',
  'Dos equipos de 8 jugadores respectivamente se dividen tal y como se ve en el gráfico. En ambos lados se trabajará lo mismo pero en diferentes perfiles. La secuencia siempre se iniciará con un balón del entrenador al mediocentro (rojo) + control y cambio de orientación a extremo de banda contraria (amarillo) que realiza control y una conducción para encarar en el 1x1 a defensor (azul).',
  'Sólo puedo driblar por el perfil diestro/zurdo.',
  'Gol = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-18.jpg',
  array['Regate','Cambios de orientación','Remate','Pase y circulación','Centros al área']::text[],
  array['Entrada','Acoso']::text[],
  true, true, 218
),
(
  'Enfrentamientos, hábitos defensivos, finalizaciones — puestos específicos',
  'Finalizaciones',
  'Situados por puestos específicos como en el gráfico. Amarillos (laterales / extremos): trabajo de centros en carrera desde diferentes distancias y alturas. Rojos (centrales + 1 mediocentro + 1 lateral): trabajo de defender centros laterales (2x2) dentro del área y dos mediocentros para ganar 2ª jugada + transiciones a porterías pequeñas.',
  'Mayor desigualdad numérica en área.',
  'Gol = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-19.jpg',
  array['Remate','Centros al área']::text[],
  array['Despejes']::text[],
  true, true, 219
),
(
  'Enfrentamientos, hábitos defensivos, finalizaciones — cambio de orientación al 1x1',
  'Finalizaciones',
  'Situaremos a los jugadores como se puede ver en el gráfico. Secuencia del ejercicio: pase de mediocentro rojo a mediocentro amarillo (o viceversa) + control orientado y cambio de orientación a extremo ofensivo (azul) para control orientado en carrera y centro al área donde se produce un duelo entre defensa y atacante.',
  'Gol válido solo a la primera.',
  'Gol = 1 punto.',
  25, 'Alta',
  '/ejercicios/fn-20.jpg',
  array['Cambios de orientación','Remate','Centros al área']::text[],
  array['Despejes','Repliegue','Interceptación']::text[],
  true, true, 220
)
on conflict do nothing;
