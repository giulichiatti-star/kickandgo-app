import { supabase } from './supabase'

export async function listarCuentas() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, club_nombre, entrenador, activo, plan_estado, prueba_vence, pago_vence, ultimo_pago_en, creado')
    .order('creado', { ascending: false })
  if (error) throw error
  return data || []
}

export async function marcarPagado(id, pagoVenceISO) {
  const { error } = await supabase.from('profiles').update({
    plan_estado: 'pagado',
    pago_vence: pagoVenceISO,
    ultimo_pago_en: new Date().toISOString(),
    activo: true,
  }).eq('id', id)
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
