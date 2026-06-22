// Clima con Open-Meteo (gratis, sin clave, CORS ok)
export async function geocodificar(ciudad) {
  async function buscar(lang) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ciudad)}&count=5${lang ? `&language=${lang}` : ''}`
    const r = await fetch(url)
    const j = await r.json()
    return (j.results || [])
  }
  let res = await buscar('es')
  if (!res.length) res = await buscar('') // reintento sin idioma
  if (!res.length) throw new Error('Ciudad no encontrada. Escribe el nombre completo (ej: "Sant Andreu de Llavaneres").')
  const m = res[0]
  return { lat: m.latitude, lon: m.longitude, nombre: m.name, pais: m.country }
}

export async function pronostico(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,weather_code,wind_speed_10m`
    + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`
  const r = await fetch(url)
  return r.json()
}

// Código WMO → emoji + texto
export function describirClima(code) {
  const map = {
    0: ['☀️', 'Despejado'], 1: ['🌤️', 'Mayormente despejado'], 2: ['⛅', 'Parcialmente nublado'],
    3: ['☁️', 'Nublado'], 45: ['🌫️', 'Niebla'], 48: ['🌫️', 'Niebla'],
    51: ['🌦️', 'Llovizna ligera'], 53: ['🌦️', 'Llovizna'], 55: ['🌧️', 'Llovizna fuerte'],
    61: ['🌧️', 'Lluvia ligera'], 63: ['🌧️', 'Lluvia'], 65: ['🌧️', 'Lluvia fuerte'],
    71: ['🌨️', 'Nieve ligera'], 73: ['🌨️', 'Nieve'], 75: ['❄️', 'Nieve fuerte'],
    80: ['🌦️', 'Chubascos'], 81: ['🌧️', 'Chubascos'], 82: ['⛈️', 'Chubascos fuertes'],
    95: ['⛈️', 'Tormenta'], 96: ['⛈️', 'Tormenta con granizo'], 99: ['⛈️', 'Tormenta fuerte'],
  }
  return map[code] || ['🌡️', '—']
}
