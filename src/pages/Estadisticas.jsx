import { useEffect, useState, useMemo } from 'react'
import { useEquipo } from '../contexts/EquipoContext'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { listarPartidos } from '../lib/partidos'
import { listarJugadores } from '../lib/jugadores'
import { agregarMinutos, hayDatosMinutos, fmtMin } from '../lib/minutos'

// ── Colores ──────────────────────────────────────────────────────
const C = { cyan: '#2dd4bf', gold: '#f59e0b', red: '#ef4444', blue: '#3b82f6', purple: '#8b5cf6', green: '#10b981' }
const GRID = '#27272a'
const MUTED = '#52525b'
const TEXT = '#a1a1aa'

// ── Tooltip custom ────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      {label && <div style={{ color: '#fafafa', fontWeight: 700, marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fafafa', marginBottom: 2 }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  )
}

// ── Tarjeta KPI ───────────────────────────────────────────────────
function KPI({ label, value, sub, color = C.cyan, icon }) {
  return (
    <div style={{
      background: '#1c1c20', border: '1px solid #27272a', borderRadius: 14,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontSize: 11, color: TEXT, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase' }}>{label}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#fafafa', lineHeight: 1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT }}>{sub}</div>}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────
function Panel({ title, badge, children, style }) {
  return (
    <div style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 14, padding: '16px', ...style }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.6px', textTransform: 'uppercase', color: C.cyan, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {title}
          {badge && <span style={{ fontSize: 10, color: TEXT, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>{badge}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Mini badge V/E/D ─────────────────────────────────────────────
function Badge({ r }) {
  const cfg = { V: [C.cyan, '#0f0f11'], E: [C.gold, '#0f0f11'], D: [C.red, '#fff'] }
  const [bg, fg] = cfg[r] || ['#27272a', '#a1a1aa']
  return (
    <span style={{ width: 26, height: 26, borderRadius: 7, background: bg, color: fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
      {r}
    </span>
  )
}

// ── Tab bar ──────────────────────────────────────────────────────
const TABS = [['global', 'Global'], ['jornadas', 'Jornada a Jornada'], ['goleadores', 'Goleadores'], ['minutos', 'Minutos']]

export default function Estadisticas() {
  const [partidos, setPartidos] = useState([])
  const [jugadores, setJugadores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState('global')
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id

  useEffect(() => {
    (async () => {
      try {
        const [ps, js] = await Promise.all([listarPartidos(eid), listarJugadores(eid).catch(() => [])])
        setPartidos(ps); setJugadores(js)
      } finally { setCargando(false) }
    })()
  }, [eid])

  const stats = useMemo(() => {
    const pj = partidos.length
    if (!pj) return null

    let v = 0, e = 0, d = 0, gf = 0, gc = 0
    let vLocal = 0, eLocal = 0, dLocal = 0, nLocal = 0
    let vVis = 0, eVis = 0, dVis = 0, nVis = 0

    // Goles por minuto (7 franjas × 15 min)
    const franjasGol = [0, 0, 0, 0, 0, 0]
    const franjasGc  = [0, 0, 0, 0, 0, 0]
    const franjasLabels = ['1-15', '16-30', '31-45', '46-60', '61-75', '76-90']

    // Goleadores desde eventos
    const golMap = {}, asistMap = {}

    // Puntos acumulados (para área chart)
    let pts = 0
    const jornadaData = [...partidos].reverse().map((p, i) => {
      const res = p.gf > p.gc ? 'V' : p.gf < p.gc ? 'D' : 'E'
      if (res === 'V') { v++; pts += 3 } else if (res === 'E') { e++; pts += 1 } else d++
      gf += p.gf || 0; gc += p.gc || 0

      if (p.local_visitante === 'local') {
        nLocal++
        if (res === 'V') vLocal++; else if (res === 'E') eLocal++; else dLocal++
      } else {
        nVis++
        if (res === 'V') vVis++; else if (res === 'E') eVis++; else dVis++
      }

      // Eventos del partido
      ;(Array.isArray(p.notas) ? p.notas : []).forEach((ev) => {
        if (!ev.jugador) return
        if (/gol/i.test(ev.tipo || '')) {
          golMap[ev.jugador] = (golMap[ev.jugador] || 0) + 1
          const min = parseInt(ev.min) || 0
          const fi = Math.min(Math.floor((min - 1) / 15), 5)
          if (fi >= 0) franjasGol[fi]++
        }
        if (/asist/i.test(ev.tipo || '')) {
          asistMap[ev.jugador] = (asistMap[ev.jugador] || 0) + 1
          const min = parseInt(ev.min) || 0
          const fi = Math.min(Math.floor((min - 1) / 15), 5)
          if (fi >= 0) franjasGc[fi]++
        }
      })

      return {
        j: `J${i + 1}`,
        rival: (p.rival || '').split(' ')[0],
        gf: p.gf || 0, gc: p.gc || 0,
        pts, ptsJ: res === 'V' ? 3 : res === 'E' ? 1 : 0,
        res,
      }
    })

    const goleadores = Object.entries(golMap)
      .map(([nom, g]) => ({ nom, goles: g, asist: asistMap[nom] || 0 }))
      .sort((a, b) => b.goles - a.goles)

    // Índices
    const clamp = (n) => Math.max(0, Math.min(99, Math.round(n)))
    const idxAtaque  = clamp((gf / pj) / 3 * 100)
    const idxDefensa = clamp(100 - (gc / pj) / 3 * 100)
    const idxEfect   = clamp(v / pj * 100)
    const ult5 = partidos.slice(0, 5)
    const pts5 = ult5.reduce((a, p) => a + (p.gf > p.gc ? 3 : p.gf === p.gc ? 1 : 0), 0)
    const idxForma   = ult5.length ? clamp(pts5 / (ult5.length * 3) * 100) : 0

    const radarData = [
      { cat: 'Ataque',      val: idxAtaque },
      { cat: 'Defensa',     val: idxDefensa },
      { cat: 'Forma',       val: idxForma },
      { cat: 'Efectividad', val: idxEfect },
      { cat: 'Local',       val: nLocal ? clamp(vLocal / nLocal * 100) : 0 },
      { cat: 'Visitante',   val: nVis ? clamp(vVis / nVis * 100) : 0 },
    ]

    const donutData = [
      { name: 'Victorias', value: v, color: C.cyan },
      { name: 'Empates',   value: e, color: C.gold },
      { name: 'Derrotas',  value: d, color: C.red },
    ]

    const localVisData = [
      { name: 'Local',     V: vLocal, E: eLocal, D: dLocal, pj: nLocal },
      { name: 'Visitante', V: vVis,   E: eVis,   D: dVis,   pj: nVis },
    ]

    const minutosData = franjasLabels.map((l, i) => ({
      franja: l, GF: franjasGol[i], GA: franjasGc[i],
    }))

    const racha5 = partidos.slice(0, 5).map((p) => p.gf > p.gc ? 'V' : p.gf < p.gc ? 'D' : 'E')

    return {
      pj, v, e, d, gf, gc, pts,
      idxAtaque, idxDefensa, idxForma, idxEfect,
      radarData, donutData, jornadaData, localVisData,
      minutosData, goleadores, racha5,
      pctV: clamp(v / pj * 100),
    }
  }, [partidos])

  // Minutos jugados (derivados de la alineación guardada en cada partido).
  const minutos = useMemo(() => {
    const agg = agregarMinutos(partidos)
    // Nombre/dorsal: primero de la plantilla actual; si el jugador ya no está,
    // se recupera del nombre guardado en la alineación del partido.
    const byId = Object.fromEntries((jugadores || []).map((j) => [j.id, j]))
    const nomAlin = {}
    for (const p of partidos) {
      const al = p.alineacion
      if (!al) continue
      for (const t of [...(al.titulares || []), ...(al.suplentes || [])]) {
        if (t?.id && !nomAlin[t.id]) nomAlin[t.id] = { nombre: t.nombre, dorsal: t.dorsal }
      }
    }
    const rank = Object.entries(agg).map(([id, val]) => {
      const j = byId[id] || nomAlin[id] || {}
      return {
        id,
        nom: j.nombre || 'Jugador',
        dorsal: j.dorsal,
        minutos: val.minutos,
        partidos: val.partidos,
        media: val.partidos ? Math.round(val.minutos / val.partidos) : 0,
      }
    }).sort((a, b) => b.minutos - a.minutos)
    return { rank, hay: hayDatosMinutos(partidos) }
  }, [partidos, jugadores])

  if (cargando) return <div style={{ color: TEXT, padding: '40px', textAlign: 'center' }}>Cargando…</div>
  if (!stats) return (
    <div style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 14, padding: '40px', textAlign: 'center', color: TEXT }}>
      Sin datos. Registra partidos en <b style={{ color: C.cyan }}>En Vivo</b> para ver tus estadísticas.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 2 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fafafa', letterSpacing: '-.3px', margin: 0 }}>Estadísticas</h1>
        <div style={{ display: 'flex', gap: 4, background: '#0f0f11', padding: 4, borderRadius: 10 }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '.3px',
              background: tab === id ? '#1c1c20' : 'transparent',
              color: tab === id ? C.cyan : TEXT,
              boxShadow: tab === id ? `0 0 0 1px ${C.cyan}` : 'none',
              transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ═══════════════ TAB: GLOBAL ═══════════════ */}
      {tab === 'global' && <>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <KPI label="Partidos" value={stats.pj} sub={`${stats.v}V · ${stats.e}E · ${stats.d}D`} color={C.cyan}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>} />
          <KPI label="Goles a favor" value={stats.gf} sub={`${(stats.gf / stats.pj).toFixed(1)} por partido`} color={C.green}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>} />
          <KPI label="Goles en contra" value={stats.gc} sub={`${(stats.gc / stats.pj).toFixed(1)} por partido`} color={C.red}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />
          <KPI label="% Victorias" value={`${stats.pctV}%`} sub={`${stats.pts} puntos totales`} color={C.gold}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
        </div>

        {/* Racha + Donut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
          <Panel title="Radar de rendimiento" badge={`Overall ${Math.round((stats.idxAtaque + stats.idxDefensa + stats.idxForma + stats.idxEfect) / 4)}`}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={stats.radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke={GRID} />
                <PolarAngleAxis dataKey="cat" tick={{ fill: TEXT, fontSize: 11, fontWeight: 600 }} />
                <Radar name="Índice" dataKey="val" stroke={C.cyan} fill={C.cyan} fillOpacity={0.18} strokeWidth={2} dot={{ r: 3, fill: C.cyan }} />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Resultados">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.donutData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} strokeWidth={0}>
                  {stats.donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 9, padding: '8px 12px', fontSize: 12 }}>
                    <span style={{ color: payload[0].payload.color, fontWeight: 700 }}>{payload[0].name}: {payload[0].value}</span>
                  </div>
                ) : null} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {stats.donutData.map((d) => (
                <div key={d.name} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: d.color }}>{d.value}</div>
                  <div style={{ fontSize: 10, color: TEXT }}>{d.name}</div>
                </div>
              ))}
            </div>
            {/* Racha */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.5px', color: TEXT, textTransform: 'uppercase', marginBottom: 8 }}>Últimos 5</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {stats.racha5.map((r, i) => <Badge key={i} r={r} />)}
              </div>
            </div>
          </Panel>
        </div>

        {/* Local vs Visitante */}
        <Panel title="Local vs Visitante">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.localVisData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: TEXT, paddingTop: 8 }} />
                <Bar dataKey="V" name="Victorias" fill={C.cyan}  radius={[4,4,0,0]} />
                <Bar dataKey="E" name="Empates"   fill={C.gold}  radius={[4,4,0,0]} />
                <Bar dataKey="D" name="Derrotas"  fill={C.red}   radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.localVisData.map((row) => {
                const tot = row.V + row.E + row.D || 1
                return (
                  <div key={row.name}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#fafafa', marginBottom: 6 }}>{row.name} · {row.pj} PJ</div>
                    <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 1 }}>
                      <div style={{ width: `${row.V / tot * 100}%`, background: C.cyan }} />
                      <div style={{ width: `${row.E / tot * 100}%`, background: C.gold }} />
                      <div style={{ width: `${row.D / tot * 100}%`, background: C.red }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 11 }}>
                      <span style={{ color: C.cyan, fontWeight: 700 }}>{row.V}V ({Math.round(row.V / tot * 100)}%)</span>
                      <span style={{ color: C.gold, fontWeight: 700 }}>{row.E}E</span>
                      <span style={{ color: C.red, fontWeight: 700 }}>{row.D}D</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Panel>
      </>}

      {/* ═══════════════ TAB: JORNADA A JORNADA ═══════════════ */}
      {tab === 'jornadas' && <>
        {/* Puntos acumulados */}
        <Panel title="Puntos acumulados" badge={`Total: ${stats.pts} pts`}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.jornadaData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.cyan} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="j" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(stats.jornadaData.length / 8)} />
              <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="pts" name="Puntos acum." stroke={C.cyan} fill="url(#gradPts)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: C.cyan }} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* GF vs GC por jornada */}
        <Panel title="Goles a favor vs en contra por jornada">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.jornadaData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="j" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(stats.jornadaData.length / 8)} />
              <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                  <div style={{ color: '#fafafa', fontWeight: 700, marginBottom: 6 }}>{label} · vs {payload[0]?.payload?.rival}</div>
                  <div style={{ color: C.cyan }}>GF: <b>{payload[0]?.value}</b></div>
                  <div style={{ color: C.red }}>GC: <b>{payload[1]?.value}</b></div>
                </div>
              ) : null} />
              <Legend wrapperStyle={{ fontSize: 11, color: TEXT }} />
              <Bar dataKey="gf" name="Goles favor"    fill={C.cyan} radius={[4,4,0,0]} />
              <Bar dataKey="gc" name="Goles en contra" fill={C.red}  radius={[4,4,0,0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Puntos por partido */}
        <Panel title="Puntos por partido">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.jornadaData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="j" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(stats.jornadaData.length / 8)} />
              <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} ticks={[0,1,3]} domain={[0, 3]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                  <div style={{ color: '#fafafa', fontWeight: 700, marginBottom: 4 }}>{label} · vs {payload[0]?.payload?.rival}</div>
                  <div style={{ color: payload[0]?.payload?.ptsJ === 3 ? C.cyan : payload[0]?.payload?.ptsJ === 1 ? C.gold : C.red }}>
                    {payload[0]?.payload?.res === 'V' ? 'Victoria — 3 pts' : payload[0]?.payload?.res === 'E' ? 'Empate — 1 pt' : 'Derrota — 0 pts'}
                  </div>
                </div>
              ) : null} />
              <Bar dataKey="ptsJ" name="Puntos" radius={[5,5,0,0]}>
                {stats.jornadaData.map((d, i) => (
                  <Cell key={i} fill={d.ptsJ === 3 ? C.cyan : d.ptsJ === 1 ? C.gold : C.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </>}

      {/* ═══════════════ TAB: GOLEADORES ═══════════════ */}
      {tab === 'goleadores' && <>
        {stats.goleadores.length === 0 ? (
          <Panel>
            <div style={{ padding: '32px 0', textAlign: 'center', color: TEXT, fontSize: 13 }}>
              Sin goleadores registrados. En <b style={{ color: C.cyan }}>En Vivo</b>, toca el jugador antes de registrar el gol.
            </div>
          </Panel>
        ) : <>
          {/* Top 3 podio */}
          <Panel title="Podio goleadores">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20, padding: '8px 0 16px' }}>
              {[1, 0, 2].map((idx) => {
                const g = stats.goleadores[idx]
                if (!g) return null
                const rank = idx + 1
                const heights = [110, 140, 90]
                const colors = [C.gold, '#c0c0c0', '#cd7f32']
                const colorMap = { 0: colors[1], 1: colors[0], 2: colors[2] }
                const hMap = { 0: heights[1], 1: heights[0], 2: heights[2] }
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: colorMap[idx] + '22', border: `2px solid ${colorMap[idx]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: colorMap[idx] }}>
                      {g.nom.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#fafafa', textAlign: 'center', maxWidth: 80 }}>{g.nom.split(' ')[0]}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: colorMap[idx] }}>{g.goles}</div>
                    <div style={{ width: 70, height: hMap[idx], background: colorMap[idx] + '33', border: `1px solid ${colorMap[idx]}55`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: colorMap[idx] }}>#{rank}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* Tabla completa */}
          <Panel title="Clasificación goleadores">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.goleadores.map((g, i) => {
                const max = stats.goleadores[0].goles
                return (
                  <div key={g.nom} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, fontSize: 11, fontWeight: 800, color: i < 3 ? [C.gold, '#c0c0c0', '#cd7f32'][i] : MUTED, textAlign: 'right', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#253045', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fafafa', flexShrink: 0 }}>
                      {g.nom.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fafafa', truncate: true }}>{g.nom}</span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: C.cyan }}>{g.goles} ⚽</span>
                          {g.asist > 0 && <span style={{ fontSize: 11, color: TEXT }}>{g.asist} 🅰️</span>}
                        </div>
                      </div>
                      <div style={{ height: 5, background: '#27272a', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${g.goles / max * 100}%`, height: '100%', background: i === 0 ? C.cyan : i === 1 ? '#94a3b8' : i === 2 ? C.gold : C.blue, borderRadius: 99, transition: 'width .6s ease' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* Goles por franja horaria */}
          {stats.minutosData.some(d => d.GF > 0) && (
            <Panel title="Goles por franja de minuto">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.minutosData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="franja" tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="GF" name="Goles marcados" fill={C.cyan} radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          )}
        </>}
      </>}

      {tab === 'minutos' && <>
        {!minutos.hay ? (
          <Panel>
            <div style={{ padding: '32px 0', textAlign: 'center', color: TEXT, fontSize: 13, lineHeight: 1.6 }}>
              Aún no hay minutos registrados.<br />
              Dirige un partido en <b style={{ color: C.cyan }}>En Vivo</b> (pulsa <b>INICIAR</b> y registra los cambios) y aquí verás los minutos de cada jugador.
            </div>
          </Panel>
        ) : (
          <Panel title="Minutos jugados" badge={`${minutos.rank.length} jugadores`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {minutos.rank.map((m, i) => {
                const max = minutos.rank[0].minutos || 1
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, fontSize: 11, fontWeight: 800, color: i < 3 ? [C.gold, '#c0c0c0', '#cd7f32'][i] : MUTED, textAlign: 'right', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#253045', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fafafa', flexShrink: 0 }}>
                      {m.dorsal != null ? m.dorsal : m.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom}</span>
                        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: C.cyan }}>{fmtMin(m.minutos)}</span>
                          <span style={{ fontSize: 11, color: TEXT }}>{m.partidos} {m.partidos === 1 ? 'part.' : 'parts.'} · {m.media}′/p</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: '#27272a', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${m.minutos / max * 100}%`, height: '100%', background: i === 0 ? C.cyan : i === 1 ? '#94a3b8' : i === 2 ? C.gold : C.blue, borderRadius: 99, transition: 'width .6s ease' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}
      </>}
    </div>
  )
}
