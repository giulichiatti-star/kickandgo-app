import { supabase } from './supabase'

export async function guardarConvocatoria({ rival, fecha, formacion, titulares, suplentes }, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    rival: rival || '',
    fecha: fecha || '',
    formacion: formacion || '433',
    titulares,
    suplentes,
  }
  const { data, error } = await supabase.from('convocatorias').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function ultimaConvocatoria(equipoId) {
  let q = supabase.from('convocatorias').select('*').order('creado', { ascending: false }).limit(1)
  if (equipoId) q = q.eq('equipo_id', equipoId)
  const { data, error } = await q.maybeSingle()
  if (error) throw error
  return data
}
