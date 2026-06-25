import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@kickandgo.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function enviar(subscription: object, title: string, body: string, url = '/') {
  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, url, tag: 'kg-daily' }))
  } catch {}
}

Deno.serve(async () => {
  const hoy = new Date()
  const manana = new Date(hoy); manana.setDate(manana.getDate() + 1)
  const en3dias = new Date(hoy); en3dias.setDate(en3dias.getDate() + 3)
  const en2h = new Date(hoy); en2h.setHours(en2h.getHours() + 2)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  // Obtener todas las suscripciones con su user_id
  const { data: subs } = await supabase.from('push_subscriptions').select('user_id, subscription')
  if (!subs?.length) return new Response('ok', { status: 200 })

  for (const { user_id, subscription } of subs) {
    // 1. Partido próximo (convocatoria con fecha = mañana)
    const { data: convs } = await supabase
      .from('convocatorias')
      .select('rival, fecha')
      .eq('user_id', user_id)
      .eq('fecha', fmt(manana))
      .limit(1)
    if (convs?.length) {
      await enviar(subscription, '⚽ Partido mañana', `vs ${convs[0].rival} · Prepara al equipo`, '/convocatoria')
    }

    // 2. Alta médica próxima (fecha_alta entre hoy y en 3 días)
    const { data: lesiones } = await supabase
      .from('lesiones')
      .select('jugador_id, fecha_alta')
      .eq('user_id', user_id)
      .eq('alta', false)
      .gte('fecha_alta', fmt(hoy))
      .lte('fecha_alta', fmt(en3dias))
    for (const l of lesiones || []) {
      const { data: jug } = await supabase.from('jugadores').select('nombre').eq('id', l.jugador_id).single()
      if (jug) {
        await enviar(subscription, '🩺 Alta médica próxima', `${jug.nombre} puede volver el ${l.fecha_alta}`, '/amonestaciones')
      }
    }

    // 3. Entrenamiento en las próximas 2 horas
    const { data: entrenos } = await supabase
      .from('entrenamientos')
      .select('fecha, hora, lugar')
      .eq('user_id', user_id)
      .eq('fecha', fmt(hoy))
    for (const e of entrenos || []) {
      if (!e.hora) continue
      const [hh, mm] = e.hora.split(':').map(Number)
      const horaEntreno = new Date(hoy); horaEntreno.setHours(hh, mm, 0, 0)
      const diff = horaEntreno.getTime() - hoy.getTime()
      if (diff > 0 && diff <= 2 * 3600 * 1000) {
        await enviar(subscription, '🏋️ Entrenamiento en 2h', `${e.hora}${e.lugar ? ' · ' + e.lugar : ''}`, '/entrenamientos')
      }
    }
  }

  return new Response('ok', { status: 200 })
})
