-- Elimina los 11 ejercicios base sembrados por migracion_biblioteca_v2.sql.
-- Los reemplazan las cargas reales (pr-*, fn-*, ps-*) con imagen y descripción completa.
-- Ejecutar en Supabase SQL Editor.

delete from ejercicios_biblioteca
where user_id is null
  and nombre in (
    'Calentamiento dinámico con balón',
    'Rondo 5v2 con comodines',
    '4v4 + 2 apoyos en bandas',
    'Transición 6 ataca vs 4 defiende (8s)',
    'Partido con presión 8" tras pérdida',
    'Finalización ante portero',
    'Definición con pierna débil',
    'Balón parado ofensivo (córners)',
    'Reflejos + blocajes + 1v1',
    'Partido condicionado',
    'Estiramientos y vuelta a la calma'
  );
