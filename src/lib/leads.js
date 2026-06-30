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

export async function activarLead(id) {
  const { data, error } = await supabase.functions.invoke('crear-cuenta-lead', { body: { leadId: id } })
  if (error) throw error
  return data
}
