import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'

export async function getPerfil() {
  const key = 'perfil'
  try {
    const { data: u } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', u.user.id).single()
    if (error) throw error
    const result = { ...data, email: u.user.email }
    cacheSet(key, result)
    return result
  } catch (err) {
    const cached = cacheGet(key)
    if (cached !== null) return cached
    throw err
  }
}

export async function updatePerfil(cambios) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles').update(cambios).eq('id', u.user.id).select().single()
  if (error) throw error
  return data
}
