import { supabase } from './supabase'

export async function guardarPartido(p) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    fecha: p.fecha || new Date().toISOString().slice(0, 10),
    rival: p.rival || '',
    local_visitante: p.local_visitante || 'local',
    formacion: p.formacion || '433',
    gf: p.gf || 0,
    gc: p.gc || 0,
    estado: 'finalizado',
    notas: p.eventos || [],
    analisis_ia: p.notas_entrenador || p.analisis_ia || '',
  }
  const { data, error } = await supabase.from('partidos').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function listarPartidos() {
  const { data, error } = await supabase
    .from('partidos').select('*').order('fecha', { ascending: false })
  if (error) throw error
  return data
}

export async function borrarPartido(id) {
  const { error } = await supabase.from('partidos').delete().eq('id', id)
  if (error) throw error
}

export async function borrarTodosPartidos() {
  const { data: u } = await supabase.auth.getUser()
  const { error } = await supabase.from('partidos').delete().eq('user_id', u.user.id)
  if (error) throw error
}
