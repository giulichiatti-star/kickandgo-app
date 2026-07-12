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

  // Límite de equipos por usuario (por defecto 2, salvo excepción explícita
  // guardada en profiles.max_equipos).
  const [{ count }, { data: perfil }] = await Promise.all([
    supabase.from('equipos').select('id', { count: 'exact', head: true }).eq('user_id', u.user.id),
    supabase.from('profiles').select('max_equipos').eq('id', u.user.id).maybeSingle(),
  ])
  const maxEquipos = perfil?.max_equipos || 2
  if ((count || 0) >= maxEquipos) {
    throw new Error(`Has alcanzado el límite de ${maxEquipos} equipo${maxEquipos === 1 ? '' : 's'} por cuenta. Contacta con soporte si necesitas más.`)
  }

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
