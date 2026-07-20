// Baja de emails comerciales/reactivación (enlace del pie de los emails).
// GET ?uid=<userId> → marca profiles.email_baja = true y muestra confirmación.
// ⚠️ SIEMPRE desplegar como PÚBLICA (se abre desde un email, sin login):
//    supabase functions deploy email-baja --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function pagina(mensaje: string, ok: boolean) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KickAndGo</title></head>
<body style="margin:0;background:#0f0f11;font-family:'Helvetica Neue',Arial,sans-serif;color:#fafafa;display:flex;min-height:100vh;align-items:center;justify-content:center;">
  <div style="max-width:440px;text-align:center;padding:40px 28px;background:#18181b;border:1px solid #27272a;border-radius:16px;margin:20px;">
    <div style="font-size:22px;font-weight:800;margin-bottom:16px;">KICK<span style="color:#10b981;">AND</span>GO ⚽</div>
    <div style="font-size:34px;margin-bottom:12px;">${ok ? '✅' : '⚠️'}</div>
    <p style="font-size:15px;color:#a1a1aa;line-height:1.6;margin:0 0 20px;">${mensaje}</p>
    <a href="https://kickandgo.app" style="color:#10b981;text-decoration:none;font-weight:700;font-size:14px;">Ir a kickandgo.app</a>
  </div>
</body></html>`
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const uid = url.searchParams.get('uid')
  const headers = { 'Content-Type': 'text/html; charset=utf-8' }

  if (!uid) return new Response(pagina('Enlace no válido.', false), { status: 400, headers })

  const { error } = await supabase.from('profiles').update({ email_baja: true }).eq('id', uid)
  if (error) return new Response(pagina('No se pudo procesar la baja. Escríbenos y lo hacemos manualmente.', false), { status: 500, headers })

  return new Response(
    pagina('Listo. No volverás a recibir emails de reactivación. Seguirás recibiendo los avisos importantes de tu cuenta (pagos y vencimientos).', true),
    { status: 200, headers },
  )
})
