import { supabase } from './supabase'

// Capa de datos de Jugadores — única fuente de verdad (como el DB.jugadores de la demo)
export async function listarJugadores() {
  const { data, error } = await supabase
    .from('jugadores')
    .select('*')
    .order('dorsal', { ascending: true })
  if (error) throw error
  return data
}

export async function crearJugador(j) {
  const { data: u } = await supabase.auth.getUser()
  const payload = { ...j, user_id: u.user.id }
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

export async function eliminarJugador(id) {
  const { error } = await supabase.from('jugadores').delete().eq('id', id)
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
