-- Elimina la categoría "Posesión" (singular, seed v2 con solo 2 ejercicios).
-- La categoría real es "Posesiones" (plural, lote 5) con 20 ejercicios cargados.
-- Ejecutar en Supabase SQL Editor.

delete from ejercicios_biblioteca
where user_id is null
  and categoria = 'Posesión';
