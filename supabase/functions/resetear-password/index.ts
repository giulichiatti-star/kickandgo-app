import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    const { userId } = await req.json()
    if (!userId) return new Response(JSON.stringify({ error: 'Falta userId' }), { status: 400, headers: JSON_HEADERS })

    const password = generarPassword()
    const { error } = await supabase.auth.admin.updateUserById(userId, { password })
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: JSON_HEADERS })

    return new Response(JSON.stringify({ ok: true, password }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS })
  }
})
