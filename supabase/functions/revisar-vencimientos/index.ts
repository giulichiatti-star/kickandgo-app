import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const DIAS_GRACIA = 2

Deno.serve(async () => {
  const limite = new Date()
  limite.setDate(limite.getDate() - DIAS_GRACIA)
  const limiteISO = limite.toISOString()

  // 1. Pruebas vencidas + días de gracia sin pago → suspender
  const { data: pruebasVencidas } = await supabase
    .from('profiles')
    .update({ activo: false, plan_estado: 'vencido' })
    .eq('plan_estado', 'prueba')
    .lt('prueba_vence', limiteISO)
    .select('id')

  // 2. Suscripciones de pago vencidas + días de gracia → mora + suspender
  const { data: pagosVencidos } = await supabase
    .from('profiles')
    .update({ activo: false, plan_estado: 'mora' })
    .eq('plan_estado', 'pagado')
    .lt('pago_vence', limiteISO)
    .select('id')

  return new Response(JSON.stringify({
    ok: true,
    pruebasVencidas: pruebasVencidas?.length || 0,
    pagosVencidos: pagosVencidos?.length || 0,
  }), { status: 200 })
})
