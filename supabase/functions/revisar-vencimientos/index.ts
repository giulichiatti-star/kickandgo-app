import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Días de cortesía tras el vencimiento del pago antes de suspender.
// Durante estos días la cuenta sigue con acceso pero ve un aviso al entrar.
const DIAS_GRACIA = 2

Deno.serve(async () => {
  const ahora = new Date()
  const limite = new Date(ahora)
  limite.setDate(limite.getDate() - DIAS_GRACIA)
  const ahoraISO = ahora.toISOString()
  const limiteISO = limite.toISOString()

  // 1. Pruebas gratuitas vencidas + gracia sin pago → suspender
  const { data: pruebasVencidas } = await supabase
    .from('profiles')
    .update({ activo: false, plan_estado: 'vencido' })
    .eq('plan_estado', 'prueba')
    .lt('prueba_vence', limiteISO)
    .select('id')

  // 2. Pago recién vencido → pasa a "mora" pero MANTIENE el acceso.
  //    Estos días verá un aviso cada vez que entre a la app (front).
  const { data: entranEnMora } = await supabase
    .from('profiles')
    .update({ plan_estado: 'mora' })
    .eq('plan_estado', 'pagado')
    .lt('pago_vence', ahoraISO)
    .select('id')

  // 3. En mora y superados los días de gracia → suspensión temporal
  //    (activo=false). Se reactiva sola en cuanto se confirma el pago.
  const { data: suspendidos } = await supabase
    .from('profiles')
    .update({ activo: false })
    .eq('plan_estado', 'mora')
    .eq('activo', true)
    .lt('pago_vence', limiteISO)
    .select('id')

  return new Response(JSON.stringify({
    ok: true,
    pruebasVencidas: pruebasVencidas?.length || 0,
    entranEnMora: entranEnMora?.length || 0,
    suspendidos: suspendidos?.length || 0,
  }), { status: 200 })
})
