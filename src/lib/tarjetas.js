import { supabase } from './supabase'

export async function listarTarjetas() {
  const { data, error } = await supabase
    .from('tarjetas').select('*').order('creado', { ascending: false })
  if (error) throw error
  return data
}

export async function crearTarjeta(t) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    jugador_id: t.jugador_id,
    tipo: t.tipo || 'amarilla',
    fecha: t.fecha || new Date().toISOString().slice(0, 10),
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

export async function borrarTodasTarjetas() {
  const { data: u } = await supabase.auth.getUser()
  const { error } = await supabase.from('tarjetas').delete().eq('user_id', u.user.id)
  if (error) throw error
}
