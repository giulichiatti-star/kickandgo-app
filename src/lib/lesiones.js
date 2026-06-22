import { supabase } from './supabase'

export async function listarLesiones() {
  const { data, error } = await supabase
    .from('lesiones').select('*').order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data
}

export async function crearLesion(l) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    jugador_id: l.jugador_id,
    tipo: l.tipo || '',
    zona: l.zona || '',
    gravedad: l.gravedad || 'leve',
    fecha_inicio: l.fecha_inicio || new Date().toISOString().slice(0, 10),
    fecha_alta: l.fecha_alta || null,
    notas: l.notas || '',
    alta: false,
  }
  const { data, error } = await supabase.from('lesiones').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function darAlta(id) {
  const { error } = await supabase
    .from('lesiones').update({ alta: true, fecha_alta: new Date().toISOString().slice(0, 10) }).eq('id', id)
  if (error) throw error
}

export async function borrarLesion(id) {
  const { error } = await supabase.from('lesiones').delete().eq('id', id)
  if (error) throw error
}
