import { useEffect, useRef, useState } from 'react'
import { ultimaConvocatoria } from '../lib/convocatorias'
import { guardarPartido } from '../lib/partidos'
import { getPerfil } from '../lib/perfil'

const ACCIONES = [
  { tipo: 'gol', label: 'Gol', icon: '⚽', conJugador: true, favor: true },
  { tipo: 'gol-rival', label: 'Gol rival', icon: '🔻', favor: false },
  { tipo: 'asistencia', label: 'Asistencia', icon: '🅰️', conJugador: true },
  { tipo: 'amarilla', label: 'Amarilla', icon: '🟨', conJugador: true },
  { tipo: 'roja', label: 'Roja', icon: '🟥', conJugador: true },
  { tipo: 'tiro', label: 'Tiro', icon: '🎯' },
  { tipo: 'corner', label: 'Córner', icon: '📐' },
  { tipo: 'falta-favor', label: 'Falta a favor', icon: '⚠️' },
  { tipo: 'cambio', label: 'Cambio', icon: '🔄' },
]

function mmss(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export default function EnVivo() {
  const [titulares, setTitulares] = useState([])
  const [rival, setRival] = useState('Rival')
  const [gf, setGf] = useState(0)
  const [gc, setGc] = useState(0)
  const [seg, setSeg] = useState(0)
  const [corriendo, setCorriendo] = useState(false)
  const [eventos, setEventos] = useState([])
  const [jugadorSel, setJugadorSel] = useState(null)
  const [msg, setMsg] = useState('')
  const [club, setClub] = useState('Nosotros')
  const timer = useRef(null)

  useEffect(() => {
    (async () => {
      const c = await ultimaConvocatoria()
      if (c) { setTitulares(c.titulares || []); setRival(c.rival || 'Rival') }
      try { const p = await getPerfil(); if (p?.club_nombre) setClub(p.club_nombre) } catch {}
    })()
  }, [])

  useEffect(() => {
    if (corriendo) timer.current = setInterval(() => setSeg((s) => s + 1), 1000)
    else clearInterval(timer.current)
    return () => clearInterval(timer.current)
  }, [corriendo])

  const min = Math.floor(seg / 60)

  function registrar(a) {
    const jug = a.conJugador ? jugadorSel : null
    const ev = {
      min, tipo: a.tipo, icon: a.icon, label: a.label,
      jugador: jug ? `#${jug.dorsal} ${jug.nombre}` : null,
    }
    setEventos((e) => [ev, ...e])
    if (a.tipo === 'gol') setGf((g) => g + 1)
    if (a.tipo === 'gol-rival') setGc((g) => g + 1)
    setJugadorSel(null)
    setMsg(`${a.icon} ${a.label}${ev.jugador ? ' · ' + ev.jugador : ''} (${min}')`)
  }

  async function finalizar() {
    if (!confirm('¿Finalizar y guardar el partido?')) return
    try {
      await guardarPartido({
        rival, gf, gc, formacion: '433',
        eventos: eventos.map((e) => ({ min: e.min, tipo: e.tipo, label: e.label, jugador: e.jugador })),
      })
      setCorriendo(false)
      setMsg('✅ Partido guardado en Informes')
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-1">En Vivo</h1>
      <p className="text-xs text-muted mb-4">vs {rival}</p>

      {/* Marcador + reloj */}
      <div className="card p-4 mb-4" style={{ background: 'linear-gradient(160deg,#13201a,#1c1c20)' }}>
        <div className="flex items-center justify-center gap-6">
          <Score label={club} val={gf} onUp={() => setGf(gf + 1)} onDown={() => setGf(Math.max(0, gf - 1))} />
          <div className="text-center">
            <div className={`font-mono text-3xl font-black ${corriendo ? 'text-rojo' : 'text-muted'}`}>{mmss(seg)}</div>
            <button className="btn btn-outline mt-2 text-xs px-3 py-1" onClick={() => setCorriendo((c) => !c)}>
              {corriendo ? '⏸ Pausar' : '▶ Iniciar'}
            </button>
          </div>
          <Score label={rival} val={gc} onUp={() => setGc(gc + 1)} onDown={() => setGc(Math.max(0, gc - 1))} />
        </div>
      </div>

      {/* Jugador seleccionado */}
      {titulares.length > 0 && (
        <div className="card p-3 mb-4">
          <div className="text-xs font-bold text-muted uppercase mb-2">
            Jugador {jugadorSel ? `· ${jugadorSel.nombre}` : '(toca uno para asignar a gol/tarjeta)'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {titulares.map((j) => (
              <button key={j.id} onClick={() => setJugadorSel(jugadorSel?.id === j.id ? null : j)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  jugadorSel?.id === j.id ? 'bg-cyan text-black border-cyan' : 'border-borde hover:bg-white/5'}`}>
                #{j.dorsal} {j.nombre.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ACCIONES.map((a) => (
          <button key={a.tipo} onClick={() => registrar(a)}
            className="card p-3 flex flex-col items-center gap-1 hover:bg-white/5 active:scale-95 transition">
            <span className="text-xl">{a.icon}</span>
            <span className="text-[11px] text-zinc-300">{a.label}</span>
          </button>
        ))}
      </div>

      {msg && <div className="text-xs text-zinc-300 mb-3">{msg}</div>}

      <button className="btn btn-primary w-full mb-4" onClick={finalizar}>🏁 Finalizar y guardar</button>

      {/* Timeline */}
      <div className="card p-3">
        <div className="text-xs font-bold text-muted uppercase mb-2">Eventos ({eventos.length})</div>
        {eventos.length === 0 ? (
          <div className="text-[11px] text-muted py-2">Sin eventos todavía.</div>
        ) : (
          <div className="space-y-1.5">
            {eventos.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted w-9">{e.min}'</span>
                <span>{e.icon}</span>
                <span className="flex-1">{e.label}{e.jugador ? ` · ${e.jugador}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Score({ label, val, onUp, onDown }) {
  return (
    <div className="text-center">
      <div className="text-[11px] text-muted mb-1 max-w-[90px] truncate">{label}</div>
      <div className="text-4xl font-black leading-none">{val}</div>
      <div className="flex gap-1.5 justify-center mt-2">
        <button className="w-7 h-7 rounded-full border border-borde text-rojo" onClick={onDown}>−</button>
        <button className="w-7 h-7 rounded-full border border-borde text-cyan" onClick={onUp}>+</button>
      </div>
    </div>
  )
}
