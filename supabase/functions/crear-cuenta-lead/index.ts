import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'KickAndGo <hola@kickandgo.app>'
const APP_URL = 'https://kickandgo.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

const DIAS_PRUEBA = 14

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

function emailBienvenida(nombre: string, email: string, password: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f11;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f11;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#064e3b,#0f172a);padding:32px 40px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#fafafa;letter-spacing:.5px;">
            KICK<span style="color:#10b981;">AND</span>GO ⚽
          </div>
          <div style="font-size:13px;color:#6ee7b7;margin-top:6px;font-weight:500;">Tu prueba gratuita está lista</div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#fafafa;">¡Hola ${nombre}! 👋</p>

          <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.7;">
            Tu cuenta de <b style="color:#fafafa;">KickAndGo</b> ya está activa.
            Tienes <b style="color:#10b981;">${DIAS_PRUEBA} días gratis</b> para probarlo todo, sin tarjeta de crédito.
          </p>

          <!-- CREDENCIALES -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111117;border-radius:12px;border:1px solid #27272a;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-size:11px;font-weight:700;color:#10b981;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Tus accesos</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:12px;color:#71717a;width:90px;">Usuario</td>
                  <td style="padding:6px 0;font-size:14px;color:#fafafa;font-weight:600;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:12px;color:#71717a;">Contraseña</td>
                  <td style="padding:6px 0;font-size:14px;color:#fafafa;font-weight:600;letter-spacing:1px;">${password}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="${APP_URL}/login" style="display:inline-block;background:#10b981;color:#022c22;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;">
                Entrar a KickAndGo →
              </a>
            </td></tr>
          </table>

          <!-- TIPS -->
          <div style="font-size:11px;font-weight:700;color:#10b981;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Para empezar rápido</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="padding:0 0 14px;font-size:14px;color:#d4d4d8;line-height:1.6;">
              <b style="color:#fafafa;">1. Añade tu plantilla</b> en la sección Plantilla (o importa por CSV si ya la tienes).
            </td></tr>
            <tr><td style="padding:0 0 14px;font-size:14px;color:#d4d4d8;line-height:1.6;">
              <b style="color:#fafafa;">2. Registra un partido</b> para ver estadísticas al instante.
            </td></tr>
            <tr><td style="padding:0;font-size:14px;color:#d4d4d8;line-height:1.6;">
              <b style="color:#fafafa;">3. Prueba En Vivo</b> el día del próximo partido — se controla desde el móvil.
            </td></tr>
          </table>

          <p style="margin:0 0 20px;font-size:13px;color:#52525b;line-height:1.6;">
            Te recomendamos cambiar la contraseña desde Ajustes una vez dentro.
            Si necesitas ayuda con algo, responde a este email y te respondemos.
          </p>

          <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">
            Un saludo,<br>
            <b style="color:#fafafa;">Lucas</b><br>
            <span style="color:#71717a;font-size:12px;">Fundador de Kick and Go</span>
          </p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#111117;border-top:1px solid #27272a;padding:20px 40px;text-align:center;">
          <div style="font-size:12px;color:#52525b;">
            © 2025 KickAndGo · <a href="${APP_URL}" style="color:#10b981;text-decoration:none;">kickandgo.app</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function altaUnLead(leadId: string) {
  const { data: lead, error: leadErr } = await supabase
    .from('leads').select('*').eq('id', leadId).single()
  if (leadErr || !lead) return { leadId, ok: false, error: 'Lead no encontrado' }
  if (lead.estado === 'activo') return { leadId, ok: false, error: 'Este lead ya tiene cuenta activa' }

  const password = generarPassword()

  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email: lead.email,
    password,
    email_confirm: true,
  })
  if (userErr) return { leadId, ok: false, error: userErr.message }

  const pruebaVence = new Date()
  pruebaVence.setDate(pruebaVence.getDate() + DIAS_PRUEBA)

  await supabase.from('profiles').upsert({
    id: userData.user.id,
    email: lead.email,
    club_nombre: lead.equipo_nombre || 'Mi club',
    entrenador: lead.nombre,
    activo: true,
    plan_estado: 'prueba',
    prueba_vence: pruebaVence.toISOString(),
  })

  await supabase.from('leads').update({
    estado: 'activo',
    activado_en: new Date().toISOString(),
    cuenta_user_id: userData.user.id,
  }).eq('id', leadId)

  let emailEnviado = true
  try {
    await resend.emails.send({
      from: RESEND_FROM,
      to: lead.email,
      subject: '¡Bienvenido a KickAndGo! Tus accesos',
      html: emailBienvenida(lead.nombre, lead.email, password),
    })
  } catch (e) {
    emailEnviado = false
    console.error('Error enviando email:', e)
  }

  return { leadId, ok: true, password, emailEnviado }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    const body = await req.json()
    const leadIds: string[] = Array.isArray(body.leadIds)
      ? body.leadIds
      : body.leadId ? [body.leadId] : []

    if (leadIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Falta leadId o leadIds' }), { status: 400, headers: JSON_HEADERS })
    }

    const resultados = []
    for (const leadId of leadIds) {
      resultados.push(await altaUnLead(leadId))
    }

    return new Response(JSON.stringify({ ok: true, resultados }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS })
  }
})
