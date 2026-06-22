-- Tabla (si no existe)
create table if not exists ejercicios_biblioteca (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nombre text not null,
  categoria text not null default 'General',
  descripcion text,
  duracion_min int default 15,
  intensidad text default 'Media',
  zona_muscular text,
  orden int default 0,
  activo bool default true,
  es_base bool default false,
  created_at timestamptz default now()
);

alter table ejercicios_biblioteca enable row level security;

-- Policies (drop + recreate para evitar duplicados)
drop policy if exists "ver base y propios" on ejercicios_biblioteca;
drop policy if exists "insertar propios" on ejercicios_biblioteca;
drop policy if exists "actualizar propios" on ejercicios_biblioteca;
drop policy if exists "borrar propios" on ejercicios_biblioteca;

create policy "ver base y propios" on ejercicios_biblioteca
  for select using (user_id = auth.uid() or user_id is null);
create policy "insertar propios" on ejercicios_biblioteca
  for insert with check (user_id = auth.uid());
create policy "actualizar propios" on ejercicios_biblioteca
  for update using (user_id = auth.uid());
create policy "borrar propios" on ejercicios_biblioteca
  for delete using (user_id = auth.uid());

-- Notas en entrenamientos
alter table entrenamientos add column if not exists notas text;

-- Semilla ejercicios base (solo si no existen ya)
insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Calentamiento dinámico con balón','Calentamiento','Movilidad articular con balón. Pases cortos en movimiento, cambios de ritmo progresivos. Activar tobillos, rodillas, caderas y hombros.',15,'Baja','Todo el cuerpo',1,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Calentamiento dinámico con balón' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Rondo 5vs2 + comodines','Posesión','Rondo en cuadrado con 5 poseedores y 2 presionadores. Los comodines siempre apoyan al equipo con balón. Objetivo: circular sin perder.',15,'Baja','Pierna',2,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Rondo 5vs2 + comodines' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Posesión 4vs4 + apoyos laterales','Posesión','Cuatro contra cuatro en espacio reducido con dos apoyos fijos en las bandas. Mantener balón más de 5 pases = punto.',20,'Media','Pierna / Core',3,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Posesión 4vs4 + apoyos laterales' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Transición 6vs4 con apoyo','Transiciones','El equipo de 6 ataca y al perder el balón debe recuperarlo en menos de 8 segundos. El equipo de 4 defiende y contraataca.',20,'Media','Pierna / Cardio',4,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Transición 6vs4 con apoyo' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Presión tras pérdida (8 segundos)','Presión','Partido condicionado donde el equipo que pierde el balón tiene 8 segundos para recuperarlo. Si no lo recupera, el rival anota un punto.',25,'Alta','Cardio / Pierna',5,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Presión tras pérdida (8 segundos)' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Finalización ante portero','Finalización','Oleadas de 2vs1 y 3vs2 finalizando ante portero. El objetivo es terminar con un máximo de toques. Variante: entrada desde banda con centro.',20,'Alta','Pierna',6,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Finalización ante portero' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Definición con pierna débil','Finalización','Series de remates solo con pierna no dominante desde distintas posiciones. Incluye presión de defensa pasiva.',15,'Media','Pierna',7,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Definición con pierna débil' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Balón parado ofensivo (córners)','Balón parado','Ensayar tres variantes de córner: zona near post, far post y córner corto. Repetir cada variante 5 veces con movimiento coordinado.',15,'Media','Pierna / Core',8,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Balón parado ofensivo (córners)' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Reflejos y blocajes portero','Porteros','Series de remates a distancias cortas para trabajar reflejos. Blocajes en el suelo, blocajes altos y salidas en 1vs1.',20,'Media','Tren superior / Reflejos',9,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Reflejos y blocajes portero' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Partido condicionado 9vs9','Partido','Partido con condiciones: máximo 2 toques, obligatorio pasar por banda, o gol solo vale con cabeza. Adaptar condición al objetivo de la semana.',30,'Alta','Todo el cuerpo',10,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Partido condicionado 9vs9' and user_id is null);

insert into ejercicios_biblioteca (user_id, nombre, categoria, descripcion, duracion_min, intensidad, zona_muscular, orden, es_base)
select null,'Estiramientos y vuelta a la calma','Calentamiento','Estiramientos estáticos de cuádriceps, isquios, gemelos, cadera y espalda. Respiración profunda. Tiempo mínimo 10 minutos.',10,'Baja','Todo el cuerpo',11,true
where not exists (select 1 from ejercicios_biblioteca where nombre='Estiramientos y vuelta a la calma' and user_id is null);
