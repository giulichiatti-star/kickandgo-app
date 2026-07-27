import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Email donde el cliente responde con el justificante adjunto.
const REPLY_TO = Deno.env.get('ADMIN_REPLY_TO') || 'lopezlucas290@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const PAGO = {
  precio: '20 €',
  iban: 'ES28 1583 0001 1490 5028 3293',
  beneficiario: 'Javier Herrero Jiménez',
  bizum: '+34 628 58 49 85',
}

function emailNoRecibido(nombre: string) {
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
  <span style="display:inline-block;padding:3px 12px;border-radius:100px;font-size:11px;font-weight:600;background:#fef9c3;color:#854d0e;margin-bottom:14px">Pago pendiente de confirmar</span>
  <h1 style="font-size:20px;font-weight:500;color:#18181b;margin:0 0 14px;line-height:1.35">Aún no hemos recibido tu pago</h1>
  <p style="font-size:14px;color:#52525b;line-height:1.65;margin:0 0 12px">Hola ${nombre}, gracias por avisarnos. De momento <b>no vemos el pago reflejado</b> en nuestra cuenta, así que aún no hemos podido activarlo.</p>
  <p style="font-size:14px;color:#52525b;line-height:1.65;margin:0 0 12px">Para agilizarlo, <b>responde a este email adjuntando el justificante</b> (una captura de la transferencia o del Bizum). En cuanto lo recibamos, confirmamos y tu cuenta queda activa.</p>
  <div style="background:#f8fafc;border:1px solid #e4e4e7;border-radius:10px;padding:16px 18px;margin:18px 0">
    <div style="font-size:12px;font-weight:700;color:#18181b;margin-bottom:8px">Datos de pago (${PAGO.precio}/mes)</div>
    <div style="font-size:13px;color:#52525b;line-height:1.7">
      <b>Transferencia</b><br>IBAN: ${PAGO.iban}<br>Beneficiario: ${PAGO.beneficiario}<br><br>
      <b>Bizum</b>: ${PAGO.bizum}
    </div>
  </div>
  <p style="font-size:14px;color:#52525b;line-height:1.65;margin:0 0 12px">Si ya lo habías pagado, no te preocupes: envíanos el justificante y lo resolvemos enseguida.</p>
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
      .select('email, entrenador')
      .eq('id', userId)
      .single()

    if (error || !perfil?.email) {
      return new Response(JSON.stringify({ ok: false, error: 'perfil no encontrado' }), { status: 404, headers: JSON_HEADERS })
    }

    const nombre = perfil.entrenador?.split(' ')[0] || 'entrenador'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Kick and Go <noreply@kickandgo.app>',
        to: [perfil.email],
        reply_to: REPLY_TO,
        subject: 'Aún no hemos recibido tu pago',
        html: emailNoRecibido(nombre),
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
