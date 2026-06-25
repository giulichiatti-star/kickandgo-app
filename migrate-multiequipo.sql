-- ================================================================
-- MIGRACIÓN MULTI-EQUIPO — KickAndGo
-- ================================================================
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ================================================================

-- 1. TABLA EQUIPOS
CREATE TABLE IF NOT EXISTS equipos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre        TEXT NOT NULL DEFAULT 'Mi Equipo',
  tipo_equipo   TEXT DEFAULT '11',
  escudo_url    TEXT,
  descripcion   TEXT,
  competicion   JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MIGRAR DATOS EXISTENTES DE PROFILES → EQUIPOS
-- (crea un equipo por usuario con sus datos actuales)
INSERT INTO equipos (user_id, nombre, tipo_equipo, escudo_url, descripcion, competicion)
SELECT
  id,
  COALESCE(club_nombre, 'Mi Equipo'),
  COALESCE(tipo_equipo, '11'),
  escudo_url,
  descripcion,
  COALESCE(competicion, '{}')
FROM profiles
ON CONFLICT DO NOTHING;

-- 3. AÑADIR equipo_id A TODAS LAS TABLAS DE DATOS
ALTER TABLE jugadores     ADD COLUMN IF NOT EXISTS equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE;
ALTER TABLE partidos      ADD COLUMN IF NOT EXISTS equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE;
ALTER TABLE tarjetas      ADD COLUMN IF NOT EXISTS equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE;
ALTER TABLE entrenamientos ADD COLUMN IF NOT EXISTS equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE;
ALTER TABLE convocatorias  ADD COLUMN IF NOT EXISTS equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE;

-- 4. POBLAR equipo_id EN FILAS EXISTENTES
UPDATE jugadores      j SET equipo_id = e.id FROM equipos e WHERE j.user_id = e.user_id AND j.equipo_id IS NULL;
UPDATE partidos       p SET equipo_id = e.id FROM equipos e WHERE p.user_id = e.user_id AND p.equipo_id IS NULL;
UPDATE tarjetas       t SET equipo_id = e.id FROM equipos e WHERE t.user_id = e.user_id AND t.equipo_id IS NULL;
UPDATE entrenamientos en SET equipo_id = e.id FROM equipos e WHERE en.user_id = e.user_id AND en.equipo_id IS NULL;
UPDATE convocatorias   c SET equipo_id = e.id FROM equipos e WHERE c.user_id = e.user_id AND c.equipo_id IS NULL;

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_equipos_user    ON equipos(user_id);
CREATE INDEX IF NOT EXISTS idx_jugadores_equipo ON jugadores(equipo_id);
CREATE INDEX IF NOT EXISTS idx_partidos_equipo  ON partidos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_equipo  ON tarjetas(equipo_id);
CREATE INDEX IF NOT EXISTS idx_entrenos_equipo  ON entrenamientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_conv_equipo      ON convocatorias(equipo_id);

-- 6. RLS PARA EQUIPOS
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipos_own" ON equipos;
CREATE POLICY "equipos_own" ON equipos FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- FIN
-- ================================================================
SELECT '✅ Migración multi-equipo completada' AS resultado;
