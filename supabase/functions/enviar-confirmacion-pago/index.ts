import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function emailConfirmacion(nombre: string, fecha: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden">
<tr><td style="padding:22px 32px 20px;border-bottom:1px solid #f0f0f0;text-align:center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding-right:8px"><svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="5" height="24" rx="1.5" fill="#2dd4bf"/><path d="M11 16 L24 4 L31 4 L17 16 Z" fill="#2dd4bf"/><path d="M11 16 L17 16 L31 28 L24 28 Z" fill="#f59e0b"/></svg></td>
    <td style="font-size:15px;font-weight:500;color:#18181b">Kick and Go</td>
  </tr></table>
</td></tr>
<tr><td style="padding:28px 32px">
  <span style="display:inline-block;padding:3px 12px;border-radius:100px;font-size:11px;font-weight:600;background:#dcfce7;color:#166534;margin-bottom:14px">Pago recibido</span>
  <h1 style="font-size:20px;font-weight:500;color:#18181b;margin:0 0 14px;line-height:1.35">Pago recibido — todo en marcha</h1>
  <p style="font-size:14px;color:#52525b;line-height:1.65;margin:0 0 12px">Hola ${nombre}, ¡confirmado! Hemos recibido tu pago y tu cuenta queda activa hasta el <b>${fecha}</b>.</p>
  <p style="font-size:14px;color:#52525b;line-height:1.65;margin:0 0 12px">Gracias por confiar en Kick and Go. Seguimos acompañando a tu equipo temporada tras temporada.</p>
  <p style="font-size:14px;color:#52525b;line-height:1.65;margin:0 0 12px">Si necesitas cambiar algo o tienes cualquier duda, aquí estamos.</p>
  <p style="font-size:14px;color:#52525b;line-height:1.65;margin:22px 0 0">
    Un saludo,<br>
    <b style="color:#18181b">Lucas</b><br>
    <span style="color:#71717a;font-size:12px">Fundador de Kick and Go</span>
  </p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    const { userId } = await req.json()
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'userId requerido' }), { status: 400, headers: JSON_HEADERS })

    const { data: perfil, error } = await supabase
      .from('profiles')
      .select('email, entrenador, pago_vence')
      .eq('id', userId)
      .single()

    if (error || !perfil?.email) {
      return new Response(JSON.stringify({ ok: false, error: 'perfil no encontrado' }), { status: 404, headers: JSON_HEADERS })
    }

    const nombre = perfil.entrenador?.split(' ')[0] || 'entrenador'
    const fecha = perfil.pago_vence
      ? new Date(perfil.pago_vence).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'la próxima renovación'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Kick and Go <noreply@kickandgo.app>',
        to: [perfil.email],
        subject: 'Pago recibido — todo en marcha',
        html: emailConfirmacion(nombre, fecha),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ ok: false, error: err }), { status: 500, headers: JSON_HEADERS })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: JSON_HEADERS })
  }
})
