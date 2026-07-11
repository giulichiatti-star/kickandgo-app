import { supabase } from './supabase'

function hoyISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

export async function listarLesiones(equipoId) {
  let q = supabase.from('lesiones').select('*').order('fecha_inicio', { ascending: false })
  if (equipoId) q = q.eq('equipo_id', equipoId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function crearLesion(l, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId || null,
    jugador_id: l.jugador_id,
    tipo: l.tipo || '',
    zona: l.zona || '',
    gravedad: l.gravedad || 'leve',
    fecha_inicio: l.fecha_inicio || hoyISO(),
    fecha_alta: l.fecha_alta || null,
    notas: l.notas || '',
    alta: false,
  }
  const { data, error } = await supabase.from('lesiones').insert(payload).select().single()
  if (error) throw error
  // Marcar jugador como lesionado automáticamente
  await supabase.from('jugadores').update({ estado: 'lesionado' }).eq('id', l.jugador_id)
  return data
}

export async function darAlta(id, jugadorId) {
  const { error } = await supabase
    .from('lesiones').update({ alta: true, fecha_alta: hoyISO() }).eq('id', id)
  if (error) throw error
  // Restaurar jugador a activo solo si no tiene otras lesiones activas
  if (jugadorId) {
    const { data: otras } = await supabase
      .from('lesiones').select('id').eq('jugador_id', jugadorId).eq('alta', false).neq('id', id)
    if (!otras?.length) {
      await supabase.from('jugadores').update({ estado: 'activo' }).eq('id', jugadorId)
    }
  }
}

export async function borrarLesion(id, jugadorId) {
  const { error } = await supabase.from('lesiones').delete().eq('id', id)
  if (error) throw error
  // Restaurar jugador a activo si no quedan lesiones activas
  if (jugadorId) {
    const { data: otras } = await supabase
      .from('lesiones').select('id').eq('jugador_id', jugadorId).eq('alta', false)
    if (!otras?.length) {
      await supabase.from('jugadores').update({ estado: 'activo' }).eq('id', jugadorId)
    }
  }
}
