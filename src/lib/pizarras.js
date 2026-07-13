import { supabase } from './supabase'

export async function listarPizarras(equipoId) {
  let q = supabase.from('pizarras_tacticas').select('*').order('actualizado', { ascending: false })
  q = equipoId ? q.eq('equipo_id', equipoId) : q.is('equipo_id', null)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function crearPizarra(nombre, frames, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('pizarras_tacticas')
    .insert({ user_id: u.user.id, equipo_id: equipoId || null, nombre, frames })
    .select().single()
  if (error) throw error
  return data
}

export async function actualizarPizarra(id, nombre, frames) {
  const { data, error } = await supabase
    .from('pizarras_tacticas')
    .update({ nombre, frames, actualizado: new Date().toISOString() })
    .eq('id', id)
    .select().single()
  if (error) throw error
  return data
}

export async function borrarPizarra(id) {
  const { error } = await supabase.from('pizarras_tacticas').delete().eq('id', id)
  if (error) throw error
}
