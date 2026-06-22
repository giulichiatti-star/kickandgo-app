import { useEffect, useState } from 'react'
import { geocodificar, pronostico, describirClima } from '../lib/clima'
import { ultimaConvocatoria } from '../lib/convocatorias'

export default function Clima() {
  const [ciudad, setCiudad] = useState(localStorage.getItem('kg-ciudad') || '')
  const [input, setInput] = useState(localStorage.getItem('kg-ciudad') || '')
  const [data, setData] = useState(null)
  const [lugar, setLugar] = useState(null)
  const [fechaPartido, setFechaPartido] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { ultimaConvocatoria().then((c) => setFechaPartido(c?.fecha || '')) }, [])

  async function buscar(c) {
    const q = (c ?? input).trim()
    if (!q) return
    setError(''); setCargando(true); setData(null)
    try {
      const geo = await geocodificar(q)
      const pron = await pronostico(geo.lat, geo.lon)
      setLugar(geo); setData(pron); setCiudad(q)
      localStorage.setItem('kg-ciudad', q)
    } catch (e) { setError(e.message) } finally { setCargando(false) }
  }
  useEffect(() => { if (ciudad) buscar(ciudad) /* eslint-disable-next-line */ }, [])

  const [emActual, txtActual] = data ? describirClima(data.current.weather_code) : ['', '']

  // Día del partido dentro del pronóstico
  let diaPartido = null
  if (data && fechaPartido) {
    const idx = data.daily.time.indexOf(fechaPartido)
    if (idx !== -1) {
      const [em, txt] = describirClima(data.daily.weather_code[idx])
      diaPartido = {
        em, txt, idx,
        max: Math.round(data.daily.temperature_2m_max[idx]),
        min: Math.round(data.daily.temperature_2m_min[idx]),
        lluvia: data.daily.precipitation_probability_max[idx],
      }
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Clima</h1>

      <div className="flex gap-2">
        <input className="field flex-1" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()} placeholder="Ciudad del partido (ej: Llavaneres)" />
        <button className="btn btn-primary" onClick={() => buscar()}>Buscar</button>
      </div>

      {cargando && <div className="text-sm text-muted text-center py-6">Consultando…</div>}
      {error && <div className="text-xs text-rojo">⚠️ {error}</div>}

      {data && (
        <>
          {/* Actual */}
          <div className="card p-5 text-center" style={{ background: 'linear-gradient(160deg,#0c1a2a,#1c1c20)' }}>
            <div className="text-xs text-muted">{lugar.nombre}{lugar.pais ? `, ${lugar.pais}` : ''} · ahora</div>
            <div className="text-5xl my-2">{emActual}</div>
            <div className="text-3xl font-black">{Math.round(data.current.temperature_2m)}°</div>
            <div className="text-sm text-muted">{txtActual} · 💨 {Math.round(data.current.wind_speed_10m)} km/h</div>
          </div>

          {/* Día del partido */}
          {fechaPartido && (
            <div className="card p-4">
              <div className="text-[11px] font-extrabold uppercase text-cyan mb-2">Día del partido ({fechaPartido})</div>
              {diaPartido ? (
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{diaPartido.em}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{diaPartido.txt}</div>
                    <div className="text-xs text-muted">{diaPartido.min}° / {diaPartido.max}° · 🌧️ {diaPartido.lluvia}% lluvia</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted">El partido está fuera del pronóstico de 7 días.</div>
              )}
            </div>
          )}

          {/* Próximos 7 días */}
          <div className="card p-3">
            <div className="text-[11px] font-extrabold uppercase text-cyan mb-2">Próximos días</div>
            <div className="flex gap-2 overflow-x-auto">
              {data.daily.time.map((d, i) => {
                const [em] = describirClima(data.daily.weather_code[i])
                const dd = new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' })
                const esPartido = d === fechaPartido
                return (
                  <div key={d} className={`flex-shrink-0 text-center p-2 rounded-lg ${esPartido ? 'bg-cyan/10 border border-cyan/40' : ''}`} style={{ minWidth: 52 }}>
                    <div className="text-[10px] text-muted">{dd}</div>
                    <div className="text-lg">{em}</div>
                    <div className="text-[10px]">{Math.round(data.daily.temperature_2m_max[i])}°</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {!data && !cargando && !error && (
        <div className="card p-8 text-center text-sm text-muted">Escribe la ciudad del partido para ver el tiempo.</div>
      )}
    </div>
  )
}
