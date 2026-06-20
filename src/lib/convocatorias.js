import { supabase } from './supabase'

// Guardar (crea una nueva convocatoria)
export async function guardarConvocatoria({ rival, fecha, formacion, titulares, suplentes }) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    rival: rival || '',
    fecha: fecha || '',
    formacion: formacion || '433',
    titulares,
    suplentes,
  }
  const { data, error } = await supabase.from('convocatorias').insert(payload).select().single()
  if (error) throw error
  return data
}

// Última convocatoria guardada
export async function ultimaConvocatoria() {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .order('creado', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
