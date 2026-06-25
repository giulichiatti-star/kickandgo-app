import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'

export async function guardarPartido(p, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    fecha: p.fecha || new Date().toISOString().slice(0, 10),
    rival: p.rival || '',
    local_visitante: p.local_visitante || 'local',
    formacion: p.formacion || '433',
    gf: p.gf || 0,
    gc: p.gc || 0,
    estado: 'finalizado',
    notas: p.eventos || [],
    analisis_ia: p.notas_entrenador || p.analisis_ia || '',
    valoraciones: p.valoraciones || {},
  }
  const { data, error } = await supabase.from('partidos').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function listarPartidos(equipoId) {
  const key = 'partidos_' + (equipoId || 'all')
  try {
    let q = supabase.from('partidos').select('*').order('fecha', { ascending: false })
    if (equipoId) q = q.eq('equipo_id', equipoId)
    const { data, error } = await q
    if (error) throw error
    cacheSet(key, data)
    return data
  } catch (err) {
    const cached = cacheGet(key)
    if (cached !== null) return cached
    throw err
  }
}

export async function guardarActa(id, acta) {
  const { error } = await supabase.from('partidos').update({ acta }).eq('id', id)
  if (error) throw error
}

export async function borrarPartido(id) {
  const { error } = await supabase.from('partidos').delete().eq('id', id)
  if (error) throw error
}

export async function borrarTodosPartidos(equipoId) {
  if (!equipoId) return
  const { error } = await supabase.from('partidos').delete().eq('equipo_id', equipoId)
  if (error) throw error
}
