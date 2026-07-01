import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    const { userId } = await req.json()
    if (!userId) return new Response(JSON.stringify({ error: 'Falta userId' }), { status: 400, headers: JSON_HEADERS })

    // Desvincula el lead asociado (si existe) para no dejarlo apuntando a una cuenta borrada
    await supabase.from('leads').update({
      cuenta_user_id: null,
      estado: 'descartado',
    }).eq('cuenta_user_id', userId)

    // Tablas creadas fuera del repo (sin garantía de ON DELETE CASCADE) — limpieza explícita
    await supabase.from('equipos').delete().eq('user_id', userId)
    await supabase.from('temporadas').delete().eq('user_id', userId)
    await supabase.from('push_subscriptions').delete().eq('user_id', userId)

    // Borra el usuario de Auth — el resto (profiles, jugadores, partidos, convocatorias,
    // entrenamientos, tarjetas, lesiones, ejercicios_biblioteca) cascada automáticamente
    // vía "on delete cascade" hacia auth.users en el esquema.
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: JSON_HEADERS })

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS })
  }
})
