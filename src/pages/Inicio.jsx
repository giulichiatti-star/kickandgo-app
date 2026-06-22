import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerfil } from '../lib/perfil'
import { listarJugadores } from '../lib/jugadores'
import { listarPartidos } from '../lib/partidos'
import { ultimaConvocatoria } from '../lib/convocatorias'
import { listarEntrenos, COLOR_CAT } from '../lib/entrenamientos'
import { listarTarjetas } from '../lib/tarjetas'

function fechaLarga(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
function iniciales(nom = '') {
  return nom.split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || '·'
}

// Aro con icono dentro (arriba) y número dentro (abajo, en color) — como la demo
function DashGauge({ value, color, label, icon }) {
  const r = 32, c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className="dash2-gauge">
      <div className="dash2-gauge-ring">
        <svg width="74" height="74" viewBox="0 0 74 74">
          <circle cx="37" cy="37" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
          <circle cx="37" cy="37" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        </svg>
        <div className="dash2-gauge-inner">
          <span className="dash2-gauge-ico">{icon}</span>
          <span className="dash2-gauge-num" style={{ color }}>{Math.round(value)}</span>
        </div>
      </div>
      <div className="dash2-gauge-lbl">{label}</div>
    </div>
  )
}

export default function Inicio() {
  const nav = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [jugadores, setJugadores] = useState([])
  const [partidos, setPartidos] = useState([])
  const [conv, setConv] = useState(null)
  const [entrenos, setEntrenos] = useState([])
  const [tarjetas, setTarjetas] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const [p, js, ps, c, en, tj] = await Promise.all([
          getPerfil(), listarJugadores(), listarPartidos(), ultimaConvocatoria(),
          listarEntrenos().catch(() => []), listarTarjetas().catch(() => []),
        ])
        setPerfil(p); setJugadores(js); setPartidos(ps); setConv(c); setEntrenos(en); setTarjetas(tj)
      } catch { /* noop */ }
    })()
  }, [])
  const nJug = jugadores.length

  const balance = partidos.reduce((a, p) => {
    if (p.gf > p.gc) a.v++; else if (p.gf < p.gc) a.d++; else a.e++
    return a
  }, { v: 0, e: 0, d: 0 })
  const ultimo = partidos[0]

  const pj = partidos.length
  const gf = partidos.reduce((a, p) => a + (p.gf || 0), 0)
  const gc = partidos.reduce((a, p) => a + (p.gc || 0), 0)
  const clamp = (n) => Math.max(0, Math.min(99, Math.round(n)))
  const idxAtaque = pj ? clamp((gf / pj) / 3 * 100) : 0
  const idxDefensa = pj ? clamp(100 - (gc / pj) / 3 * 100) : 0
  const idxEfect = pj ? clamp(balance.v / pj * 100) : 0
  const ult5 = partidos.slice(0, 5)
  const ptsForma = ult5.reduce((a, p) => a + (p.gf > p.gc ? 3 : p.gf === p.gc ? 1 : 0), 0)
  const idxForma = ult5.length ? clamp(ptsForma / (ult5.length * 3) * 100) : 0
  const overall = pj ? Math.round((idxAtaque + idxDefensa + idxForma + idxEfect) / 4) : 0

  const nombre = (perfil?.entrenador || '').split(' ')[0] || 'entrenador'
  const club = perfil?.club_nombre || 'Mi club'
  const desc = perfil?.descripcion || ''
  const escudo = perfil?.escudo_url

  const r = 50, c = 2 * Math.PI * r
  const overOff = c * (1 - overall / 100)

  // resultado último
  const rl = ultimo ? (ultimo.gf > ultimo.gc ? { t: 'Victoria', col: '#34d399' } : ultimo.gf < ultimo.gc ? { t: 'Derrota', col: '#fca5a5' } : { t: 'Empate', col: '#f59e0b' }) : null

  // --- ¿Qué trabajar esta semana? (entrenos de esta semana) ---
  const hoy = new Date()
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)); lunes.setHours(0, 0, 0, 0)
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6); domingo.setHours(23, 59, 59, 999)
  const entrenosSemana = entrenos.filter((e) => {
    if (!e.fecha) return false
    const d = new Date(e.fecha + 'T00:00:00')
    return d >= lunes && d <= domingo
  })
  // agrupa por categoría de ejercicio (minutos)
  const catMin = {}
  entrenosSemana.forEach((e) => (e.ejercicios || []).forEach((x) => { if (x.cat) catMin[x.cat] = (catMin[x.cat] || 0) + (x.min || 0) }))
  entrenosSemana.forEach((e) => { if (e.objetivo) catMin[e.objetivo] = (catMin[e.objetivo] || 0) + 0.1 })
  const trabajos = Object.entries(catMin).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const minSemana = entrenosSemana.reduce((a, e) => a + (e.duracion || 0), 0)

  // --- Jugadores destacados (goles reales desde eventos) ---
  const golCount = {}
  partidos.forEach((p) => (Array.isArray(p.notas) ? p.notas : []).forEach((ev) => {
    if (/gol/i.test(ev.tipo || '') && ev.jugador) golCount[ev.jugador] = (golCount[ev.jugador] || 0) + 1
  }))
  const destacados = Object.entries(golCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // --- Alertas reales ---
  const nombrePorId = Object.fromEntries(jugadores.map((j) => [j.id, j.nombre]))
  const amarPorJug = {}, rojas = []
  tarjetas.forEach((t) => {
    if (t.tipo === 'roja') rojas.push(t)
    else amarPorJug[t.jugador_id] = (amarPorJug[t.jugador_id] || 0) + 1
  })
  const alertas = []
  Object.entries(amarPorJug).forEach(([id, n]) => {
    if (n >= 4) alertas.push({ ico: '🟨', col: 'rgba(245,197,66,0.15)', t: `${nombrePorId[id] || 'Jugador'} en riesgo de sanción`, d: `${n} amarillas acumuladas` })
  })
  rojas.slice(0, 2).forEach((t) => alertas.push({ ico: '🟥', col: 'rgba(239,68,68,0.15)', t: `${nombrePorId[t.jugador_id] || 'Jugador'} sancionado`, d: 'Tarjeta roja registrada' }))
  if (!conv?.rival) alertas.push({ ico: '📋', col: 'rgba(45,212,191,0.15)', t: 'Sin convocatoria preparada', d: 'Prepara el próximo partido' })
  if (entrenosSemana.length === 0) alertas.push({ ico: '🏋️', col: 'rgba(139,92,246,0.15)', t: 'Sin entrenos esta semana', d: 'Planifica una sesión' })

  return (
    <div>
      {/* TOP BAR */}
      <div className="dash2-top">
        <div className="flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-[13px] bg-card border border-borde grid place-items-center text-2xl overflow-hidden flex-shrink-0">
            {escudo ? <img src={escudo} alt="" className="w-full h-full object-cover" /> : '🛡️'}
          </div>
          <div>
            <div className="dash2-hello">Hola, {nombre} 👋</div>
            <div className="dash2-hello-sub">{desc || club}</div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="dash2-row hero">
        <div className="dash2-hero-match" style={{
          background: "linear-gradient(105deg, rgba(2,10,18,0.95) 0%, rgba(2,10,18,0.78) 42%, rgba(2,10,18,0.30) 100%), url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=70') center/cover no-repeat",
        }}>
          <div className="dash2-hero-content">
            <div className="dash2-hero-lbl">PRÓXIMO PARTIDO</div>
            <div className="dash2-hero-date">{conv?.fecha ? fechaLarga(conv.fecha) : 'Sin convocatoria aún'}</div>
            <div className="dash2-hero-teams">{club}<br /><span className="vs">vs</span> <span className="riv">{conv?.rival || '—'}</span></div>
            <div className="dash2-hero-meta">
              <span>👥 {conv?.titulares?.length || 0} convocados</span>
            </div>
            <button className="dash2-hero-btn" onClick={() => nav('/convocatoria')}>PREPARAR CONVOCATORIA →</button>
          </div>
        </div>

        <div className="dash2-panel">
          <div className="dash2-h">Sugerencias IA <span className="text-[10px] font-bold text-morado bg-morado/15 px-2 py-0.5 rounded normal-case tracking-normal">🤖 Auto</span></div>
          {pj === 0 ? <>
            <div className="dash2-sug">
              <div className="dash2-sug-ico" style={{ background: 'rgba(45,212,191,0.12)', borderColor: 'rgba(45,212,191,0.3)' }}>👥</div>
              <div><div className="dash2-sug-t">Añade tu plantilla</div><div className="dash2-sug-d">Registra los jugadores en el módulo Plantilla.</div></div>
            </div>
            <div className="dash2-sug">
              <div className="dash2-sug-ico" style={{ background: 'rgba(94,234,212,0.12)', borderColor: 'rgba(94,234,212,0.3)' }}>📋</div>
              <div><div className="dash2-sug-t">Prepara una convocatoria</div><div className="dash2-sug-d">Crea tu primera alineación antes del partido.</div></div>
            </div>
            <div className="dash2-sug">
              <div className="dash2-sug-ico" style={{ background: 'rgba(245,197,66,0.12)', borderColor: 'rgba(245,197,66,0.3)' }}>⚽</div>
              <div><div className="dash2-sug-t">Registra partidos</div><div className="dash2-sug-d">Usa En Vivo para que el análisis IA funcione.</div></div>
            </div>
          </> : <>
            <div className="dash2-sug">
              <div className="dash2-sug-ico" style={{ background: 'rgba(45,212,191,0.12)', borderColor: 'rgba(45,212,191,0.3)' }}>🎯</div>
              <div><div className="dash2-sug-t">Aprovecha tu fortaleza</div><div className="dash2-sug-d">{idxAtaque >= idxDefensa ? 'Tu ataque rinde bien, presiona alto' : 'Sé sólido atrás y juega al contragolpe'}</div></div>
            </div>
            <div className="dash2-sug">
              <div className="dash2-sug-ico" style={{ background: 'rgba(94,234,212,0.12)', borderColor: 'rgba(94,234,212,0.3)' }}>📈</div>
              <div><div className="dash2-sug-t">Forma reciente</div><div className="dash2-sug-d">{idxForma >= 60 ? 'Buena racha, mantén la dinámica' : 'Toca recuperar sensaciones'}</div></div>
            </div>
            <div className="dash2-sug">
              <div className="dash2-sug-ico" style={{ background: 'rgba(245,197,66,0.12)', borderColor: 'rgba(245,197,66,0.3)' }}>🛡️</div>
              <div><div className="dash2-sug-t">A trabajar</div><div className="dash2-sug-d">{idxDefensa < 60 ? 'Reforzar el trabajo defensivo' : 'Mantener concentración en defensa'}</div></div>
            </div>
          </>}
        </div>
      </div>

      {/* ROW 2 */}
      <div className="dash2-row tri">
        {/* Estado del equipo */}
        <div className="dash2-panel">
          <div className="dash2-h">Estado del equipo</div>
          {pj === 0 ? (
            <div className="text-sm text-muted text-center py-6">Juega partidos para ver tus índices.</div>
          ) : (
            <div className="dash2-estado">
              <div className="dash2-overall">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={r} fill="none" stroke="#27272a" strokeWidth="9" />
                  <circle cx="60" cy="60" r={r} fill="none" stroke="#2dd4bf" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={overOff} />
                </svg>
                <div className="dash2-overall-logo">
                  {escudo ? <img src={escudo} alt="" /> : '🛡️'}
                </div>
                <div className="dash2-overall-num">{overall}</div>
                <div className="dash2-overall-lbl">Global</div>
              </div>
              <div className="dash2-gauges">
                <DashGauge value={idxAtaque} color="#2dd4bf" icon="⚽" label="Ataque" />
                <DashGauge value={idxDefensa} color="#f5c542" icon="🛡️" label="Defensa" />
                <DashGauge value={idxForma} color="#5eead4" icon="📈" label="Forma" />
                <DashGauge value={idxEfect} color="#3b82f6" icon="🎯" label="Efectividad" />
              </div>
            </div>
          )}
        </div>

        {/* ¿Qué trabajar esta semana? (entrenos de la semana) */}
        <div className="dash2-panel">
          <div className="dash2-h">¿Qué trabajar esta semana?
            <span className="text-[10px] font-bold text-cyan normal-case tracking-normal">{minSemana} min</span>
          </div>
          {trabajos.length === 0 ? (
            <div className="text-sm text-muted py-2">No hay entrenos planificados esta semana.</div>
          ) : (
            trabajos.map(([cat, min]) => (
              <div key={cat} className="dash2-work">
                <div className="dash2-work-ico" style={{ background: (COLOR_CAT[cat] || '#2dd4bf') + '22' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: COLOR_CAT[cat] || '#2dd4bf', display: 'inline-block' }} />
                </div>
                <div>
                  <div className="dash2-work-t">{cat}</div>
                  <div className="dash2-work-d">{min >= 1 ? `${Math.round(min)} min planificados` : 'Objetivo de la semana'}</div>
                </div>
              </div>
            ))
          )}
          <button className="dash2-cta" onClick={() => nav('/entrenamientos')}>PLANIFICAR ENTRENAMIENTO</button>
        </div>

        {/* Último partido */}
        <div className="dash2-panel">
          <div className="dash2-h">Último partido</div>
          {ultimo ? (
            <>
              <div className="dash2-last-score">
                <div className="text-center"><div className="dash2-last-shield">{escudo ? <img src={escudo} alt="" /> : '🛡️'}</div><div className="text-[9.5px] text-muted mt-1">{club.split(' ')[0]}</div></div>
                <div className="dash2-last-num">{ultimo.gf} - {ultimo.gc}</div>
                <div className="text-center"><div className="dash2-last-shield">🛡️</div><div className="text-[9.5px] text-muted mt-1">{(ultimo.rival || 'Rival').split(' ')[0]}</div></div>
              </div>
              <div className="text-center text-xs font-extrabold mb-3" style={{ color: rl.col }}>{rl.t}</div>
              <div className="dash2-link" onClick={() => nav('/informes')}>VER ANÁLISIS COMPLETO</div>
            </>
          ) : (
            <div className="text-sm text-muted text-center py-6">Aún no jugaste ningún partido.</div>
          )}
        </div>
      </div>

      {/* ROW 3: Resumen · Jugadores destacados · Alertas */}
      <div className="dash2-row tri">
        {/* Resumen de temporada */}
        <div className="dash2-panel">
          <div className="dash2-h">Resumen de temporada</div>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <button onClick={() => nav('/plantilla')}><div className="text-2xl font-black text-cyan">{nJug}</div><div className="text-[10px] text-muted">Jugadores</div></button>
            <button onClick={() => nav('/informes')}><div className="text-2xl font-black text-white">{pj}</div><div className="text-[10px] text-muted">Partidos</div></button>
            <button onClick={() => nav('/informes')}><div className="text-2xl font-black text-cyan-neon">{balance.v}-{balance.e}-{balance.d}</div><div className="text-[10px] text-muted">V·E·D</div></button>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex bg-white/5">
            <div style={{ width: pj ? `${balance.v / pj * 100}%` : 0, background: '#2dd4bf' }} />
            <div style={{ width: pj ? `${balance.e / pj * 100}%` : 0, background: '#f59e0b' }} />
            <div style={{ width: pj ? `${balance.d / pj * 100}%` : 0, background: '#ef4444' }} />
          </div>
          <div className="text-[11px] text-muted text-center mt-2">Goles: <span className="text-cyan font-bold">{gf}</span> a favor · <span className="text-rojo font-bold">{gc}</span> en contra</div>
        </div>

        {/* Jugadores destacados (goles reales) */}
        <div className="dash2-panel">
          <div className="dash2-h">Jugadores destacados</div>
          {destacados.length === 0 ? (
            <div className="text-sm text-muted py-4 text-center">Aún sin goleadores registrados.</div>
          ) : (
            <div className="dash2-pdest">
              {destacados.map(([nom, n]) => (
                <div key={nom} className="dash2-pdest-item">
                  <div className="dash2-pdest-av">{iniciales(nom)}</div>
                  <div className="dash2-pdest-name">{nom.split(' ')[0]}</div>
                  <div className="dash2-pdest-val">{n} {n === 1 ? 'gol' : 'goles'}</div>
                </div>
              ))}
              <div className="flex items-center text-cyan text-xl cursor-pointer" onClick={() => nav('/estadisticas')}>›</div>
            </div>
          )}
        </div>

        {/* Alertas reales */}
        <div className="dash2-panel">
          <div className="dash2-h">Alertas</div>
          {alertas.length === 0 ? (
            <div className="text-sm text-muted py-4 text-center">Todo en orden ✅</div>
          ) : (
            alertas.slice(0, 4).map((a, i) => (
              <div key={i} className="dash2-alerta">
                <div className="dash2-alerta-ico" style={{ background: a.col }}>{a.ico}</div>
                <div><div className="dash2-alerta-t">{a.t}</div><div className="dash2-alerta-d">{a.d}</div></div>
              </div>
            ))
          )}
          <div className="dash2-link mt-3" onClick={() => nav('/amonestaciones')}>VER AMONESTACIONES</div>
        </div>
      </div>
    </div>
  )
}
