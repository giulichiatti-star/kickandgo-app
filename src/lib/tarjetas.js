import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'

function hoyISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

export async function listarTarjetas(equipoId) {
  const key = 'tarjetas_' + (equipoId || 'all')
  try {
    let q = supabase.from('tarjetas').select('*').order('creado', { ascending: false })
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

export async function crearTarjeta(t, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    jugador_id: t.jugador_id,
    tipo: t.tipo || 'amarilla',
    fecha: t.fecha || hoyISO(),
    minuto: t.minuto || null,
    motivo: t.motivo || '',
  }
  const { data, error } = await supabase.from('tarjetas').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function borrarTarjeta(id) {
  const { error } = await supabase.from('tarjetas').delete().eq('id', id)
  if (error) throw error
}

export async function borrarTodasTarjetas(equipoId) {
  if (!equipoId) return
  const { error } = await supabase.from('tarjetas').delete().eq('equipo_id', equipoId)
  if (error) throw error
}
