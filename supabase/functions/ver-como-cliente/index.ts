import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    // 1) Verificar que quien llama es un admin real — nunca confiar en el frontend.
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: JSON_HEADERS })

    const { data: caller, error: callerError } = await admin.auth.getUser(jwt)
    if (callerError || !caller?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401, headers: JSON_HEADERS })
    }

    const { data: perfilAdmin } = await admin.from('profiles').select('is_admin').eq('id', caller.user.id).single()
    if (!perfilAdmin?.is_admin) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: JSON_HEADERS })
    }

    // 2) Buscar la cuenta del cliente objetivo.
    const { clienteId } = await req.json()
    if (!clienteId) return new Response(JSON.stringify({ error: 'Falta clienteId' }), { status: 400, headers: JSON_HEADERS })

    const { data: clienteData, error: clienteError } = await admin.auth.admin.getUserById(clienteId)
    if (clienteError || !clienteData?.user?.email) {
      return new Response(JSON.stringify({ error: 'Cliente no encontrado' }), { status: 404, headers: JSON_HEADERS })
    }
    const clienteEmail = clienteData.user.email

    // 3) Generar un magic link — no envía ningún email, solo devuelve el enlace
    // para que el admin lo abra él mismo (en una ventana de incógnito para no
    // pisar su propia sesión). El cliente nunca recibe aviso de esto.
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: clienteEmail,
      options: { redirectTo: 'https://www.kickandgo.app/inicio' },
    })
    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: linkError?.message || 'No se pudo generar el enlace' }), { status: 400, headers: JSON_HEADERS })
    }

    // 4) Registrar el acceso — log interno, solo lo ve el admin (nunca el cliente).
    await admin.from('admin_accesos').insert({
      admin_id: caller.user.id,
      cliente_id: clienteId,
      cliente_email: clienteEmail,
    })

    return new Response(JSON.stringify({ ok: true, link: linkData.properties.action_link, email: clienteEmail }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS })
  }
})
