import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const LOGO = `<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><rect x="4" y="4" width="5" height="24" rx="1.5" fill="#2dd4bf"/><path d="M11 16 L24 4 L31 4 L17 16 Z" fill="#2dd4bf"/><path d="M11 16 L17 16 L31 28 L24 28 Z" fill="#f59e0b"/></svg>`

function graciasPage(metodo: string) {
  const metodoLabel = metodo === 'transferencia' ? 'transferencia bancaria' : 'Bizum'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago confirmado — Kick and Go</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f4f4f5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#fff;border-radius:16px;border:1px solid #e4e4e7;padding:40px 36px;max-width:420px;width:100%;text-align:center}
.logo{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:28px}
.logo-text{font-size:15px;font-weight:500;color:#18181b}
.check{width:56px;height:56px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:26px;line-height:1}
h1{font-size:20px;font-weight:500;color:#18181b;margin-bottom:10px}
p{font-size:14px;color:#71717a;line-height:1.65;margin-bottom:8px}
.note{font-size:12px;color:#a1a1aa;margin-top:20px;padding-top:20px;border-top:1px solid #f0f0f0}
</style>
</head><body><div class="card">
  <div class="logo">${LOGO}<span class="logo-text">Kick and Go</span></div>
  <div class="check">✓</div>
  <h1>¡Recibido, gracias!</h1>
  <p>Hemos anotado tu pago por ${metodoLabel}.</p>
  <p>En cuanto lo verifiquemos — normalmente en pocas horas — tu cuenta quedará completamente activa.</p>
  <p class="note">¿Algún problema? Escríbenos directamente y lo resolvemos.</p>
</div></body></html>`
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const uid = url.searchParams.get('uid')
  const metodo = url.searchParams.get('metodo')

  if (!uid || !['transferencia', 'bizum'].includes(metodo || '')) {
    return new Response('Enlace inválido.', { status: 400, headers: { 'Content-Type': 'text/plain' } })
  }

  // Log notification — upsert so clicking twice no crea duplicados el mismo día
  const { error } = await supabase.from('payment_notifications').insert({
    user_id: uid,
    metodo,
    estado: 'pendiente',
  })
  if (error) console.error('Insert payment_notification error:', error.message)

  return new Response(graciasPage(metodo!), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
})
