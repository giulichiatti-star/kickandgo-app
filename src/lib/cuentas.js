import { supabase } from './supabase'

export async function listarCuentas() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, club_nombre, entrenador, activo, plan_estado, prueba_vence, pago_vence, ultimo_pago_en, creado, es_fundador')
    .order('creado', { ascending: false })
  if (error) throw error
  return data || []
}

export async function marcarFundador(id, valor) {
  const { error } = await supabase.from('profiles').update({ es_fundador: valor }).eq('id', id)
  if (error) throw error
}

// Avanza un mes manteniendo el mismo día del mes (no "+30 días") — así el
// cliente siempre paga el mismo día de cada mes, como una suscripción real.
// Si el mes destino no tiene ese día (ej. día 31 en febrero), se ajusta al
// último día disponible de ese mes.
function addMonths(fecha, n) {
  const d = new Date(fecha)
  const dia = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const diasEnMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(dia, diasEnMes))
  return d
}

// El ciclo de cobro se ancla siempre a la fecha de vencimiento anterior
// (prueba_vence en el primer pago, pago_vence en renovaciones) — nunca al
// día en que realmente se hace clic — para que el día de cobro no derive.
export function proximoVencimiento(cuenta) {
  const anchor = (cuenta.plan_estado === 'pagado' || cuenta.plan_estado === 'mora') && cuenta.pago_vence
    ? cuenta.pago_vence
    : cuenta.prueba_vence
  const base = anchor ? new Date(anchor) : new Date()
  return addMonths(base, 1)
}

export async function marcarPagado(cuenta) {
  const nuevoVence = proximoVencimiento(cuenta)
  const { error } = await supabase.from('profiles').update({
    plan_estado: 'pagado',
    pago_vence: nuevoVence.toISOString(),
    ultimo_pago_en: new Date().toISOString(),
    activo: true,
  }).eq('id', cuenta.id)
  if (error) throw error
}

export async function marcarMora(id) {
  const { error } = await supabase.from('profiles').update({ plan_estado: 'mora' }).eq('id', id)
  if (error) throw error
}

export async function darDeBaja(id) {
  const { error } = await supabase.from('profiles').update({ plan_estado: 'baja', activo: false }).eq('id', id)
  if (error) throw error
}

export async function reactivar(id) {
  const { error } = await supabase.from('profiles').update({ activo: true }).eq('id', id)
  if (error) throw error
}

export async function resetearPassword(userId) {
  const { data, error } = await supabase.functions.invoke('resetear-password', { body: { userId } })
  if (error) throw error
  return data
}

export async function eliminarCuenta(userId) {
  const { data, error } = await supabase.functions.invoke('eliminar-cuenta', { body: { userId } })
  if (error) throw error
  return data
}

export async function listarAvisosPago() {
  // Join manual (sin depender del nombre de la FK en Supabase, que puede no estar declarada)
  const { data: notif, error } = await supabase
    .from('payment_notifications')
    .select('id, metodo, estado, creado_en, user_id')
    .order('creado_en', { ascending: false })
  if (error) throw error
  if (!notif?.length) return []
  const ids = [...new Set(notif.map(n => n.user_id))]
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, club_nombre, entrenador, email, plan_estado')
    .in('id', ids)
  const map = Object.fromEntries((profs || []).map(p => [p.id, p]))
  return notif.map(n => ({ ...n, profiles: map[n.user_id] || null }))
}

export async function confirmarAviso(aviso, { enviarEmail = false } = {}) {
  // 1. Marcar notificación como confirmada
  const { error: errNotif } = await supabase
    .from('payment_notifications')
    .update({ estado: 'confirmado', confirmado_en: new Date().toISOString() })
    .eq('id', aviso.id)
  if (errNotif) throw errNotif

  // 2. Buscar cuenta completa y marcarla pagada
  const { data: cuenta, error: errCuenta } = await supabase
    .from('profiles')
    .select('id, plan_estado, prueba_vence, pago_vence')
    .eq('id', aviso.user_id)
    .single()
  if (errCuenta) throw errCuenta
  await marcarPagado(cuenta)

  // 3. Opcional: email de confirmación al cliente
  if (enviarEmail) {
    try { await supabase.functions.invoke('enviar-confirmacion-pago', { body: { userId: aviso.user_id } }) }
    catch (e) { console.error('Email confirmación falló:', e) }
  }
}
