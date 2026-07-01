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
  const equipo = lead.equipo_nombre ? `*${lead.equipo_nombre}*` : 'tu equipo'
  return `⚽ ¡Hola ${lead.nombre}! Soy del equipo de *KickAndGo* 🚀

Vi que te interesó probar la app para ${equipo}. Te escribo para confirmarte que en breve te mandamos los accesos a tu cuenta.

🎁 *15 días gratis — sin tarjeta de crédito*

✅ Gestión de plantilla completa
🧠 IA Coach en tiempo real
📋 Convocatorias tácticas interactivas
🔴 Modo En Vivo desde el campo
📊 Estadísticas y análisis de partidos

La cuenta se activa en *Fútbol 11* por defecto, puedes cambiarlo cuando quieras desde los ajustes.

¿Alguna pregunta antes de empezar? Aquí estoy 👇`
}

export function linkWhatsapp(lead) {
  const telefono = (lead.telefono || '').replace(/[^\d+]/g, '')
  const texto = encodeURIComponent(mensajeWhatsapp(lead))
  return `https://wa.me/${telefono}?text=${texto}`
}
