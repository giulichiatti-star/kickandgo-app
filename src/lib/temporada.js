import { supabase } from './supabase'

export async function getTemporada(equipoId) {
  const { data, error } = await supabase
    .from('temporadas')
    .select('*')
    .eq('equipo_id', equipoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function guardarTemporada(t, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    nombre: t.nombre || '',
    objetivo_posicion: t.objetivo_posicion ?? null,
    objetivo_victorias_pct: t.objetivo_victorias_pct ?? null,
    objetivo_goles_favor: t.objetivo_goles_favor ?? null,
    objetivo_goles_contra: t.objetivo_goles_contra ?? null,
    hitos: t.hitos || [],
  }
  if (t.id) {
    const { data, error } = await supabase.from('temporadas').update(payload).eq('id', t.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('temporadas').insert(payload).select().single()
  if (error) throw error
  return data
}
