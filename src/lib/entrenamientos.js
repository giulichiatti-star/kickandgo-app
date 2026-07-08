import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'

// Biblioteca base local (fallback si Supabase falla o está vacía)
export const BIBLIOTECA_BASE = [
  { nombre: 'Calentamiento dinámico con balón', categoria: 'Calentamiento', descripcion: 'Movilidad articular con balón. Pases cortos en movimiento, cambios de ritmo progresivos.', duracion_min: 15, intensidad: 'Baja', zona_muscular: 'Todo el cuerpo' },
  { nombre: 'Rondo 5vs2 + comodines', categoria: 'Posesión', descripcion: 'Rondo en cuadrado con 5 poseedores y 2 presionadores. Objetivo: circular sin perder.', duracion_min: 15, intensidad: 'Baja', zona_muscular: 'Pierna' },
  { nombre: 'Posesión 4vs4 + apoyos laterales', categoria: 'Posesión', descripcion: 'Cuatro contra cuatro con apoyos fijos en las bandas. Mantener balón más de 5 pases = punto.', duracion_min: 20, intensidad: 'Media', zona_muscular: 'Pierna / Core' },
  { nombre: 'Transición 6vs4 con apoyo', categoria: 'Transiciones', descripcion: 'El equipo de 6 ataca y al perder debe recuperar en menos de 8 segundos. Desarrolla repliegue.', duracion_min: 20, intensidad: 'Media', zona_muscular: 'Pierna / Cardio' },
  { nombre: 'Presión tras pérdida (8 segundos)', categoria: 'Presión', descripcion: 'Partido donde al perder tienes 8 s para recuperar. Fundamental para alta presión.', duracion_min: 25, intensidad: 'Alta', zona_muscular: 'Cardio / Pierna' },
  { nombre: 'Finalización ante portero', categoria: 'Finalización', descripcion: 'Oleadas de 2vs1 y 3vs2 finalizando ante portero. Máximo de toques por variante.', duracion_min: 20, intensidad: 'Alta', zona_muscular: 'Pierna' },
  { nombre: 'Definición con pierna débil', categoria: 'Finalización', descripcion: 'Remates solo con pierna no dominante desde distintas posiciones. Con presión de defensa pasiva.', duracion_min: 15, intensidad: 'Media', zona_muscular: 'Pierna' },
  { nombre: 'Balón parado ofensivo (córners)', categoria: 'Balón parado', descripcion: 'Tres variantes de córner. Repetir 5 veces cada variante con movimiento coordinado.', duracion_min: 15, intensidad: 'Media', zona_muscular: 'Pierna / Core' },
  { nombre: 'Reflejos y blocajes portero', categoria: 'Porteros', descripcion: 'Remates cortos para reflejos. Blocajes en suelo, altos y salidas en 1vs1.', duracion_min: 20, intensidad: 'Media', zona_muscular: 'Tren superior / Reflejos' },
  { nombre: 'Partido condicionado 9vs9', categoria: 'Partido', descripcion: 'Partido con condiciones: máximo 2 toques, pasar por banda, o gol solo de cabeza.', duracion_min: 30, intensidad: 'Alta', zona_muscular: 'Todo el cuerpo' },
  { nombre: 'Estiramientos y vuelta a la calma', categoria: 'Calentamiento', descripcion: 'Estiramientos estáticos de cuádriceps, isquios, gemelos, cadera y espalda. Mínimo 10 min.', duracion_min: 10, intensidad: 'Baja', zona_muscular: 'Todo el cuerpo' },
]

// Alias retrocompatibilidad
export const BIBLIOTECA = BIBLIOTECA_BASE.map((e) => ({
  n: e.nombre, cat: e.categoria, min: e.duracion_min,
  intensidad: e.intensidad, desc: e.descripcion, zona: e.zona_muscular,
  nombre: e.nombre, categoria: e.categoria, duracion_min: e.duracion_min,
  descripcion: e.descripcion, zona_muscular: e.zona_muscular,
}))

export const COLOR_CAT = {
  'Calentamiento': '#5eead4', 'Posesión': '#2dd4bf', 'Transiciones': '#3b82f6',
  'Presión': '#f59e0b', 'Finalización': '#ef4444', 'Balón parado': '#3b82f6',
  'Porteros': '#8b5cf6', 'Partido': '#8b5cf6', 'General': '#a1a1aa',
}

// ── Biblioteca ────────────────────────────────────────────────
export async function listarBiblioteca() {
  const { data, error } = await supabase
    .from('ejercicios_biblioteca')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })
  if (error) return BIBLIOTECA_BASE // fallback
  return data.length ? data : BIBLIOTECA_BASE
}

// Solo ejercicios base (predefinidos, compartidos entre todos los entrenadores)
export async function listarEjerciciosBase() {
  const { data, error } = await supabase
    .from('ejercicios_biblioteca')
    .select('*')
    .eq('activo', true)
    .eq('es_base', true)
    .order('categoria', { ascending: true })
  if (error) return []
  return data || []
}

