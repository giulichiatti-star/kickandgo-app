import { supabase } from './supabase'

export async function getPerfil() {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', u.user.id).single()
  if (error) throw error
  return { ...data, email: u.user.email }
}

export async function updatePerfil(cambios) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles').update(cambios).eq('id', u.user.id).select().single()
  if (error) throw error
  return data
}
