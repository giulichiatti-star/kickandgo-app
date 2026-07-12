import { supabase } from './supabase'

export async function guardarConvocatoria({ rival, fecha, formacion, titulares, suplentes, horaPartido, horaConvocatoria, lugar }, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    rival: rival || '',
    fecha: fecha || '',
    formacion: formacion || '433',
    titulares,
    suplentes,
    hora_partido: horaPartido || '',
    hora_convocatoria: horaConvocatoria || '',
    lugar: lugar || '',
  }
  const { data, error } = await supabase.from('convocatorias').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function borrarConvocatoria(id) {
  const { error } = await supabase.from('convocatorias').delete().eq('id', id)
  if (error) throw error
}

export async function listarConvocatorias(equipoId) {
  let q = supabase.from('convocatorias').select('*').order('fecha', { ascending: true })
  if (equipoId) q = q.eq('equipo_id', equipoId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function ultimaConvocatoria(equipoId) {
  let q = supabase.from('convocatorias').select('*').order('creado', { ascending: false }).limit(1)
  if (equipoId) q = q.eq('equipo_id', equipoId)
  const { data, error } = await q.maybeSingle()
  if (error) throw error
  return data
}
