import { supabase } from './supabase'

// Genera un enlace de acceso a la cuenta de un cliente (soporte técnico
// puntual). Registra el acceso en admin_accesos (log interno, no visible
// para el cliente). El enlace debe abrirse en una ventana de incógnito para
// no reemplazar la sesión del propio admin en este navegador.
export async function generarAccesoCliente(clienteId) {
  const { data, error } = await supabase.functions.invoke('ver-como-cliente', { body: { clienteId } })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data // { link, email }
}

export async function listarAccesos(limite = 30) {
  const { data, error } = await supabase
    .from('admin_accesos')
    .select('*')
    .order('creado', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data || []
}