// Diccionario de sinónimos por tag — permite que buscar "control", "posesión", etc.
// devuelva ejercicios cuyo tag oficial es "Controles orientados", "Circulación", etc.
export const SINONIMOS_TAGS = {
  'amplitud ofensiva': ['amplitud', 'banda', 'extremo', 'ancho', 'abrir'],
  'cambios de orientación': ['cambio', 'orientación', 'campo abierto', 'switch'],
  'pases filtrados': ['filtrado', 'entre líneas', 'penetración', 'pase interior'],
  'pase y circulación': ['circulación', 'posesión', 'tiki-taka', 'salida', 'mantener balón', 'pases'],
  'tiro': ['tiro', 'remate', 'disparo', 'chut'],
  'conducción': ['conducción', 'llevar balón', 'progresar con balón'],
  'desmarques': ['desmarque', 'movimiento sin balón', 'apoyo'],
  'controles orientados': ['control', 'primer toque', 'dominio', 'recepción orientada'],
  'tercer hombre': ['tercer hombre', 'combinación'],
  'regate': ['regate', 'dribbling', 'uno contra uno'],
  'pared': ['pared', 'combinación corta', 'uno-dos'],
  'cobertura de balón': ['proteger balón', 'cobertura'],
  'último pase': ['asistencia', 'último pase', 'centro'],
  'entrada': ['entrada', 'tackle', 'barrida'],
  'acoso': ['presión', 'pressing', 'acoso', 'robo'],
  'cierre línea de pase': ['cortar pase', 'tapar', 'cierre línea'],
  'ayudas defensivas': ['ayuda', 'ayudas defensivas', 'apoyo defensivo'],
  'anticipación': ['anticipación', 'leer jugada', 'adelantarse'],
  'basculaciones': ['bascular', 'basculación', 'desplazamiento defensivo'],
  'interceptación': ['interceptar', 'interceptación', 'cortar'],
  'cobertura': ['cobertura', 'segunda línea'],
  'temporización': ['temporizar', 'temporización', 'ralentizar'],
  'presión tras pérdida': ['presión tras pérdida', 'contrapresión', 'gegenpressing', 'recuperar rápido'],
  'vigilancias': ['vigilancia', 'marcaje preventivo'],
}

// Devuelve true si el ejercicio matchea la búsqueda:
// nombre + descripción + tags + sinónimos de tags
export function ejercicioMatcheaQuery(ej, query) {
  if (!query || !query.trim()) return true
  const q = query.trim().toLowerCase()
  const hay = (s) => (s || '').toLowerCase().includes(q)
  if (hay(ej.nombre) || hay(ej.descripcion) || hay(ej.categoria)) return true
  if (hay(ej.complejidad) || hay(ej.competitividad)) return true
  const allTags = [...(ej.tags_ofensivos || []), ...(ej.tags_defensivos || [])]
  for (const tag of allTags) {
    if (hay(tag)) return true
    const sinonimos = SINONIMOS_TAGS[tag.toLowerCase()] || []
    if (sinonimos.some((s) => s.toLowerCase().includes(q) || q.includes(s.toLowerCase()))) return true
  }
  return false
}

export async function crearEjercicio(ej) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('ejercicios_biblioteca')
    .insert({ ...ej, user_id: u.user.id, es_base: false }).select().single()
  if (error) throw error
  return data
}

export async function actualizarEjercicio(id, cambios) {
  const { data, error } = await supabase.from('ejercicios_biblioteca')
    .update(cambios).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function borrarEjercicio(id) {
  const { error } = await supabase.from('ejercicios_biblioteca')
    .update({ activo: false }).eq('id', id)
  if (error) throw error
}

// ── Entrenos ──────────────────────────────────────────────────
export async function listarEntrenos(equipoId) {
  const key = 'entrenos_' + (equipoId || 'all')
  try {
    let q = supabase.from('entrenamientos').select('*').order('fecha', { ascending: true })
    if (equipoId) q = q.eq('equipo_id', equipoId)
    const { data, error } = await q
    if (error) throw error
    cacheSet(key, data)
    return data
  } catch (err) {
    const cached = cacheGet(key)
    if (cached !== null) return cached
    throw err
  }
}

export async function guardarEntreno(e, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const dur = (e.ejercicios || []).reduce((a, x) => a + (x.duracion_min || x.min || 0), 0)
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    fecha: e.fecha,
    objetivo: e.objetivo || '',
    notas: e.notas || '',
    ejercicios: e.ejercicios || [],
    duracion: dur,
    asistencia: e.asistencia || {},
  }
  if (e.id) {
    const { data, error } = await supabase.from('entrenamientos').update(payload).eq('id', e.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('entrenamientos').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function borrarEntreno(id) {
  const { error } = await supabase.from('entrenamientos').delete().eq('id', id)
  if (error) throw error
}

export async function borrarTodosEntrenos(equipoId) {
  if (!equipoId) return
  const { error } = await supabase.from('entrenamientos').delete().eq('equipo_id', equipoId)
  if (error) throw error
}
