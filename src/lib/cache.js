// Cache localStorage — fallback cuando Supabase no responde

const PREFIX = 'kg_cache_'
const MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 días

export function cacheSet(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > MAX_AGE) { localStorage.removeItem(PREFIX + key); return null }
    // Avisar a la UI que se está usando caché
    window.dispatchEvent(new CustomEvent('kg:cache-hit'))
    return data
  } catch { return null }
}

// Envuelve una función async: si falla, devuelve caché (o lanza si no hay caché)
export async function withCache(key, fn, opts = {}) {
  try {
    const data = await fn()
    cacheSet(key, data)
    return data
  } catch (err) {
    const cached = cacheGet(key)
    if (cached !== null) {
      if (opts.onCacheHit) opts.onCacheHit()
      return cached
    }
    throw err
  }
}
