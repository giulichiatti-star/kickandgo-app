import { createClient } from 'npm:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const YA_PAGUE_URL = `${SUPABASE_URL}/functions/v1/ya-pague`

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Kick and Go <noreply@kickandgo.app>', to: [to], subject, html }),
  })
  if (!res.ok) console.error('Resend error:', await res.text())
  return res.ok
}

const LOGO = `<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
  <td style="padding-right:8px"><svg width="26" height="26" viewBox="0 0 32 32" fill="none"><rect x="4" y="4" width="5" height="24" rx="1.5" fill="#2dd4bf"/><path d="M11 16 L24 4 L31 4 L17 16 Z" fill="#2dd4bf"/><path d="M11 16 L17 16 L31 28 L24 28 Z" fill="#f59e0b"/></svg></td>
  <td style="font-size:15px;font-weight:500;color:#18181b">Kick and Go</td>
</tr></table>`

function payBlock(uid: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:10px;border:1px solid #e4e4e7;padding:16px 18px;margin:18px 0">
    <tr><td style="padding-bottom:10px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.5px">Opciones de pago — 19 €/mes</td></tr>
    <tr><td style="font-size:13px;color:#52525b;padding:4px 0">Transferencia bancaria</td></tr>
    <tr><td><table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:12px;color:#71717a;padding:3px 0">IBAN</td><td align="right" style="font-size:12px;font-family:monospace;color:#18181b">ES28 1583 0001 1490 5028 3293</td></tr>
      <tr><td style="font-size:12px;color:#71717a;padding:3px 0 8px">Beneficiario</td><td align="right" style="font-size:12px;color:#18181b">Javier Herrero Jiménez</td></tr>
    </table></td></tr>
    <tr><td style="border-top:1px solid #e4e4e7;padding-top:10px"><table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:13px;color:#52525b">Bizum</td><td align="right" style="font-size:13px;color:#18181b;font-weight:600">+34 628 58 49 85</td></tr>
    </table></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
    <tr><td style="padding-bottom:8px"><a href="${YA_PAGUE_URL}?uid=${uid}&metodo=transferencia" style="display:block;background:#10b981;color:#fff;text-align:center;padding:13px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">Ya pagué con transferencia bancaria</a></td></tr>
    <tr><td><a href="${YA_PAGUE_URL}?uid=${uid}&metodo=bizum" style="display:block;background:#f4f4f5;color:#18181b;text-align:center;padding:13px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #d4d4d8">Ya pagué con Bizum</a></td></tr>
  </table>`
}

function wrapEmail(badge: string, badgeBg: string, badgeFg: string, title: string, body: string, footer: string, uid: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden">
<tr><td style="padding:22px 32px 20px;border-bottom:1px solid #f0f0f0;text-align:center">${LOGO}</td></tr>
<tr><td style="padding:28px 32px">
  <span style="display:inline-block;padding:3px 12px;border-radius:100px;font-size:11px;font-weight:600;background:${badgeBg};color:${badgeFg};margin-bottom:14px">${badge}</span>
  <h1 style="font-size:20px;font-weight:500;color:#18181b;margin:0 0 14px;line-height:1.35">${title}</h1>
  ${body}
  ${payBlock(uid)}
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center">
  <p style="font-size:12px;color:#a1a1aa;margin:0">${footer}<br>El equipo de Kick and Go</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function p(text: string) {
  return `<p style="font-size:14px;color:#52525b;line-height:1.65;margin:0 0 12px">${text}</p>`
}

// Email sin bloque de pago (para onboarding/tips durante la prueba)
function wrapEmailInfo(badge: string, badgeBg: string, badgeFg: string, title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden">
<tr><td style="padding:22px 32px 20px;border-bottom:1px solid #f0f0f0;text-align:center">${LOGO}</td></tr>
<tr><td style="padding:28px 32px">
  <span style="display:inline-block;padding:3px 12px;border-radius:100px;font-size:11px;font-weight:600;background:${badgeBg};color:${badgeFg};margin-bottom:14px">${badge}</span>
  <h1 style="font-size:20px;font-weight:500;color:#18181b;margin:0 0 14px;line-height:1.35">${title}</h1>
  ${body}
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

Deno.serve(async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  function dayOffset(dateISO: string, offset: number) {
    const d = new Date(dateISO); d.setHours(0, 0, 0, 0)
    const ref = new Date(today); ref.setDate(ref.getDate() + offset)
    return d.getTime() === ref.getTime()
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, entrenador, plan_estado, prueba_vence, pago_vence')
    .not('email', 'is', null)
    .neq('plan_estado', 'baja')

  if (error || !profiles) {
    return new Response(JSON.stringify({ ok: false, error }), { status: 500 })
  }

  let sent = 0

  for (const p_ of profiles) {
    const uid = p_.id
    const email = p_.email
    const nombre = p_.entrenador?.split(' ')[0] || 'entrenador'

    // ── EN PRUEBA ─────────────────────────────────────────────────
    if (p_.plan_estado === 'prueba' && p_.prueba_vence) {

      // Día 3 de la prueba (11 días antes de vencer, prueba de 14 días)
      if (dayOffset(p_.prueba_vence, 11)) {
        const html = wrapEmailInfo(
          'Tips para tu equipo', '#dcfce7', '#166534',
          '3 cosas que la mayoría descubre en su primera semana',
          p(`Hola ${nombre}, llevas unos días con Kick and Go — te dejo 3 funciones que suelen sorprender a los entrenadores:`) +
          p(`<b>1. Voz en En Vivo</b> — durante el partido di <i>"Gol de Mateo"</i> o <i>"Amarilla al 8"</i> y queda registrado. Cero botones.`) +
          p(`<b>2. Convocatoria como pizarra táctica</b> — arrastra jugadores a la formación, mándala por WhatsApp con un clic.`) +
          p(`<b>3. Análisis IA</b> — el asistente estudia tus partidos y sugiere qué mejorar, formaciones óptimas y rivales complicados.`) +
          p(`¿Alguna duda concreta? Respóndeme a este email.`)
        )
        if (await sendEmail(email, '3 funciones que quizá no has probado — Kick and Go', html)) sent++
      }

      if (dayOffset(p_.prueba_vence, 3)) {
        const html = wrapEmail(
          'Tu prueba vence en 3 días', '#fef3c7', '#92400e',
          '¡Quedan 3 días para aprovechar todo al máximo!',
          p(`Hola ${nombre}, llevas varios días usando Kick and Go y tu equipo ya está tomando forma. Sería una pena perder el ritmo ahora.`) +
          p(`Para seguir con acceso completo, elige tu forma de pago preferida. El precio es <b>19 €/mes</b> y puedes cancelar cuando quieras.`),
          '¿Tienes alguna duda? Escríbenos y te ayudamos.',
          uid
        )
        if (await sendEmail(email, 'Quedan 3 días de tu prueba gratuita — Kick and Go', html)) sent++
      }

      if (dayOffset(p_.prueba_vence, 0)) {
        const html = wrapEmail(
          'Tu período de prueba ha finalizado', '#fef3c7', '#92400e',
          'Tu prueba gratuita termina hoy',
          p(`Hola ${nombre}, esperamos que estos 14 días hayan sido muy útiles para ti y tu equipo. A partir de hoy tu acceso queda limitado.`) +
          p(`Tienes <b>2 días más</b> para continuar sin interrupciones — solo necesitas completar el pago. Después suspendemos la cuenta hasta recibirlo.`),
          '¿Dudas antes de decidir? Estamos aquí.',
          uid
        )
        if (await sendEmail(email, 'Tu prueba gratuita termina hoy — Kick and Go', html)) sent++
      }

      if (dayOffset(p_.prueba_vence, -2)) {
        const html = wrapEmail(
          'Cuenta suspendida temporalmente', '#fee2e2', '#991b1b',
          'No hemos constatado tu pago — vamos a suspender temporalmente tu cuenta',
          p(`Hola ${nombre}, han pasado los días de gracia y aún no hemos recibido confirmación de pago. Para proteger tus datos hemos suspendido el acceso temporalmente.`) +
          p(`En cuanto recibamos el pago, <b>reactivamos tu cuenta al instante</b> y todo seguirá exactamente donde lo dejaste.`),
          '¿Algo no fue bien? Cuéntanoslo y lo resolvemos.',
          uid
        )
        if (await sendEmail(email, 'Tu cuenta ha sido suspendida temporalmente — Kick and Go', html)) sent++
      }
    }

    // ── CLIENTE ACTIVO (renovación) ───────────────────────────────
    if (p_.plan_estado === 'pagado' && p_.pago_vence) {

      if (dayOffset(p_.pago_vence, 1)) {
        const fechaLocal = new Date(p_.pago_vence).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
        const html = wrapEmail(
          'Renovación mañana', '#dbeafe', '#1e40af',
          'Tu suscripción vence mañana',
          p(`Hola ${nombre}, solo un recordatorio rápido: tu suscripción se renueva el <b>${fechaLocal}</b>. Para que no haya ninguna interrupción, completa el pago antes de esa fecha.`) +
          p(`Gracias por confiar en Kick and Go — es un placer acompañar a tu equipo.`),
          '¿Cambió algo? Escríbenos sin problema.',
          uid
        )
        if (await sendEmail(email, 'Tu suscripción vence mañana — Kick and Go', html)) sent++
      }
    }

    // ── EN MORA (renovación vencida + gracia) ─────────────────────
    if (p_.plan_estado === 'mora' && p_.pago_vence) {

      if (dayOffset(p_.pago_vence, -2)) {
        const html = wrapEmail(
          'Acceso suspendido', '#fee2e2', '#991b1b',
          'No hemos constatado tu pago — vamos a suspender temporalmente tu cuenta',
          p(`Hola ${nombre}, han pasado 2 días desde el vencimiento y aún no hemos recibido el pago de renovación. Hemos suspendido el acceso de forma temporal para proteger tus datos.`) +
          p(`Tu historial, plantilla y estadísticas están intactos. <b>En cuanto recibamos el pago, reactivamos al instante.</b>`),
          '¿Algo no fue bien con el pago? Cuéntanoslo y lo resolvemos.',
          uid
        )
        if (await sendEmail(email, 'Tu cuenta ha sido suspendida temporalmente — Kick and Go', html)) sent++
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, total: profiles.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
