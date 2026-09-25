import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'
import { sincronizarTarjetasPartido } from './tarjetas'

function hoyISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

export async function guardarPartido(p, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    fecha: p.fecha || hoyISO(),
    rival: p.rival || '',
    local_visitante: p.local_visitante || 'local',
    formacion: p.formacion || '433',
    gf: p.gf || 0,
    gc: p.gc || 0,
    estado: 'finalizado',
    notas: p.eventos || [],
    analisis_ia: p.notas_entrenador || p.analisis_ia || '',
    valoraciones: p.valoraciones || {},
    alineacion: p.alineacion || null,
  }
  const { data, error } = await supabase.from('partidos').insert(payload).select().single()
  if (error) throw error
  // Las tarjetas del acta pasan a Disciplina. El partido ya está guardado: si
  // esto falla no se debe perder el partido (ni reintentarlo y duplicarlo).
  try {
    await sincronizarTarjetasPartido({ id: data.id, fecha: data.fecha, rival: data.rival, eventos: payload.notas }, equipoId)
  } catch (err) { console.error('[partidos] sincronizar tarjetas', err) }
  return data
}

export async function listarPartidos(equipoId) {
  const key = 'partidos_' + (equipoId || 'all')
  try {
    let q = supabase.from('partidos').select('*').eq('activo', true).order('fecha', { ascending: false })
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

export async function guardarValoracionesPartido(id, valoraciones) {
  const { error } = await supabase.from('partidos').update({ valoraciones }).eq('id', id)
  if (error) throw error
}

export async function editarMarcador(id, gf, gc) {
  const { error } = await supabase.from('partidos').update({ gf, gc }).eq('id', id)
  if (error) throw error
}

export async function guardarActa(id, acta) {
  const { error } = await supabase.from('partidos').update({ acta }).eq('id', id)
  if (error) throw error
}

export async function borrarPartido(id) {
  // Soft delete — mantiene el registro para recovery
  const { error } = await supabase.from('partidos').update({ activo: false }).eq('id', id)
  if (error) throw error
  // Las tarjetas de ese partido también dejan de contar en Disciplina.
  try {
    await supabase.from('tarjetas').delete().eq('partido_id', id)
  } catch (err) { console.error('[partidos] borrar tarjetas del partido', err) }
}

export async function borrarTodosPartidos(equipoId) {
  if (!equipoId) return
  const { error } = await supabase.from('partidos').delete().eq('equipo_id', equipoId)
  if (error) throw error
}
