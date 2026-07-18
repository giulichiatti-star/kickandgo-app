// Reactivación por inactividad — emails escalonados (día 5 / 15 / 30).
// Se ejecuta a diario por pg_cron. Envía como máximo 1 email por nivel y
// reinicia el nivel cuando la cuenta vuelve a estar activa.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'KickAndGo <hola@kickandgo.app>'
const APP_URL = Deno.env.get('APP_URL') || 'https://kickandgo.app'
const FN_BASE = `${SUPABASE_URL}/functions/v1`

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)

// Umbrales de cada nivel (días de inactividad)
const NIVELES = [
  { nivel: 1, dias: 5 },
  { nivel: 2, dias: 15 },
  { nivel: 3, dias: 30 },
]

const COPY: Record<number, { subject: string; titulo: string; cuerpo: string; cta: string }> = {
  1: {
    subject: '¿Seguimos preparando al equipo? 🟢',
    titulo: 'Te echamos de menos',
    cuerpo: 'Hace unos días que no entras a KickAndGo. Tu equipo, tus entrenos y tus estadísticas te esperan. ¿Preparamos la próxima sesión?',
    cta: 'Volver a mi equipo',
  },
  2: {
    subject: 'Tu equipo avanza más rápido contigo dentro ⚽',
    titulo: '¿Te ayudamos a retomarlo?',
    cuerpo: 'Sabemos que el día a día del entrenador es una locura. Si algo te frenó, respóndenos a este email y te echamos una mano para sacarle todo el partido a la app: pizarra, informes, En Vivo…',
    cta: 'Retomar ahora',
  },
  3: {
    subject: 'Antes de que te vayas… 👋',
    titulo: 'Nos gustaría que te quedes',
    cuerpo: 'Llevas un tiempo sin entrar. Si hay algo que no encaja o que echas en falta, cuéntanoslo — leemos todo. Y si solo necesitas un empujón, aquí lo tienes.',
    cta: 'Darle otra oportunidad',
  },
}

function emailHtml(nombre: string, nivel: number, uid: string) {
  const c = COPY[nivel]
  const bajaUrl = `${FN_BASE}/email-baja?uid=${encodeURIComponent(uid)}`
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f11;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f11;padding:40px 0;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#064e3b,#0f172a);padding:30px 40px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#fafafa;">KICK<span style="color:#10b981;">AND</span>GO ⚽</div>
      </td></tr>
      <tr><td style="padding:34px 40px;">
        <p style="margin:0 0 18px;font-size:19px;font-weight:800;color:#fafafa;">${c.titulo}, ${nombre} 👋</p>
        <p style="margin:0 0 26px;font-size:15px;color:#a1a1aa;line-height:1.7;">${c.cuerpo}</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);">
          <a href="${APP_URL}/login" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:800;color:#04140d;text-decoration:none;">${c.cta} →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="background:#111117;border-top:1px solid #27272a;padding:18px 40px;text-align:center;">
        <div style="font-size:11px;color:#52525b;line-height:1.6;">
          © KickAndGo · <a href="${APP_URL}" style="color:#10b981;text-decoration:none;">kickandgo.app</a><br>
          ¿No quieres recibir estos avisos? <a href="${bajaUrl}" style="color:#71717a;text-decoration:underline;">Darme de baja de estos emails</a>
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

Deno.serve(async () => {
  const ahora = Date.now()
  const dias = (iso: string | null) => (iso ? Math.floor((ahora - new Date(iso).getTime()) / 86400000) : null)

  // Cuentas activas candidatas (no baja/vencido), que no se han dado de baja de emails
  const { data: cuentas, error: e1 } = await supabase
    .from('profiles')
    .select('id, email, entrenador, creado, activo, plan_estado, reactivacion_nivel, email_baja')
    .eq('activo', true)
    .eq('email_baja', false)
    .in('plan_estado', ['prueba', 'pagado', 'mora'])
  if (e1) return json({ error: e1.message }, 500)

  // Última actividad por usuario (últimos 60 días)
  const desde = new Date(ahora - 60 * 86400000).toISOString()
  const { data: eventos } = await supabase
    .from('analytics_eventos').select('user_id, creado').gte('creado', desde)
  const ultAct: Record<string, string> = {}
  ;(eventos || []).forEach((e: any) => {
    if (!e.user_id) return
    if (!ultAct[e.user_id] || e.creado > ultAct[e.user_id]) ultAct[e.user_id] = e.creado
  })

  let enviados = 0, reseteados = 0
  for (const c of cuentas || []) {
    if (!c.email) continue
    // Días desde última actividad (o desde el alta si nunca entró)
    const ref = ultAct[c.id] || c.creado
    const inact = dias(ref)
    if (inact == null) continue

    // Si ha vuelto a estar activa (<5 días) y tenía nivel, reiniciamos
    if (inact < NIVELES[0].dias) {
      if ((c.reactivacion_nivel || 0) > 0) {
        await supabase.from('profiles').update({ reactivacion_nivel: 0 }).eq('id', c.id)
        reseteados++
      }
      continue
    }

    // Buscar el nivel más alto que corresponde y que aún no se ha enviado
    const objetivo = [...NIVELES].reverse().find((n) => inact >= n.dias && (c.reactivacion_nivel || 0) < n.nivel)
    if (!objetivo) continue

    const nombre = (c.entrenador || '').split(' ')[0] || 'entrenador'
    try {
      await resend.emails.send({
        from: RESEND_FROM, to: c.email,
        subject: COPY[objetivo.nivel].subject,
        html: emailHtml(nombre, objetivo.nivel, c.id),
      })
      await supabase.from('profiles').update({
        reactivacion_nivel: objetivo.nivel,
        reactivacion_email_en: new Date().toISOString(),
      }).eq('id', c.id)
      enviados++
    } catch (_) { /* seguir con el resto */ }
  }

  return json({ ok: true, candidatas: cuentas?.length || 0, enviados, reseteados })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
