import { supabase } from './supabase'

export async function listarEquipos() {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('equipos').select('*').eq('user_id', u.user.id).order('created_at')
  if (error) throw error
  return data || []
}

export async function crearEquipo(eq) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('equipos').insert({ ...eq, user_id: u.user.id }).select().single()
  if (error) throw error
  return data
}

export async function actualizarEquipo(id, cambios) {
  const { data, error } = await supabase
    .from('equipos').update(cambios).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function eliminarEquipo(id) {
  const { error } = await supabase.from('equipos').delete().eq('id', id)
  if (error) throw error
}
