import { useState } from 'react'

const ACCIONES_RIVAL = [
  { tipo: 'gol-rival',      ico: '⚽', lbl: 'Gol',           color: '#ef4444' },
  { tipo: 'tiro-rival',     ico: '🎯', lbl: 'Tiro',           color: '#f59e0b' },
  { tipo: 'corner-rival',   ico: '⛳', lbl: 'Córner',         color: '#f59e0b' },
  { tipo: 'falta-favor',    ico: '🟢', lbl: 'Falta\na favor', color: '#10b981' },
  { tipo: 'amarilla-rival', ico: '🟨', lbl: 'Amarilla',       color: '#f59e0b', needsDorsal: true },
  { tipo: 'roja-rival',     ico: '🟥', lbl: 'Roja',           color: '#ef4444', needsDorsal: true },
  { tipo: 'offside',        ico: '🚩', lbl: 'F. juego',       color: '#94a3b8' },
  { tipo: 'cambio-rival',   ico: '🔄', lbl: 'Cambio',         color: '#60a5fa' },
]

export default function ManualControls({ rival, onRegistrar }) {
  const [jugRivalDorsal, setJugRivalDorsal] = useState('')

  function handleRival(a) {
    const jug = a.needsDorsal && jugRivalDorsal
      ? { id: 'r-' + jugRivalDorsal, dorsal: jugRivalDorsal, nombre: `Rival #${jugRivalDorsal}` }
      : null
    onRegistrar(a.tipo, jug)
  }

  return (
    <div className="ev2-rail-card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
      <div className="ev2-rail-h" style={{ fontWeight: 800, fontSize: 11, color: '#f87171' }}>
        ⚫ Acciones {rival}
      </div>
      <input className="field mb-2 text-xs" type="number" min={1} max={99}
        placeholder="Dorsal rival (para amarilla/roja)"
        value={jugRivalDorsal} onChange={e => setJugRivalDorsal(e.target.value)} />
      <div className="grid grid-cols-4 gap-1">
        {ACCIONES_RIVAL.map(a => (
          <button key={a.tipo} onClick={() => handleRival(a)}
            className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-center transition active:scale-95"
            style={{ background: `${a.color}12`, border: `1px solid ${a.color}40`, color: a.color }}>
            <span style={{ fontSize: 15 }}>{a.ico}</span>
            <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.2 }}>{a.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
