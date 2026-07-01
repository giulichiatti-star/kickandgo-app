import { supabase } from './supabase'

export async function listarCuentas() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, club_nombre, entrenador, activo, plan_estado, prueba_vence, pago_vence, ultimo_pago_en, creado')
    .order('creado', { ascending: false })
  if (error) throw error
  return data || []
}

const DIAS_CICLO_PAGO = 30

// El ciclo de cobro se ancla siempre a la fecha de vencimiento anterior
// (prueba_vence en el primer pago, pago_vence en renovaciones) — nunca al
// día en que realmente se hace clic — para que el día de cobro no derive.
export function proximoVencimiento(cuenta) {
  const anchor = (cuenta.plan_estado === 'pagado' || cuenta.plan_estado === 'mora') && cuenta.pago_vence
    ? cuenta.pago_vence
    : cuenta.prueba_vence
  const base = anchor ? new Date(anchor) : new Date()
  const nuevo = new Date(base)
  nuevo.setDate(nuevo.getDate() + DIAS_CICLO_PAGO)
  return nuevo
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
