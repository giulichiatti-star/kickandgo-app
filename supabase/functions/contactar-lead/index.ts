import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'
import { CORS_HEADERS } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'KickAndGo <onboarding@resend.dev>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

function emailHtml(nombre: string, equipo: string) {
  const equipoLinea = equipo ? ` para ${equipo}` : ''
  return `
    <p>Hola ${nombre},</p>
    <p>Gracias por tu interés en <b>KickAndGo</b>. Antes de activar tu cuenta de prueba (15 días, sin tarjeta)${equipoLinea},
    solo necesito confirmar: ¿tu equipo juega en fútbol 11 o fútbol 7?</p>
    <p>En cuanto me lo confirmes, te llegará un email con tu usuario y contraseña para entrar directamente.</p>
    <p>Un saludo,<br>El equipo de KickAndGo</p>
  `
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  try {
    const { leadIds } = await req.json()
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Falta leadIds' }), { status: 400, headers: CORS_HEADERS })
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

    return new Response(JSON.stringify({ ok: true, resultados }), { status: 200, headers: CORS_HEADERS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS })
  }
})
