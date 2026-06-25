import { supabase } from './supabase'

const VAPID_PUBLIC = 'BA9kl5itq5AroLTOBruOUoC77RxmKabGGQTLMu4mePl1UKHOxVjrxAviXlk8Yjq6Gp61RNH8HKgfefjwS5IrsDg'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export async function suscribirPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const permiso = await Notification.requestPermission()
    if (permiso !== 'granted') return false

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })

    const { data: u } = await supabase.auth.getUser()
    await supabase.from('push_subscriptions').upsert({
      user_id: u.user.id,
      subscription: sub.toJSON(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return true
  } catch { return false }
}

export async function tieneSuscripcion() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return !!sub
  } catch { return false }
}

export async function cancelarPush() {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('push_subscriptions').delete().eq('user_id', u.user.id)
    return true
  } catch { return false }
}
