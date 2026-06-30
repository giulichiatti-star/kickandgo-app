import { supabase } from './supabase'

export async function crearLead({ nombre, email, telefono, equipo_nombre }) {
  const { error } = await supabase.from('leads').insert({ nombre, email, telefono, equipo_nombre })
  if (error) throw error
}

export async function listarLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('creado', { ascending: false })
  if (error) throw error
  return data || []
}

export async function actualizarLead(id, cambios) {
  const { error } = await supabase.from('leads').update(cambios).eq('id', id)
  if (error) throw error
}

export async function activarLeads(ids) {
  const { data, error } = await supabase.functions.invoke('crear-cuenta-lead', { body: { leadIds: ids } })
  if (error) throw error
  return data
}

export async function contactarLeads(ids) {
  const { data, error } = await supabase.functions.invoke('contactar-lead', { body: { leadIds: ids } })
  if (error) throw error
  return data
}

export function mensajeWhatsapp(lead) {
  const equipo = lead.equipo_nombre ? ` para ${lead.equipo_nombre}` : ''
  return `Hola ${lead.nombre} 👋 Soy del equipo de KickAndGo. Vi que pediste probar la app${equipo}. En 5 min te dejo activada tu cuenta con 15 días gratis — ¿me confirmas si jugáis fútbol 11 o fútbol 7?`
}

export function linkWhatsapp(lead) {
  const telefono = (lead.telefono || '').replace(/[^\d+]/g, '')
  const texto = encodeURIComponent(mensajeWhatsapp(lead))
  return `https://wa.me/${telefono}?text=${texto}`
}
