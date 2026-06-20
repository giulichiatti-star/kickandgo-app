import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerfil } from '../lib/perfil'
import { listarJugadores } from '../lib/jugadores'
import { listarPartidos } from '../lib/partidos'
import { ultimaConvocatoria } from '../lib/convocatorias'

function fechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Inicio() {
  const nav = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [nJug, setNJug] = useState(0)
  const [partidos, setPartidos] = useState([])
  const [conv, setConv] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const [p, js, ps, c] = await Promise.all([
          getPerfil(), listarJugadores(), listarPartidos(), ultimaConvocatoria(),
        ])
        setPerfil(p); setNJug(js.length); setPartidos(ps); setConv(c)
      } catch (e) { /* noop */ }
    })()
  }, [])

  const balance = partidos.reduce((a, p) => {
    if (p.gf > p.gc) a.v++; else if (p.gf < p.gc) a.d++; else a.e++
    return a
  }, { v: 0, e: 0, d: 0 })
  const ultimo = partidos[0]
  const nombre = (perfil?.entrenador || '').split(' ')[0] || 'entrenador'
  const club = perfil?.club_nombre || 'Mi club'
  const desc = perfil?.descripcion || ''

  return (
    <div className="space-y-4">
      {/* Saludo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-card border border-borde grid place-items-center text-2xl overflow-hidden">
          {perfil?.escudo_url
            ? <img src={perfil.escudo_url} alt="" className="w-full h-full object-cover" />
            : '🛡️'}
        </div>
        <div>
          <div className="text-lg font-extrabold leading-tight">Hola, {nombre} 👋</div>
          <div className="text-xs text-cyan font-semibold">{desc || club}</div>
        </div>
      </div>

      {/* Próximo partido (hero) */}
      <div className="rounded-2xl p-5 border border-cyan/25 relative overflow-hidden"
        style={{ background: 'linear-gradient(105deg,#020f08,#061408)' }}>
        <div className="text-[11px] font-extrabold tracking-wider text-cyan">PRÓXIMO PARTIDO</div>
        <div className="text-2xl font-black mt-2 leading-tight">
          {club}<br /><span className="text-dorado">vs {conv?.rival || '—'}</span>
        </div>
        <div className="text-xs text-muted mt-2">{conv?.fecha ? fechaCorta(conv.fecha) : 'Sin convocatoria aún'}</div>
        <button className="btn btn-primary mt-4" onClick={() => nav('/convocatoria')}>Preparar convocatoria →</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi val={nJug} label="Jugadores" color="text-cyan" onClick={() => nav('/plantilla')} />
        <Kpi val={partidos.length} label="Partidos" color="text-white" onClick={() => nav('/informes')} />
        <Kpi val={`${balance.v}-${balance.e}-${balance.d}`} label="V·E·D" color="text-cyan-neon" small onClick={() => nav('/informes')} />
      </div>

      {/* Último partido */}
      <div className="card p-4">
        <div className="text-[11px] font-extrabold tracking-wide text-cyan uppercase mb-3">Último partido</div>
        {ultimo ? (
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-muted">{club.split(' ')[0]}</span>
            <span className="text-3xl font-black">{ultimo.gf} – {ultimo.gc}</span>
            <span className="text-sm text-muted">{ultimo.rival || 'Rival'}</span>
          </div>
        ) : (
          <div className="text-sm text-muted text-center py-2">Aún no jugaste ningún partido.</div>
        )}
      </div>

      {/* Atajos */}
      <div className="grid grid-cols-2 gap-3">
        <button className="card p-4 text-left hover:bg-white/5" onClick={() => nav('/envivo')}>
          <div className="text-2xl">🔴</div>
          <div className="font-bold mt-1">Modo partido</div>
          <div className="text-xs text-muted">Registrar en vivo</div>
        </button>
        <button className="card p-4 text-left hover:bg-white/5" onClick={() => nav('/plantilla')}>
          <div className="text-2xl">👥</div>
          <div className="font-bold mt-1">Plantilla</div>
          <div className="text-xs text-muted">Gestionar jugadores</div>
        </button>
      </div>
    </div>
  )
}

function Kpi({ val, label, color, small, onClick }) {
  return (
    <button onClick={onClick} className="card p-3 text-center hover:bg-white/5">
      <div className={`font-black ${small ? 'text-lg' : 'text-2xl'} ${color}`}>{val}</div>
      <div className="text-[10px] text-muted mt-0.5">{label}</div>
    </button>
  )
}
