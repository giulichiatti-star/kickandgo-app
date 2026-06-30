import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'
import { CORS_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'KickAndGo <onboarding@resend.dev>'
const APP_URL = Deno.env.get('APP_URL') || 'https://kickandgo-app.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

const DIAS_PRUEBA = 15

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
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
      html: `
        <p>Hola ${lead.nombre},</p>
        <p>Ya tienes acceso a <b>KickAndGo</b> durante ${DIAS_PRUEBA} días gratis.</p>
        <p><b>Usuario:</b> ${lead.email}<br><b>Contraseña:</b> ${password}</p>
        <p><a href="${APP_URL}/?login=1">Entrar ahora</a></p>
        <p>Un saludo,<br>El equipo de KickAndGo</p>
      `,
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
      return new Response(JSON.stringify({ error: 'Falta leadId o leadIds' }), { status: 400, headers: CORS_HEADERS })
    }

    const resultados = []
    for (const leadId of leadIds) {
      resultados.push(await altaUnLead(leadId))
    }

    return new Response(JSON.stringify({ ok: true, resultados }), { status: 200, headers: CORS_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS })
  }
})
