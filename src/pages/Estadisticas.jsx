import { useEffect, useState } from 'react'
import { listarPartidos } from '../lib/partidos'

export default function Estadisticas() {
  const [partidos, setPartidos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    (async () => {
      try { setPartidos(await listarPartidos()) } finally { setCargando(false) }
    })()
  }, [])

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  // ── Goleadores (desde los eventos de cada partido) ──
  const tabla = {}
  partidos.forEach((p) => {
    (Array.isArray(p.notas) ? p.notas : []).forEach((e) => {
      if (!e.jugador) return
      if (!tabla[e.jugador]) tabla[e.jugador] = { goles: 0, asist: 0 }
      if (e.tipo === 'gol') tabla[e.jugador].goles++
      if (e.tipo === 'asistencia') tabla[e.jugador].asist++
    })
  })
  const goleadores = Object.entries(tabla)
    .map(([jugador, s]) => ({ jugador, ...s }))
    .filter((g) => g.goles > 0 || g.asist > 0)
    .sort((a, b) => b.goles - a.goles || b.asist - a.asist)

  // ── Rendimiento del equipo ──
  const split = (cond) => {
    const ps = partidos.filter((p) => p.local_visitante === cond)
    return ps.reduce((a, p) => {
      if (p.gf > p.gc) a.v++; else if (p.gf < p.gc) a.d++; else a.e++
      return a
    }, { v: 0, e: 0, d: 0, n: ps.length })
  }
  const local = split('local'), visitante = split('visitante')
  const racha = partidos.slice(0, 5).map((p) => (p.gf > p.gc ? 'V' : p.gf === p.gc ? 'E' : 'D'))
  const colorR = { V: 'bg-cyan text-black', E: 'bg-dorado text-black', D: 'bg-rojo text-white' }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Estadísticas</h1>

      {partidos.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          Sin datos aún. Juega partidos en <b className="text-cyan">En Vivo</b> registrando goles con jugador.
        </div>
      ) : (
        <>
          {/* Racha */}
          <div className="card p-4">
            <div className="text-[11px] font-extrabold uppercase text-cyan mb-2">Racha (últimos 5)</div>
            <div className="flex gap-1.5">
              {racha.length ? racha.map((r, i) => (
                <span key={i} className={`w-7 h-7 rounded-md grid place-items-center text-xs font-black ${colorR[r]}`}>{r}</span>
              )) : <span className="text-sm text-muted">—</span>}
            </div>
          </div>

          {/* Local vs Visitante */}
          <div className="grid grid-cols-2 gap-3">
            <CondCard titulo="🏠 Local" d={local} />
            <CondCard titulo="✈️ Visitante" d={visitante} />
          </div>

          {/* Goleadores */}
          <div className="card p-4">
            <div className="text-[11px] font-extrabold uppercase text-cyan mb-3">Goleadores</div>
            {goleadores.length === 0 ? (
              <div className="text-sm text-muted">Aún no hay goles con jugador asignado. En En Vivo, toca el jugador antes de marcar el gol.</div>
            ) : (
              <div className="space-y-2">
                {goleadores.map((g, i) => (
                  <div key={g.jugador} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-black ${
                      i === 0 ? 'bg-dorado text-black' : i === 1 ? 'bg-zinc-400 text-black' : i === 2 ? 'bg-orange-700 text-white' : 'bg-white/10 text-muted'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">{g.jugador}</span>
                    {g.goles > 0 && <span className="text-sm font-bold text-cyan">{g.goles} ⚽</span>}
                    {g.asist > 0 && <span className="text-xs text-muted">{g.asist} 🅰️</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function CondCard({ titulo, d }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-xs text-muted mb-1">{titulo} · {d.n} PJ</div>
      <div className="flex justify-center gap-2 text-sm font-black">
        <span className="text-cyan">{d.v}V</span>
        <span className="text-dorado">{d.e}E</span>
        <span className="text-rojo">{d.d}D</span>
      </div>
    </div>
  )
}
