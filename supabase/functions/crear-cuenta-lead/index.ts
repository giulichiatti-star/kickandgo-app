import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'KickAndGo <onboarding@resend.dev>'
const APP_URL = Deno.env.get('APP_URL') || 'https://kickandgo-app.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { leadId } = await req.json()
    if (!leadId) return new Response(JSON.stringify({ error: 'Falta leadId' }), { status: 400 })

    const { data: lead, error: leadErr } = await supabase
      .from('leads').select('*').eq('id', leadId).single()
    if (leadErr || !lead) return new Response(JSON.stringify({ error: 'Lead no encontrado' }), { status: 404 })
    if (lead.estado === 'activo') return new Response(JSON.stringify({ error: 'Este lead ya tiene cuenta activa' }), { status: 400 })

    const password = generarPassword()

    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email: lead.email,
      password,
      email_confirm: true,
    })
    if (userErr) return new Response(JSON.stringify({ error: userErr.message }), { status: 400 })

    await supabase.from('profiles').upsert({
      id: userData.user.id,
      club_nombre: lead.equipo_nombre || 'Mi club',
      entrenador: lead.nombre,
      activo: true,
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
        html: `
          <p>Hola ${lead.nombre},</p>
          <p>Ya tienes acceso a <b>KickAndGo</b> durante 15 días gratis.</p>
          <p><b>Usuario:</b> ${lead.email}<br><b>Contraseña:</b> ${password}</p>
          <p><a href="${APP_URL}/?login=1">Entrar ahora</a></p>
          <p>Un saludo,<br>El equipo de KickAndGo</p>
        `,
      })
    } catch (e) {
      emailEnviado = false
      console.error('Error enviando email:', e)
    }

    return new Response(JSON.stringify({ ok: true, password, emailEnviado }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
