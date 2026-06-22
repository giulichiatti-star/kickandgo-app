import { useEffect, useState } from 'react'
import { listarPartidos } from '../lib/partidos'
import { ultimaConvocatoria } from '../lib/convocatorias'

const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n))

export default function Predicciones() {
  const [partidos, setPartidos] = useState([])
  const [rival, setRival] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [ps, c] = await Promise.all([listarPartidos(), ultimaConvocatoria()])
        setPartidos(ps); setRival(c?.rival || '')
      } finally { setCargando(false) }
    })()
  }, [])

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  const pj = partidos.length
  if (pj === 0) {
    return (
      <div>
        <h1 className="text-xl font-extrabold mb-3">Predicciones</h1>
        <div className="card p-8 text-center text-sm text-muted">
          Necesito partidos guardados para calcular. Juega alguno en <b className="text-cyan">En Vivo</b>.
        </div>
      </div>
    )
  }

  // Tasas históricas
  const cont = partidos.reduce((a, p) => {
    if (p.gf > p.gc) a.v++; else if (p.gf < p.gc) a.d++; else a.e++
    a.gf += p.gf || 0; a.gc += p.gc || 0
    return a
  }, { v: 0, e: 0, d: 0, gf: 0, gc: 0 })
  let pV = (cont.v / pj) * 100, pE = (cont.e / pj) * 100, pD = (cont.d / pj) * 100

  // Forma (últimos 5)
  const ult5 = partidos.slice(0, 5)
  const ptsForma = ult5.reduce((a, p) => a + (p.gf > p.gc ? 3 : p.gf === p.gc ? 1 : 0), 0)
  const formFactor = ult5.length ? ptsForma / (ult5.length * 3) : 0.5 // 0..1
  pV += (formFactor - 0.5) * 24

  // Historial vs rival concreto
  const vsRival = rival ? partidos.filter((p) => (p.rival || '').toLowerCase() === rival.toLowerCase()) : []
  if (vsRival.length) {
    const r = vsRival.reduce((a, p) => { if (p.gf > p.gc) a.v++; else if (p.gf < p.gc) a.d++; else a.e++; return a }, { v: 0, e: 0, d: 0 })
    const n = vsRival.length
    pV = pV * 0.6 + (r.v / n) * 100 * 0.4
    pE = pE * 0.6 + (r.e / n) * 100 * 0.4
    pD = pD * 0.6 + (r.d / n) * 100 * 0.4
  }

  // Ventaja de local (asumimos local) + normalizar
  pV += 6
  pV = clamp(pV); pE = clamp(pE); pD = clamp(pD)
  const tot = pV + pE + pD || 1
  pV = Math.round((pV / tot) * 100); pE = Math.round((pE / tot) * 100); pD = 100 - pV - pE

  const xgF = (cont.gf / pj).toFixed(1)
  const xgC = (cont.gc / pj).toFixed(1)

  const fav = pV >= pE && pV >= pD ? 'victoria' : pD >= pE ? 'derrota' : 'empate'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">Predicciones</h1>
        <p className="text-xs text-muted">Próximo rival: {rival || '—'} · modelo basado en tus {pj} partidos</p>
      </div>

      {/* Probabilidades */}
      <div className="card p-4">
        <div className="text-[11px] font-extrabold uppercase text-cyan mb-3">Resultado más probable</div>
        <Barra label="Victoria" val={pV} color="#2dd4bf" />
        <Barra label="Empate" val={pE} color="#f59e0b" />
        <Barra label="Derrota" val={pD} color="#ef4444" />
      </div>

      {/* xG esperado */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-cyan">{xgF}</div>
          <div className="text-[10px] text-muted">Goles esperados (a favor)</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-rojo">{xgC}</div>
          <div className="text-[10px] text-muted">Goles esperados (en contra)</div>
        </div>
      </div>

      {/* Historial vs rival */}
      {vsRival.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] font-extrabold uppercase text-cyan mb-2">Historial vs {rival}</div>
          <div className="flex gap-1.5">
            {vsRival.slice(0, 6).map((p, i) => {
              const r = p.gf > p.gc ? 'V' : p.gf === p.gc ? 'E' : 'D'
              const c = { V: 'bg-cyan text-black', E: 'bg-dorado text-black', D: 'bg-rojo text-white' }[r]
              return <span key={i} className={`w-7 h-7 rounded-md grid place-items-center text-xs font-black ${c}`}>{r}</span>
            })}
          </div>
        </div>
      )}

      <div className="card p-3 text-xs text-zinc-300 leading-relaxed">
        🔮 El modelo proyecta <b className="text-cyan">{fav}</b> como escenario más probable, combinando tu forma reciente
        ({ptsForma} pts en {ult5.length} partidos){vsRival.length ? `, el historial vs ${rival}` : ''} y la ventaja de jugar en casa.
      </div>
    </div>
  )
}

function Barra({ label, val, color }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-300">{label}</span>
        <span className="font-bold" style={{ color }}>{val}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
      </div>
    </div>
  )
}
