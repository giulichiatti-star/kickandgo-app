import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerfil } from '../lib/perfil'
import { listarJugadores } from '../lib/jugadores'
import { listarPartidos } from '../lib/partidos'
import { ultimaConvocatoria } from '../lib/convocatorias'
import { listarEntrenos, COLOR_CAT } from '../lib/entrenamientos'
import { listarTarjetas } from '../lib/tarjetas'
import { listarLesiones } from '../lib/lesiones'
import { useEquipo } from '../contexts/EquipoContext'
import PWAInstallBanner from '../components/PWAInstallBanner'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { useSyncPendientes } from '../hooks/useSyncPendientes'

function fechaLarga(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
function iniciales(nom = '') {
  return nom.split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || '·'
}

function SugIA({ color, bg, icon, titulo, desc, onClick }) {
  return (
    <div className="dash2-sug" onClick={onClick}>
      <div className="dash2-sug-ico" style={{ background: bg, color, border: `1px solid ${color}33` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="dash2-sug-t">{titulo}</div>
        <div className="dash2-sug-d">{desc}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ opacity: 0.5, flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}

const GAUGE_ICONS = {
  ataque: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  defensa: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  forma: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  efectividad: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
}

function DashGauge({ value, color, label, iconKey }) {
  const r = 32, total = 2 * Math.PI * r
  const off = total * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className="dash2-gauge">
      <div className="dash2-gauge-ring">
        <svg width="74" height="74" viewBox="0 0 74 74"
          style={{ '--dash-total': total, '--dash-offset': off }}>
          <circle className="track" cx="37" cy="37" r={r} fill="none" strokeWidth="6" />
          <circle className="fill" cx="37" cy="37" r={r} fill="none" stroke={color}
            strokeWidth="6" strokeLinecap="round"
            style={{ '--dash-total': total, '--dash-offset': off }} />
        </svg>
        <div className="dash2-gauge-inner">
          <div className="dash2-gauge-ico" style={{ background: color + '22', color }}>
            {GAUGE_ICONS[iconKey]}
          </div>
          <span className="dash2-gauge-num" style={{ color }}>{Math.round(value)}</span>
        </div>
      </div>
      <div className="dash2-gauge-lbl">{label}</div>
    </div>
  )
}

export default function Inicio() {
  const { mostrar: mostrarPWA, instalar, descartar } = usePWAInstall()
  const nav = useNavigate()
  const { equipoActivo, cargando: cargandoEquipo } = useEquipo()
  const { pendientes, sincronizar } = useSyncPendientes()
  const eid = equipoActivo?.id
  const [perfil, setPerfil] = useState(null)
  const [jugadores, setJugadores] = useState([])
  const [partidos, setPartidos] = useState([])
  const [conv, setConv] = useState(null)
  const [entrenos, setEntrenos] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [lesiones, setLesiones] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const [p, js, ps, c, en, tj, ls] = await Promise.all([
          getPerfil(), listarJugadores(eid), listarPartidos(eid), ultimaConvocatoria(eid),
          listarEntrenos(eid).catch(() => []), listarTarjetas(eid).catch(() => []),
          listarLesiones(eid).catch(() => []),
        ])
        setPerfil(p); setJugadores(js); setPartidos(ps); setConv(c); setEntrenos(en); setTarjetas(tj); setLesiones(ls)
      } catch { /* noop */ }
    })()
  }, [eid])
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
  const club = equipoActivo?.nombre || perfil?.club_nombre || 'Mi club'
  const desc = equipoActivo?.descripcion || perfil?.descripcion || ''
  const escudo = equipoActivo?.escudo_url || perfil?.escudo_url

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

  // Fallback: si no hay eventos de goles, mostrar los 3 atacantes/extremos principales
  const atacantes = jugadores
    .filter((j) => /delantero|extremo|punta|forward|delantera/i.test(j.posicion || ''))
    .slice(0, 3)
  const showFallback = destacados.length === 0 && atacantes.length > 0

  // Mapa nombre→jugador para buscar foto_url en destacados
  const jugPorNombre = Object.fromEntries(jugadores.map((j) => [j.nombre, j]))

  // --- Alertas reales ---
  const jugPorId = Object.fromEntries(jugadores.map((j) => [j.id, j]))
  const nombrePorId = Object.fromEntries(jugadores.map((j) => [j.id, j.nombre]))
  const amarPorJug = {}, rojas = []
  tarjetas.forEach((t) => {
    if (t.tipo === 'roja') rojas.push(t)
    else amarPorJug[t.jugador_id] = (amarPorJug[t.jugador_id] || 0) + 1
  })
  const alertas = []
  Object.entries(amarPorJug).forEach(([id, n]) => {
    if (n >= 4) alertas.push({ jug: jugPorId[id], col: 'rgba(245,197,66,0.15)', border: '#f59e0b', t: `${nombrePorId[id] || 'Jugador'} en riesgo`, d: `${n} amarillas acumuladas` })
  })
  rojas.slice(0, 2).forEach((t) => alertas.push({ jug: jugPorId[t.jugador_id], col: 'rgba(239,68,68,0.15)', border: '#ef4444', t: `${nombrePorId[t.jugador_id] || 'Jugador'} sancionado`, d: 'Tarjeta roja registrada' }))
  // Alertas de lesiones
  const hoyMs = new Date().setHours(0,0,0,0)
  lesiones.filter(l => !l.alta).forEach(l => {
    const jug = jugPorId[l.jugador_id]
    if (!jug) return
    if (l.fecha_alta) {
      const diasHasta = Math.ceil((new Date(l.fecha_alta) - hoyMs) / 86400000)
      if (diasHasta >= 0 && diasHasta <= 7) {
        alertas.push({ jug, col: 'rgba(16,185,129,0.15)', border: '#10b981', t: `${jug.nombre.split(' ')[0]} vuelve en ${diasHasta}d`, d: `Alta prevista: ${l.fecha_alta}` })
      } else if (diasHasta < 0) {
        alertas.push({ jug, col: 'rgba(239,68,68,0.15)', border: '#ef4444', t: `${jug.nombre.split(' ')[0]} — alta superada`, d: 'Revisar estado médico' })
      }
    }
  })
  if (pendientes > 0) alertas.unshift({ ico: '📴', col: 'rgba(245,158,11,0.15)', border: '#f59e0b', t: `${pendientes} partido${pendientes > 1 ? 's' : ''} sin sincronizar`, d: 'Toca para subir ahora', onClick: sincronizar })
  if (!conv?.rival) alertas.push({ ico: '📋', col: 'rgba(45,212,191,0.15)', border: '#2dd4bf', t: 'Sin convocatoria preparada', d: 'Prepara el próximo partido' })
  if (entrenosSemana.length === 0) alertas.push({ ico: '🏋️', col: 'rgba(139,92,246,0.15)', border: '#8b5cf6', t: 'Sin entrenos esta semana', d: 'Planifica una sesión' })

  // Sin equipo: pantalla de bienvenida con guía
  if (!cargandoEquipo && !equipoActivo) {
    return (
      <div>
        {/* Banner de bienvenida */}
        <div style={{
          background: 'linear-gradient(135deg, #18181b 0%, #1a2235 100%)',
          border: '1px solid #10b98140',
          borderLeft: '4px solid #10b981',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #10b98130, #10b98110)',
              border: '1px solid #10b98140',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>⚽</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>
                Bienvenido a KICK AND GO
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fafafa' }}>
                Empieza en 3 pasos
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[
              { n: 1, texto: 'Crea tu equipo — nombre, escudo y tipo (Fútbol 11 o 7).', dest: '/ajustes', btn: '→ Ir a Ajustes' },
              { n: 2, texto: 'Añade tus jugadores en Plantilla.', dest: '/plantilla', btn: '→ Ir a Plantilla' },
              { n: 3, texto: 'Prepara la convocatoria y empieza un partido en vivo.', dest: '/convocatoria', btn: '→ Ir a Convocatoria' },
            ].map(({ n, texto, dest, btn }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#ffffff06', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: '#10b98120', border: '1px solid #10b98140',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 900, color: '#10b981',
                }}>{n}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', flex: 1, lineHeight: 1.4 }}>{texto}</div>
                <button
                  onClick={() => nav(dest)}
                  style={{
                    fontSize: 11, fontWeight: 700, color: '#10b981',
                    background: 'none', border: '1px solid #10b98140',
                    borderRadius: 8, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>{btn}</button>
              </div>
            ))}
          </div>

          <button
            onClick={() => nav('/ajustes')}
            style={{
              width: '100%', background: '#10b981', color: '#000',
              fontWeight: 800, fontSize: 13, borderRadius: 10,
              padding: '12px', border: 'none', cursor: 'pointer',
            }}>
            ✚ Crear mi equipo ahora
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {mostrarPWA && <PWAInstallBanner onInstalar={instalar} onDescartar={descartar} />}
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
            <SugIA color="#2dd4bf" bg="rgba(45,212,191,0.12)" onClick={() => nav('/plantilla')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 20v-2a6 6 0 0112 0v2"/><circle cx="19" cy="7" r="2"/><path d="M21 20v-1a3 3 0 00-3-3"/></svg>}
              titulo="Añade tu plantilla" desc="Registra los jugadores en el módulo Plantilla." />
            <SugIA color="#5eead4" bg="rgba(94,234,212,0.10)" onClick={() => nav('/convocatoria')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>}
              titulo="Prepara una convocatoria" desc="Crea tu primera alineación antes del partido." />
            <SugIA color="#f59e0b" bg="rgba(245,158,11,0.10)" onClick={() => nav('/envivo')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>}
              titulo="Registra partidos" desc="Usa En Vivo para que el análisis IA funcione." />
          </> : <>
            <SugIA color="#2dd4bf" bg="rgba(45,212,191,0.10)" onClick={() => nav('/informes')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>}
              titulo="Aprovecha tu fortaleza"
              desc={idxAtaque >= idxDefensa ? 'Tu ataque rinde bien — presiona alto desde el inicio' : 'Sé sólido atrás y ejecuta al contragolpe'} />
            <SugIA color="#5eead4" bg="rgba(94,234,212,0.08)" onClick={() => nav('/estadisticas')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              titulo="Forma reciente"
              desc={idxForma >= 60 ? 'Buena racha — mantén la dinámica y ritmo' : 'Toca recuperar sensaciones, trabaja la cohesión'} />
            <SugIA color="#f59e0b" bg="rgba(245,158,11,0.08)" onClick={() => nav('/entrenamientos')}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              titulo="A trabajar esta semana"
              desc={idxDefensa < 60 ? 'Refuerza el bloque defensivo en el próximo entreno' : 'Mantén concentración atrás, enfócate en finalización'} />
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
                <DashGauge value={idxAtaque} color="#2dd4bf" iconKey="ataque" label="Ataque" />
                <DashGauge value={idxDefensa} color="#f5c542" iconKey="defensa" label="Defensa" />
                <DashGauge value={idxForma} color="#5eead4" iconKey="forma" label="Forma" />
                <DashGauge value={idxEfect} color="#3b82f6" iconKey="efectividad" label="Efectividad" />
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

        {/* Jugadores destacados (goles reales o fallback atacantes) */}
        <div className="dash2-panel">
          <div className="dash2-h">Jugadores destacados</div>
          {destacados.length === 0 && !showFallback ? (
            <div className="text-sm text-muted py-4 text-center">Aún sin goleadores registrados.</div>
          ) : showFallback ? (
            <div className="dash2-pdest">
              {atacantes.map((j) => (
                <div key={j.id} className="dash2-pdest-item">
                  <div className="dash2-pdest-av">
                    {j.foto_url ? <img src={j.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : iniciales(j.nombre)}
                  </div>
                  <div className="dash2-pdest-name">{j.nombre.split(' ')[0]}</div>
                  <div className="dash2-pdest-val" style={{ fontSize: 10, color: '#a1a1aa' }}>#{j.dorsal}</div>
                </div>
              ))}
              <div className="flex items-center text-cyan text-xl cursor-pointer" onClick={() => nav('/plantilla')}>›</div>
            </div>
          ) : (
            <div className="dash2-pdest">
              {destacados.map(([nom, n]) => {
                const j = jugPorNombre[nom]
                return (
                  <div key={nom} className="dash2-pdest-item">
                    <div className="dash2-pdest-av">
                      {j?.foto_url ? <img src={j.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : iniciales(nom)}
                    </div>
                    <div className="dash2-pdest-name">{nom.split(' ')[0]}</div>
                    <div className="dash2-pdest-val">{n} {n === 1 ? 'gol' : 'goles'}</div>
                  </div>
                )
              })}
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
              <div key={i} className="dash2-alerta" onClick={a.onClick} style={a.onClick ? { cursor: 'pointer' } : {}}>
                <div className="dash2-alerta-ico" style={{ background: a.col, border: `1px solid ${a.border}44`, padding: 0, overflow: 'hidden' }}>
                  {a.jug?.foto_url
                    ? <img src={a.jug.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : a.jug
                      ? <span style={{ fontSize: 11, fontWeight: 800, color: '#fafafa' }}>{iniciales(a.jug.nombre)}</span>
                      : a.ico}
                </div>
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
