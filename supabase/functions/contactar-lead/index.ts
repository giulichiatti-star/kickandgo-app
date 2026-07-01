import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'KickAndGo <hola@kickandgo.app>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

function emailHtml(nombre: string, equipo: string) {
  const equipoLinea = equipo ? `<b>${equipo}</b>` : 'tu equipo'
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f11;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f11;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#064e3b,#0f172a);padding:32px 40px;text-align:center;">
          <div style="font-family:'Helvetica Neue',sans-serif;font-size:24px;font-weight:800;color:#fafafa;letter-spacing:.5px;">
            KICK<span style="color:#10b981;">AND</span>GO ⚽
          </div>
          <div style="font-size:13px;color:#6ee7b7;margin-top:6px;font-weight:500;">La app para entrenadores que ganan</div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#fafafa;">¡Hola ${nombre}! 👋</p>

          <p style="margin:0 0 16px;font-size:15px;color:#a1a1aa;line-height:1.7;">
            Gracias por querer probar <b style="color:#fafafa;">KickAndGo</b> con ${equipoLinea}.
            Estamos encantados de tenerte aquí.
          </p>

          <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.7;">
            En breve te enviaremos tus accesos para comenzar tu
            <b style="color:#10b981;">prueba gratuita de 15 días</b> — sin tarjeta de crédito, sin compromiso.
            La cuenta se configura por defecto en <b style="color:#fafafa;">Fútbol 11</b>,
            y puedes ajustar el tipo de equipo desde los ajustes en cualquier momento.
          </p>

          <!-- FEATURES -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111117;border-radius:12px;border:1px solid #27272a;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-size:11px;font-weight:700;color:#10b981;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Lo que vas a poder hacer desde el día 1</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:5px 0;font-size:13px;color:#d4d4d8;">⚽ &nbsp;Gestión de plantilla</td>
                  <td width="50%" style="padding:5px 0;font-size:13px;color:#d4d4d8;">📋 &nbsp;Convocatorias tácticas</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#d4d4d8;">🧠 &nbsp;IA Coach en tiempo real</td>
                  <td style="padding:5px 0;font-size:13px;color:#d4d4d8;">📊 &nbsp;Estadísticas y análisis</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:13px;color:#d4d4d8;">🔴 &nbsp;Modo En Vivo en el campo</td>
                  <td style="padding:5px 0;font-size:13px;color:#d4d4d8;">🗓️ &nbsp;Planificación de temporada</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;color:#71717a;line-height:1.6;">
            Si tienes cualquier duda antes de empezar, responde a este email o escríbenos directamente.
            Estamos aquí para ayudarte.
          </p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#111117;border-top:1px solid #27272a;padding:20px 40px;text-align:center;">
          <div style="font-size:12px;color:#52525b;">
            © 2025 KickAndGo · <a href="https://kickandgo.app" style="color:#10b981;text-decoration:none;">kickandgo.app</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    const { leadIds } = await req.json()
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Falta leadIds' }), { status: 400, headers: JSON_HEADERS })
    }

    const resultados = []
    for (const leadId of leadIds) {
      try {
        const { data: lead, error: leadErr } = await supabase
          .from('leads').select('*').eq('id', leadId).single()
        if (leadErr || !lead) { resultados.push({ leadId, ok: false, error: 'Lead no encontrado' }); continue }

        await resend.emails.send({
          from: RESEND_FROM,
          to: lead.email,
          subject: 'Tu prueba gratuita de KickAndGo',
          html: emailHtml(lead.nombre, lead.equipo_nombre),
        })

        await supabase.from('leads').update({
          estado: 'contactado',
          contactado_en: new Date().toISOString(),
        }).eq('id', leadId)

        resultados.push({ leadId, ok: true })
      } catch (e) {
        resultados.push({ leadId, ok: false, error: e.message })
      }
    }

    return new Response(JSON.stringify({ ok: true, resultados }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS })
  }
})
