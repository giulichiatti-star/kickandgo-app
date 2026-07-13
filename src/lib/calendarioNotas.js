import { supabase } from './supabase'

export async function listarNotasCalendario(equipoId) {
  let q = supabase.from('calendario_notas').select('*')
  q = equipoId ? q.eq('equipo_id', equipoId) : q.is('equipo_id', null)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function guardarNotaCalendario(fecha, texto, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = { user_id: u.user.id, equipo_id: equipoId || null, fecha, texto }
  const { data, error } = await supabase
    .from('calendario_notas')
    .upsert(payload, { onConflict: 'equipo_id,fecha' })
    .select().single()
  if (error) throw error
  return data
}

export async function borrarNotaCalendario(fecha, equipoId) {
  let q = supabase.from('calendario_notas').delete().eq('fecha', fecha)
  q = equipoId ? q.eq('equipo_id', equipoId) : q.is('equipo_id', null)
  const { error } = await q
  if (error) throw error
}
