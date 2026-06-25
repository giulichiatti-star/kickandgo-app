import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'

export async function listarJugadores(equipoId) {
  const key = 'jugadores_' + (equipoId || 'all')
  try {
    let q = supabase.from('jugadores').select('*').order('dorsal', { ascending: true })
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

export async function crearJugador(j, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = { tipo_equipo: '11', ...j, user_id: u.user.id, equipo_id: equipoId }
  const { data, error } = await supabase.from('jugadores').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function actualizarJugador(id, cambios) {
  const { data, error } = await supabase
    .from('jugadores').update(cambios).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function crearJugadoresBulk(list, equipoId, tipo = '11') {
  const { data: u } = await supabase.auth.getUser()
  const rows = list.map((j) => ({
    user_id: u.user.id,
    equipo_id: equipoId,
    nombre: j.nombre,
    dorsal: j.dorsal || 0,
    posicion: j.posicion || 'Mediocampista',
    estado: 'activo',
    tipo_equipo: tipo,
  }))
  const { data, error } = await supabase.from('jugadores').insert(rows).select()
  if (error) throw error
  return data
}

export async function eliminarJugador(id) {
  const { error } = await supabase.from('jugadores').delete().eq('id', id)
  if (error) throw error
}

export async function vaciarPlantilla(equipoId) {
  if (!equipoId) return
  const { error } = await supabase.from('jugadores').delete().eq('equipo_id', equipoId)
  if (error) throw error
}

export function posACat(posicion) {
  const p = (posicion || '').toLowerCase()
  if (/portero|arquero|guardameta/.test(p)) return 'POR'
  if (/lateral|central|defensa|carrilero/.test(p)) return 'DEF'
  if (/medio|pivote|mediapunta|interior|volante|enganche/.test(p)) return 'MED'
  return 'DEL'
}
