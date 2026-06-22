import { supabase } from './supabase'

// Capa de datos de Jugadores — única fuente de verdad (como el DB.jugadores de la demo)
// Si se pasa `tipo` ('11'|'9'|'7') filtra solo esa plantilla; sin tipo devuelve todas.
export async function listarJugadores(tipo) {
  let q = supabase.from('jugadores').select('*').order('dorsal', { ascending: true })
  if (tipo) q = q.eq('tipo_equipo', tipo)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function crearJugador(j) {
  const { data: u } = await supabase.auth.getUser()
  const payload = { tipo_equipo: '11', ...j, user_id: u.user.id }
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

export async function crearJugadoresBulk(list, tipo = '11') {
  const { data: u } = await supabase.auth.getUser()
  const rows = list.map((j) => ({
    user_id: u.user.id,
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

// Vacía la plantilla del usuario. Si se pasa `tipo`, solo esa (F11/F9/F7); sin tipo, todas.
export async function vaciarPlantilla(tipo) {
  const { data: u } = await supabase.auth.getUser()
  let q = supabase.from('jugadores').delete().eq('user_id', u.user.id)
  if (tipo) q = q.eq('tipo_equipo', tipo)
  const { error } = await q
  if (error) throw error
}

// Categoría corta desde la posición (igual que en la demo)
export function posACat(posicion) {
  const p = (posicion || '').toLowerCase()
  if (/portero|arquero|guardameta/.test(p)) return 'POR'
  if (/lateral|central|defensa|carrilero/.test(p)) return 'DEF'
  if (/medio|pivote|mediapunta|interior|volante|enganche/.test(p)) return 'MED'
  return 'DEL'
}
