import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'
import { CORS_HEADERS, JSON_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'KickAndGo <hola@kickandgo.app>'
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'lopezlucas290@gmail.com'
const APP_URL = 'https://kickandgo.app'
const DIAS_PRUEBA = 15

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

function emailBienvenida(nombre: string, email: string, password: string, equipo: string) {
  const equipoLinea = equipo ? `<b>${equipo}</b>` : 'tu equipo'
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f11;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f11;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#064e3b,#0f172a);padding:32px 40px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#fafafa;letter-spacing:.5px;">KICK<span style="color:#10b981;">AND</span>GO ⚽</div>
          <div style="font-size:13px;color:#6ee7b7;margin-top:6px;font-weight:500;">Tu prueba gratuita está lista</div>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#fafafa;">¡Hola ${nombre}! 👋</p>
          <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.7;">
            Tu cuenta de <b style="color:#fafafa;">KickAndGo</b> para ${equipoLinea} ya está activa.
            Tienes <b style="color:#10b981;">${DIAS_PRUEBA} días gratis</b> para probarlo todo, sin tarjeta de crédito.
          </p>
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
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${APP_URL}/login" style="display:inline-block;background:#10b981;color:#022c22;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;">
                Entrar a KickAndGo →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#52525b;line-height:1.6;">
            Te recomendamos cambiar la contraseña desde Ajustes una vez dentro. Si tienes cualquier duda, responde a este email.
          </p>
        </td></tr>
        <tr><td style="background:#111117;border-top:1px solid #27272a;padding:20px 40px;text-align:center;">
          <div style="font-size:12px;color:#52525b;">© 2025 KickAndGo · <a href="${APP_URL}" style="color:#10b981;text-decoration:none;">kickandgo.app</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function emailNotifAdmin(nombre: string, email: string, telefono: string, equipo: string, hora: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f11;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f11;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:24px 32px;">
          <div style="font-size:20px;font-weight:800;color:#fafafa;">🆕 Nuevo cliente — KickAndGo</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">${hora}</div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:7px 0;font-size:12px;color:#71717a;width:90px;">Nombre</td><td style="font-size:14px;color:#fafafa;font-weight:600;">${nombre}</td></tr>
            <tr><td style="padding:7px 0;font-size:12px;color:#71717a;">Email</td><td style="font-size:14px;color:#fafafa;">${email}</td></tr>
            <tr><td style="padding:7px 0;font-size:12px;color:#71717a;">Teléfono</td><td style="font-size:14px;color:#fafafa;">${telefono || '—'}</td></tr>
            <tr><td style="padding:7px 0;font-size:12px;color:#71717a;">Equipo</td><td style="font-size:14px;color:#fafafa;">${equipo || '—'}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="${APP_URL}/admin" style="display:inline-block;background:#3b82f6;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;">Ver panel admin →</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    const { nombre, email, telefono, equipo_nombre } = await req.json()
    if (!nombre || !email) {
      return new Response(JSON.stringify({ error: 'Faltan nombre o email' }), { status: 400, headers: JSON_HEADERS })
    }

    const ahora = new Date().toISOString()
    const hora = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'short' })

    // 1. Insertar lead
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({ nombre, email, telefono, equipo_nombre, estado: 'nuevo' })
      .select().single()
    if (leadErr) return new Response(JSON.stringify({ error: 'lead_insert: ' + leadErr.message }), { status: 400, headers: JSON_HEADERS })

    // 2. Crear cuenta Supabase
    const password = generarPassword()
    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (userErr) console.error('createUser error:', userErr.message, userErr.status)

    let cuentaCreada = false
    if (!userErr && userData?.user) {
      cuentaCreada = true
      const pruebaVence = new Date()
      pruebaVence.setDate(pruebaVence.getDate() + DIAS_PRUEBA)

      await supabase.from('profiles').upsert({
        id: userData.user.id,
        email,
        club_nombre: equipo_nombre || 'Mi club',
        entrenador: nombre,
        activo: true,
        plan_estado: 'prueba',
        prueba_vence: pruebaVence.toISOString(),
      })

      await supabase.from('leads').update({
        estado: 'activo',
        activado_en: ahora,
        cuenta_user_id: userData.user.id,
      }).eq('id', lead.id)
    }

    // 3. Email al cliente (si cuenta creada)
    let emailClienteOk = false
    if (cuentaCreada) {
      try {
        await resend.emails.send({
          from: RESEND_FROM,
          to: email,
          subject: '¡Bienvenido a KickAndGo! Tus accesos',
          html: emailBienvenida(nombre, email, password, equipo_nombre || ''),
        })
        emailClienteOk = true
        await supabase.from('leads').update({ estado: 'activo', email_enviado: true }).eq('id', lead.id)
      } catch (e) {
        console.error('Error email cliente:', e)
      }
    }

    // 4. Notificación al admin
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: ADMIN_EMAIL,
        subject: `🆕 Nuevo cliente: ${nombre}`,
        html: emailNotifAdmin(nombre, email, telefono || '', equipo_nombre || '', hora),
      })
    } catch (e) {
      console.error('Error email admin:', e)
    }

    return new Response(JSON.stringify({ ok: true, cuentaCreada, emailClienteOk }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS })
  }
})
