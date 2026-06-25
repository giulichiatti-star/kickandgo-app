import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../rivinf.css'
import { getCompeticion, guardarCompeticion, resolverLiga, calcularTabla, parseJugados, parseProximas, parseCalendario } from '../lib/competicion'
import { listarPartidos } from '../lib/partidos'
import { getPerfil } from '../lib/perfil'
import { supabase } from '../lib/supabase'
import { useEquipo } from '../contexts/EquipoContext'

const TABS = [
  { id: 'general', label: 'GENERAL' },
  { id: 'clasificacion', label: 'CLASIFICACIÓN' },
  { id: 'goleadores', label: 'GOLEADORES' },
  { id: 'jugados', label: 'JUGADOS' },
  { id: 'proximas', label: 'PRÓXIMAS' },
  { id: 'prep', label: 'PREPARACIÓN' },
]

function analizarNotas(texto) {
  if (!texto || texto.trim().length < 20) return null
  const t = texto.toLowerCase()
  const tips = []
  if (/presión|pressing|presion alta/.test(t)) tips.push({ ico:'⚡', col:'#f59e0b', t:'Presión alta rival', d:'Preparar salida rápida del balón y evitar perderlo en campo propio.' })
  if (/contragolpe|contra golpe|rápido|rapido|transición|transicion/.test(t)) tips.push({ ico:'🏃', col:'#f87171', t:'Peligro al contragolpe', d:'Mantener línea defensiva compacta al atacar.' })
  if (/delantero|goleador|pichichi|nueve|9/.test(t)) tips.push({ ico:'🎯', col:'#f87171', t:'Delantero destacado', d:'Asignar marcador fijo y no dejarle girar.' })
  if (/banda|extremo|lateral|desborde/.test(t)) tips.push({ ico:'↔️', col:'#f59e0b', t:'Peligro por bandas', d:'Reforzar cobertura lateral y evitar espacios en espalda de los laterales.' })
  if (/débil|debil|flojo|lento|lenta/.test(t)) tips.push({ ico:'✅', col:'#34d399', t:'Debilidades detectadas', d:'Explotar las zonas débiles identificadas con combinaciones directas.' })
  if (/set piece|balón parado|balon parado|córner|corner|falta/.test(t)) tips.push({ ico:'🚩', col:'#a78bfa', t:'Peligro a balón parado', d:'Revisar marcajes en córners y faltas laterales.' })
  if (!tips.length) tips.push({ ico:'📋', col:'#60a5fa', t:'Notas registradas', d:'Repasa los puntos anotados antes del partido y comparte con el equipo.' })
  return tips
}

async function getNotasRivales() {
  const { data: u } = await supabase.auth.getUser()
  const { data } = await supabase.from('profiles').select('notas_rivales').eq('id', u.user.id).single()
  return data?.notas_rivales || {}
}

async function saveNotasRivales(obj) {
  const { data: u } = await supabase.auth.getUser()
  await supabase.from('profiles').update({ notas_rivales: obj }).eq('id', u.user.id)
}

export default function Rivales() {
  const nav = useNavigate()
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [tab, setTab] = useState('general')
  const [liga, setLiga] = useState(() => resolverLiga(null))
  const [sel, setSel] = useState(null)
  const [golFiltro, setGolFiltro] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const [notas, setNotas] = useState({})
  const [notasModal, setNotasModal] = useState(false)
  const [compRaw, setCompRaw] = useState(null)
  const [nuestrosPartidos, setNuestrosPartidos] = useState([])
  const [clubNombre, setClubNombre] = useState('')
  const [calTxt, setCalTxt] = useState('')
  const [calPrev, setCalPrev] = useState([])
  const [calMsg, setCalMsg] = useState('')
  const [calGuardando, setCalGuardando] = useState(false)
  // Jugados
  const [jugTxt, setJugTxt] = useState('')
  const [jugPrev, setJugPrev] = useState([])
  const [jugMsg, setJugMsg] = useState('')
  const [jugGuardando, setJugGuardando] = useState(false)
  const [resultModal, setResultModal] = useState(null) // null | 'nuevo' | {partid de proximas}
  // Próximas
  const [proxTxt, setProxTxt] = useState('')
  const [proxPrev, setProxPrev] = useState([])
  const [proxMsg, setProxMsg] = useState('')
  const [proxGuardando, setProxGuardando] = useState(false)
  const [proxManual, setProxManual] = useState({ jornada:'', fecha:'', local:'', visitante:'', hora:'' })
  const [proxAddOpen, setProxAddOpen] = useState(false)
  const [proxCalView, setProxCalView] = useState(false)
  const [prepFocus, setPrepFocus] = useState(null) // nombre del rival a mostrar en prep aunque no tenga notas

  useEffect(() => {
    (async () => {
      const [comp, n, partidos, perfil] = await Promise.all([
        getCompeticion(eid),
        getNotasRivales(),
        listarPartidos(eid),
        getPerfil(),
      ])
      const club = equipoActivo?.nombre || perfil?.club_nombre || ''
      setClubNombre(club)
      setNuestrosPartidos(partidos || [])
      const l = resolverLiga(comp, { nuestrosPartidos: partidos || [], clubNombre: club })
      setCompRaw(comp)
      setLiga(l)
      if (l.tabla.length) setSel(l.tabla.find((t) => t.miEquipo) || l.tabla[0])
      setNotas(n)
    })()
  }, [eid])

  function analizarCal(txt) {
    setCalTxt(txt)
    setCalPrev(txt.trim() ? parseCalendario(txt) : [])
  }

  async function guardarCalendario() {
    if (!calPrev.length) { setCalMsg('Pega partidos primero.'); return }
    setCalGuardando(true); setCalMsg('')
    try {
      const nuevo = { ...(compRaw || {}), calendario: calPrev }
      await guardarCompeticion(nuevo, eid)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
      setCalTxt(''); setCalPrev([])
      setCalMsg('✅ Calendario guardado.')
    } catch (e) { setCalMsg('⚠️ ' + e.message) }
    finally { setCalGuardando(false) }
  }

  async function borrarCalendario() {
    if (!confirm('¿Borrar el calendario completo? Los resultados guardados en Informes no se eliminan.')) return
    setCalGuardando(true); setCalMsg('')
    try {
      const nuevo = { ...(compRaw || {}), calendario: [] }
      await guardarCompeticion(nuevo, eid)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
      setCalMsg('🗑 Calendario borrado.')
    } catch (e) { setCalMsg('⚠️ ' + e.message) }
    finally { setCalGuardando(false) }
  }

  // ── Jugados ───────────────────────────────────────────────
  async function guardarResultado(match) {
    setJugGuardando(true); setJugMsg('')
    try {
      const jugados = [...(compRaw?.calendario_jugado || []), match]
      const nuevaTabla = calcularTabla(jugados)
      const nuevo = { ...(compRaw || {}), calendario_jugado: jugados, tabla: nuevaTabla }
      await guardarCompeticion(nuevo, eid)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
      setJugMsg('✅ Resultado guardado. Clasificación actualizada.')
      setResultModal(null)
    } catch (e) { setJugMsg('⚠️ ' + e.message) }
    finally { setJugGuardando(false) }
  }

  async function eliminarJugado(idx) {
    if (!confirm('¿Eliminar este resultado? La clasificación se recalculará.')) return
    const jugados = (compRaw?.calendario_jugado || []).filter((_, i) => i !== idx)
    const nuevaTabla = calcularTabla(jugados)
    const nuevo = { ...(compRaw || {}), calendario_jugado: jugados, tabla: nuevaTabla }
    await guardarCompeticion(nuevo, eid)
    setCompRaw(nuevo)
    setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
  }

  async function importarJugados() {
    if (!jugPrev.length) { setJugMsg('Pega resultados primero.'); return }
    setJugGuardando(true); setJugMsg('')
    try {
      const jugados = [...(compRaw?.calendario_jugado || []), ...jugPrev]
      const nuevaTabla = calcularTabla(jugados)
      const nuevo = { ...(compRaw || {}), calendario_jugado: jugados, tabla: nuevaTabla }
      await guardarCompeticion(nuevo, eid)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
      setJugTxt(''); setJugPrev([])
      setJugMsg(`✅ ${jugPrev.length} resultados importados. Clasificación actualizada.`)
    } catch (e) { setJugMsg('⚠️ ' + e.message) }
    finally { setJugGuardando(false) }
  }

  // ── Próximas ──────────────────────────────────────────────
  async function guardarProxiManual() {
    if (!proxManual.local || !proxManual.visitante) { setProxMsg('⚠️ Local y visitante son obligatorios.'); return }
    setProxGuardando(true); setProxMsg('')
    try {
      const proximas = [...(compRaw?.proximas_fechas || []), proxManual]
      const nuevo = { ...(compRaw || {}), proximas_fechas: proximas }
      await guardarCompeticion(nuevo, eid)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
      setProxManual({ jornada:'', fecha:'', local:'', visitante:'', hora:'' })
      setProxMsg('✅ Partido añadido.')
    } catch (e) { setProxMsg('⚠️ ' + e.message) }
    finally { setProxGuardando(false) }
  }

  async function importarProximas() {
    if (!proxPrev.length) { setProxMsg('Pega partidos primero.'); return }
    setProxGuardando(true); setProxMsg('')
    try {
      const proximas = [...(compRaw?.proximas_fechas || []), ...proxPrev]
      const nuevo = { ...(compRaw || {}), proximas_fechas: proximas }
      await guardarCompeticion(nuevo, eid)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
      setProxTxt(''); setProxPrev([])
      setProxMsg(`✅ ${proxPrev.length} partidos añadidos.`)
    } catch (e) { setProxMsg('⚠️ ' + e.message) }
    finally { setProxGuardando(false) }
  }

  async function eliminarProxima(idx) {
    const proximas = (compRaw?.proximas_fechas || []).filter((_, i) => i !== idx)
    const nuevo = { ...(compRaw || {}), proximas_fechas: proximas }
    await guardarCompeticion(nuevo, eid)
    setCompRaw(nuevo)
    setLiga(resolverLiga(nuevo, { nuestrosPartidos, clubNombre }))
  }

  // Mover partido próximo a jugados (registrar resultado)
  function moverAJugado(p) {
    setResultModal(p)
  }

  async function actualizarNota(nombre, texto) {
    const n = { ...notas, [nombre]: texto }
    setNotas(n)
    await saveNotasRivales(n)
  }

  const TABLA = liga.tabla
  const GOLEADORES = liga.goleadores
  const sinDatos = !TABLA.length && !GOLEADORES.length && !liga.calendario_jugado.length && !liga.proximas_fechas.length

  if (sinDatos) return (
    <div>
      <h1 className="text-xl font-extrabold mb-1">Rivales</h1>
      <div className="card p-8 text-center space-y-3 mt-4">
        <div className="text-3xl">🛡️</div>
        <div className="font-bold text-blanco">Sin datos de liga todavía</div>
        <p className="text-sm text-muted">Ve a <b className="text-cyan">Club y ajustes → Información de la liga</b> y carga la clasificación, goleadores y calendario.</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-extrabold">Rivales</h1>
          {liga.nombre && <p className="text-xs text-muted">{liga.nombre}</p>}
        </div>
      </div>

      <div className="riv2-tabs">
        {TABS.map((t) => (
          <div key={t.id} className={`riv2-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ---------- GENERAL ---------- */}
      {tab === 'general' && (
        <div className="riv2-layout">
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="text-[13px] font-extrabold text-blanco">Equipos de la liga</div>
              <input className="field max-w-[220px] !py-1.5 text-xs" placeholder="🔍 Buscar equipo…"
                value={buscar} onChange={(e) => setBuscar(e.target.value)} />
            </div>
            <div className="riv2-grid">
              {TABLA.filter((t) => t.nom.toLowerCase().includes(buscar.toLowerCase())).map((t) => (
                <div key={t.pos} className={`riv2-team ${sel.pos === t.pos ? 'sel' : ''}`} onClick={() => setSel(t)}>
                  <div className="riv2-team-shield">{t.ico}</div>
                  <div className="riv2-team-pos">{t.pos}º</div>
                  <div className="riv2-team-name">{t.nom}</div>
                  <div className="riv2-team-pts">{t.pts} pts</div>
                </div>
              ))}
            </div>
            <div className="riv2-footer">
              <span>👥 <b>{TABLA.length}</b> Equipos</span>
              <span>Ascenso <b>1º y 2º</b></span>
              <span>Descenso <b>últimos</b></span>
            </div>
          </div>

          {/* detalle rival */}
          <div className="riv2-detail">
            <div className="riv2-detail-h">
              <div className="riv2-detail-shield">{sel.ico}</div>
              <div className="flex-1">
                <div className="riv2-detail-name">{sel.nom}</div>
                <div className="riv2-detail-liga">Tercera Catalana · Grup 6 · {sel.pos}º clasificado</div>
              </div>
            </div>

            <div className="riv2-sec-h">Resumen liga</div>
            <div className="riv2-resumen">
              <div><div className="v">{sel.pos}º</div><div className="l">Pos</div></div>
              <div><div className="v">{sel.pj}</div><div className="l">PJ</div></div>
              <div><div className="v" style={{ color: '#34d399' }}>{sel.pg}</div><div className="l">PG</div></div>
              <div><div className="v" style={{ color: '#f59e0b' }}>{sel.pe}</div><div className="l">PE</div></div>
              <div><div className="v" style={{ color: '#fca5a5' }}>{sel.pp}</div><div className="l">PP</div></div>
              <div><div className="v">{sel.pts}</div><div className="l">Pts</div></div>
            </div>

            <div className="riv2-sec-h">Goles</div>
            <div className="flex items-center justify-around text-center">
              <div><div className="text-lg font-black text-cyan">{sel.gf}</div><div className="text-[9px] text-muted uppercase">A favor</div></div>
              <div><div className="text-lg font-black" style={{ color: '#fca5a5' }}>{sel.gc}</div><div className="text-[9px] text-muted uppercase">En contra</div></div>
              <div><div className="text-lg font-black text-blanco">{sel.gf - sel.gc > 0 ? '+' : ''}{sel.gf - sel.gc}</div><div className="text-[9px] text-muted uppercase">Diferencia</div></div>
            </div>

            <div className="riv2-sec-h">Últimos 5 partidos</div>
            <div className="riv2-racha">
              {sel.forma.map((f, i) => (
                <div key={i} className="riv2-racha-item">
                  <div className={`riv2-racha-dot ${f}`}>{f}</div>
                </div>
              ))}
            </div>

            {/* Notas del entrenador sobre este rival */}
            {!sel.miEquipo && (
              <>
                <div className="riv2-sec-h" style={{ marginTop: 16 }}>📋 Mis notas sobre este rival</div>
                {notas[sel.nom] ? (
                  <div
                    className="rounded-lg p-3 text-[12px] leading-relaxed cursor-pointer hover:bg-white/5 transition"
                    style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)', whiteSpace: 'pre-wrap', color: '#d4d4d8' }}
                    onClick={() => setNotasModal(true)}
                  >
                    {notas[sel.nom]}
                    <div className="text-[10px] text-cyan mt-2">✏ Toca para editar</div>
                  </div>
                ) : (
                  <button
                    className="w-full rounded-lg py-3 text-[12px] text-muted border border-dashed transition hover:border-cyan hover:text-cyan"
                    style={{ borderColor: 'rgba(113,113,122,0.4)' }}
                    onClick={() => setNotasModal(true)}
                  >
                    + Añadir notas sobre {sel.nom.split(' ')[0]}
                  </button>
                )}
                <button className="btn btn-primary w-full mt-3" onClick={() => setTab('prep')}>📋 Preparar partido vs {sel.nom.split(',')[0]}</button>
              </>
            )}
            {sel.miEquipo && (
              <div className="mt-4 text-[11px] text-cyan text-center font-semibold">Este es tu equipo ⭐</div>
            )}
          </div>
        </div>
      )}

      {/* Modal bloc de notas */}
      {notasModal && sel && (
        <NotasModal
          rival={sel}
          texto={notas[sel.nom] || ''}
          proximoPartido={liga.calendario?.find((c) =>
            c.local?.toLowerCase().includes(sel.nom.split(' ')[0].toLowerCase()) ||
            c.visitante?.toLowerCase().includes(sel.nom.split(' ')[0].toLowerCase())
          )}
          onGuardar={(t) => { actualizarNota(sel.nom, t); setNotasModal(false) }}
          onCerrar={() => setNotasModal(false)}
        />
      )}

      {/* ---------- CLASIFICACIÓN ---------- */}

      {tab === 'clasificacion' && (
        <div>
          <div className="flex items-center gap-3 text-[10px] text-muted mb-3 flex-wrap">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(45,212,191,.4)' }} />Ascenso</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(245,158,11,.3)' }} />Play-off</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(239,68,68,.3)' }} />Descenso</span>
          </div>
          <div className="riv2-tabla-wrap">
            <table className="riv2-tabla">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th><th style={{ width: 32 }}></th><th>Equipo</th>
                  <th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DIF</th>
                  <th style={{ color: '#fff' }}>PTS</th><th>Forma</th>
                </tr>
              </thead>
              <tbody>
                {TABLA.map((t) => {
                  const dif = t.gf - t.gc
                  const zona = t.pos <= 2 ? 'riv2-zona-asc' : t.pos === 3 ? 'riv2-zona-play' : t.pos >= 15 ? 'riv2-zona-desc' : ''
                  return (
                    <tr key={t.pos} className={`${t.miEquipo ? 'mi-equipo ' : ''}${zona}`}>
                      <td className="pos-num">{t.pos}</td>
                      <td className="escudo">{t.ico}</td>
                      <td className="equipo-nombre">{t.miEquipo ? <b>{t.nom}</b> : t.nom}</td>
                      <td>{t.pj}</td><td>{t.pg}</td><td>{t.pe}</td><td>{t.pp}</td>
                      <td>{t.gf}</td><td>{t.gc}</td>
                      <td style={{ color: dif > 0 ? '#2dd4bf' : dif < 0 ? '#ef4444' : '#a1a1aa', fontWeight: 700 }}>
                        {dif > 0 ? '+' : ''}{dif}
                      </td>
                      <td className="pts-cell">{t.pts}</td>
                      <td><div className="racha-mini">{t.forma.map((f, i) => <div key={i} className={`rm ${f}`}>{f}</div>)}</div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[9.5px] text-muted mt-2">Datos orientativos · tu equipo marcado en verde.</div>
        </div>
      )}

      {/* ---------- GOLEADORES ---------- */}
      {tab === 'goleadores' && (() => {
        const data = golFiltro === 'miEquipo' ? GOLEADORES.filter((g) => g.miEquipo) : GOLEADORES
        const max = data[0]?.goles || 1
        const podio = [data[1], data[0], data[2]].filter(Boolean)
        const pClass = ['p2', 'p1', 'p3']
        const crown = ['🥈', '🥇', '🥉']
        return (
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <div>
                <div className="text-[14px] font-extrabold text-blanco">Máximos goleadores</div>
                <div className="text-[11px] text-muted">Grup 6 · Temporada 2024/25</div>
              </div>
              <div className="flex gap-2">
                <button className={`btn ${golFiltro === 'todos' ? 'btn-primary' : 'btn-outline'} text-[10px] !py-1.5 !px-2.5`} onClick={() => setGolFiltro('todos')}>Todos</button>
                <button className={`btn ${golFiltro === 'miEquipo' ? 'btn-primary' : 'btn-outline'} text-[10px] !py-1.5 !px-2.5`} onClick={() => setGolFiltro('miEquipo')}>Mi equipo</button>
              </div>
            </div>

            {podio.length >= 2 && (
              <>
                <div className="riv2-gol-podio">
                  {podio.map((g, k) => (
                    <div key={g.nom} className={`riv2-gol-podio-item ${pClass[k]}`}>
                      <div style={{ fontSize: 16, lineHeight: 1 }}>{crown[k]}</div>
                      <div className="riv2-gol-avatar">{g.ini}</div>
                      <div className="riv2-gol-podio-num">{g.goles}</div>
                      <div className="riv2-gol-podio-lbl">goles</div>
                      <div className="riv2-gol-podio-name">{g.nom}</div>
                      <div className="riv2-gol-podio-club">{g.club}</div>
                    </div>
                  ))}
                </div>
                <div className="riv2-gol-pedestal">
                  {podio.map((g, k) => <div key={k} className={`riv2-gol-ped-blk ${pClass[k]}`} />)}
                </div>
              </>
            )}

            <div className="text-[10px] font-extrabold uppercase tracking-wide text-muted my-2">Ranking completo</div>
            <div className="riv2-gol-list">
              {data.slice(3).map((g, idx) => {
                const pct = Math.round((g.goles / max) * 100)
                return (
                  <div key={g.nom} className={`riv2-gol-row ${g.miEquipo ? 'mi-gol' : ''}`}>
                    <div className="riv2-gol-rank">{idx + 4}</div>
                    <div className="riv2-gol-av2">{g.ini}</div>
                    <div className="riv2-gol-info">
                      <div className="riv2-gol-info-name">
                        {g.nom}{g.miEquipo && <span className="riv2-gol-badge" style={{ background: 'rgba(45,212,191,.15)', color: '#2dd4bf', marginLeft: 6 }}>Tu equipo</span>}
                      </div>
                      <div className="riv2-gol-info-club">{g.club} · {g.pj} PJ · {g.asist} ast</div>
                    </div>
                    <div className="riv2-gol-bar-wrap">
                      <div className="riv2-gol-bar-bg"><div className="riv2-gol-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div className="riv2-gol-bar-lbl">{g.asist} asistencias</div>
                    </div>
                    <div className="riv2-gol-num2">{g.goles}</div>
                  </div>
                )
              })}
            </div>
            <div className="text-[9.5px] text-muted mt-2">Tu equipo marcado en verde · datos orientativos Grup 6</div>
          </div>
        )
      })()}

      {/* ---------- PREPARACIÓN ---------- */}
      {tab === 'prep' && (
        <div className="space-y-3">
          {/* Si venimos de PRÓXIMAS y el rival no tiene notas todavía, mostramos su card con CTA */}
          {prepFocus && !notas[prepFocus]?.trim() && (() => {
            const eq = TABLA.find(t => t.nom === prepFocus)
            return (
              <div className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{eq?.ico || '🛡️'}</span>
                  <div>
                    <div className="font-extrabold text-blanco text-sm">{prepFocus}</div>
                    {eq && <div className="text-[10px] text-muted">{eq.pos}º · {eq.pts} pts · {eq.pg}V {eq.pe}E {eq.pp}D</div>}
                  </div>
                </div>
                <p className="text-xs text-muted">Aún no tienes notas sobre este rival. Añádelas para activar el análisis IA.</p>
                <button className="btn btn-primary w-full text-xs"
                  onClick={() => { if (eq) setSel(eq); setNotasModal(true) }}>
                  ✏ Añadir notas sobre {prepFocus.split(' ')[0]}
                </button>
              </div>
            )
          })()}
          {Object.keys(notas).filter(k => notas[k]?.trim()).length === 0 && !prepFocus ? (
            <div className="card p-8 text-center space-y-2">
              <div className="text-3xl">📋</div>
              <div className="font-bold text-blanco">Sin partidos preparados</div>
              <p className="text-sm text-muted">Ve a <b className="text-cyan">Vista general</b>, selecciona un rival y añade notas sobre él.</p>
            </div>
          ) : (
            Object.entries(notas).filter(([,v]) => v?.trim()).map(([rival, nota]) => {
              const tips = analizarNotas(nota)
              const equipoInfo = TABLA.find(t => t.nom === rival)
              return (
                <div key={rival} className="card p-4 space-y-3">
                  {/* Cabecera rival */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{equipoInfo?.ico || '🛡️'}</span>
                      <div>
                        <div className="font-extrabold text-blanco text-sm">{rival}</div>
                        {equipoInfo && <div className="text-[10px] text-muted">{equipoInfo.pos}º · {equipoInfo.pts} pts · {equipoInfo.pg}V {equipoInfo.pe}E {equipoInfo.pp}D</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-[10px] text-cyan border border-cyan/30 rounded-lg px-2.5 py-1 hover:bg-cyan/10 transition"
                        onClick={() => { setSel(equipoInfo || sel); setNotasModal(true) }}>
                        ✏ Editar
                      </button>
                      <button
                        className="text-[10px] rounded-lg px-2.5 py-1 transition"
                        style={{ color:'#f87171', border:'1px solid rgba(239,68,68,0.25)' }}
                        onClick={async () => {
                          if (!confirm(`¿Eliminar toda la preparación de ${rival}?`)) return
                          const n = { ...notas }
                          delete n[rival]
                          setNotas(n)
                          await saveNotasRivales(n)
                        }}>
                        🗑 Borrar
                      </button>
                    </div>
                  </div>

                  {/* Notas del entrenador */}
                  <div>
                    <div className="text-[9px] font-black tracking-widest uppercase text-muted mb-1.5">Mis notas</div>
                    <div className="rounded-lg p-3 text-[12px] leading-relaxed whitespace-pre-wrap"
                      style={{background:'rgba(45,212,191,0.05)',border:'1px solid rgba(45,212,191,0.15)',color:'#d4d4d8'}}>
                      {nota}
                    </div>
                  </div>

                  {/* Análisis IA */}
                  {tips && (
                    <div>
                      <div className="text-[9px] font-black tracking-widest uppercase mb-2 flex items-center gap-1.5"
                        style={{color:'#a78bfa'}}>
                        🤖 Análisis IA
                      </div>
                      <div className="space-y-2">
                        {tips.map((tip, i) => (
                          <div key={i} className="flex gap-2.5 items-start rounded-lg p-2.5"
                            style={{background:`${tip.col}0d`,border:`1px solid ${tip.col}25`}}>
                            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{tip.ico}</span>
                            <div>
                              <div className="text-[11px] font-bold" style={{color:tip.col}}>{tip.t}</div>
                              <div className="text-[10px] text-muted mt-0.5 leading-snug">{tip.d}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Armar pizarra */}
                  <button
                    className="btn btn-outline w-full text-xs mt-1"
                    onClick={() => nav('/pizarra', { state: { rivalNom: rival } })}>
                    🎨 Armar pizarra vs {rival.split(' ')[0]}
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ---------- JUGADOS ---------- */}
      {tab === 'jugados' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[14px] font-extrabold text-blanco">Partidos jugados</div>
              <div className="text-[11px] text-muted">
                {liga.calendario_jugado.length
                  ? `${liga.calendario_jugado.length} resultados · clasificación actualizada automáticamente`
                  : 'Aún no hay resultados registrados'}
              </div>
            </div>
            <button className="btn btn-primary text-xs" onClick={() => setResultModal('nuevo')}>
              + Registrar resultado
            </button>
          </div>

          {liga.calendario_jugado.length > 0 && (
            <div className="riv2-tabla-wrap">
              <table className="riv2-tabla">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>J</th>
                    <th style={{ width: 64 }}>Fecha</th>
                    <th>Local</th>
                    <th style={{ width: 56, textAlign:'center' }}>Resultado</th>
                    <th>Visitante</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {liga.calendario_jugado.map((c, i) => (
                    <tr key={i}>
                      <td className="pos-num">{c.jornada || i + 1}</td>
                      <td style={{ color:'#71717a', fontSize:11 }}>{c.fecha || '—'}</td>
                      <td className="equipo-nombre">{c.local}</td>
                      <td style={{ textAlign:'center', fontWeight:700, color:'#fafafa' }}>
                        {c.golesLocal} – {c.golesVisitante}
                      </td>
                      <td className="equipo-nombre">{c.visitante}</td>
                      <td>
                        <button className="text-[11px] text-muted hover:text-red-400 transition" onClick={() => eliminarJugado(i)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Import CSV */}
          <div className="card p-4 space-y-3">
            <div className="text-sm font-extrabold">📥 Importar resultados (CSV)</div>
            <div className="rounded-lg p-3 text-[11px] leading-relaxed space-y-1"
              style={{ background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.15)' }}>
              <div className="font-bold text-cyan mb-1">Formato — una fila por partido:</div>
              <div className="font-mono text-cyan">jornada, fecha, local, resultado, visitante</div>
              <div className="text-muted">Ejemplo: <span className="font-mono text-blanco">J1, 15/09, Vilassar, 2-1, Cabrils CE</span></div>
              <div className="text-muted">O: <span className="font-mono text-blanco">J1, 15/09, Vilassar, 2, 1, Cabrils CE</span></div>
            </div>
            <textarea
              className="field font-mono text-xs h-28"
              placeholder={"J1, 15/09, Vilassar, 2-1, Cabrils CE\nJ2, 22/09, Cabrils CE, 1-1, Arenys"}
              value={jugTxt}
              onChange={(e) => { setJugTxt(e.target.value); setJugPrev(e.target.value.trim() ? parseJugados(e.target.value) : []) }}
            />
            {jugPrev.length > 0 && (
              <div className="text-[11px] font-bold text-cyan">{jugPrev.length} resultados detectados</div>
            )}
            {jugMsg && (
              <div className="text-[11px]" style={{ color: jugMsg.startsWith('⚠') ? '#ef4444' : '#34d399' }}>{jugMsg}</div>
            )}
            <div className="flex gap-2">
              {jugTxt && <button className="btn btn-outline flex-1 text-xs" onClick={() => { setJugTxt(''); setJugPrev([]); setJugMsg('') }}>Limpiar</button>}
              <button className="btn btn-primary flex-1 text-xs" onClick={importarJugados} disabled={!jugPrev.length || jugGuardando}>
                {jugGuardando ? 'Importando…' : `💾 Añadir ${jugPrev.length || ''} resultados`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- PRÓXIMAS ---------- */}
      {tab === 'proximas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[14px] font-extrabold text-blanco">Próximas fechas</div>
              <div className="text-[11px] text-muted">
                {liga.proximas_fechas.length ? `${liga.proximas_fechas.length} partidos programados` : 'Sin partidos cargados aún'}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex rounded-lg overflow-hidden border border-borde">
                <button className={`px-2.5 py-1.5 text-[11px] font-bold transition ${!proxCalView ? 'bg-cyan/15 text-cyan' : 'text-muted hover:text-blanco'}`}
                  onClick={() => setProxCalView(false)}>☰ Lista</button>
                <button className={`px-2.5 py-1.5 text-[11px] font-bold transition ${proxCalView ? 'bg-cyan/15 text-cyan' : 'text-muted hover:text-blanco'}`}
                  onClick={() => setProxCalView(true)}>📅 Mes</button>
              </div>
              <button className="btn btn-outline text-xs" onClick={() => setProxAddOpen(o => !o)}>
                {proxAddOpen ? '✕ Cerrar' : '＋ Añadir'}
              </button>
            </div>
          </div>

          {/* Vista calendario mensual */}
          {proxCalView && (
            <CalendarioMes
              partidos={liga.proximas_fechas}
              onEliminar={eliminarProxima}
              tabla={TABLA}
              clubNombre={clubNombre}
              nuestrosPartidos={nuestrosPartidos}
            />
          )}

          {/* Hero card — próximo partido (vista lista) */}
          {!proxCalView && liga.proximas_fechas.length > 0 && (() => {
            const next = liga.proximas_fechas[0]
            const resto = liga.proximas_fechas.slice(1)
            return (
              <>
                {/* PRÓXIMO */}
                <div style={{
                  background: 'linear-gradient(135deg, #16213e 0%, #202028 60%, #1a2235 100%)',
                  border: '1px solid rgba(45,212,191,0.25)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {/* barra top */}
                  <div style={{ height: 3, background: 'linear-gradient(90deg,#2dd4bf,#3b82f6)', width: '100%' }} />
                  <div style={{ padding: '14px 16px 16px' }}>
                    {/* meta */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black tracking-widest uppercase" style={{ color:'#2dd4bf' }}>
                        ⚡ Próximo partido
                      </span>
                      <div className="flex items-center gap-2">
                        {next.jornada && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background:'rgba(45,212,191,0.12)', color:'#2dd4bf' }}>J{next.jornada}</span>}
                        <button className="text-[11px] text-muted hover:text-red-400 transition" onClick={() => eliminarProxima(0)}>✕</button>
                      </div>
                    </div>

                    {/* equipos */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 text-center">
                        <div style={{ fontSize:28, lineHeight:1, marginBottom:6 }}>🛡️</div>
                        <div className="text-[13px] font-extrabold text-blanco leading-tight">{next.local}</div>
                        <div className="text-[10px] text-muted mt-0.5">Local</div>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <div className="text-[11px] font-black tracking-widest text-muted mb-1">VS</div>
                        {next.hora && <div className="text-[12px] font-black" style={{ color:'#f59e0b' }}>{next.hora}</div>}
                        {next.fecha && <div className="text-[10px] text-muted mt-0.5">{next.fecha}</div>}
                      </div>
                      <div className="flex-1 text-center">
                        <div style={{ fontSize:28, lineHeight:1, marginBottom:6 }}>⚔️</div>
                        <div className="text-[13px] font-extrabold text-blanco leading-tight">{next.visitante}</div>
                        <div className="text-[10px] text-muted mt-0.5">Visitante</div>
                      </div>
                    </div>

                    {/* acciones */}
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 text-[11px] py-2 rounded-lg font-bold transition"
                        style={{ background:'rgba(45,212,191,0.12)', color:'#2dd4bf', border:'1px solid rgba(45,212,191,0.25)' }}
                        onClick={() => {
                          const rivalNom = clubNombre && next.local?.toLowerCase().includes(clubNombre.toLowerCase().split(' ')[0]) ? next.visitante : next.local
                          const eq = TABLA.find(t => t.nom === rivalNom) || TABLA.find(t => t.nom === next.visitante || t.nom === next.local) || sel
                          setSel(eq); setPrepFocus(rivalNom || eq?.nom); setTab('prep')
                        }}>
                        📋 Preparar partido
                      </button>
                      <button className="flex-1 text-[11px] py-2 rounded-lg font-bold transition"
                        style={{ background:'rgba(59,130,246,0.12)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.25)' }}
                        onClick={() => moverAJugado(next)}>
                        ⚽ Registrar resultado
                      </button>
                    </div>
                  </div>
                </div>

                {/* RESTO del fixture */}
                {resto.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black tracking-widest uppercase text-muted px-1 mt-2">Calendario</div>
                    {resto.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition"
                        style={{ background:'#202028', border:'1px solid #2e2e38' }}>
                        {c.jornada && (
                          <span className="text-[10px] font-black w-7 text-center flex-shrink-0" style={{ color:'#52525b' }}>J{c.jornada}</span>
                        )}
                        <div className="text-[11px] text-muted w-12 flex-shrink-0">{c.fecha || '—'}</div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-blanco text-[12px]">{c.local}</span>
                          <span className="text-muted mx-1.5 text-[10px]">vs</span>
                          <span className="font-bold text-blanco text-[12px]">{c.visitante}</span>
                        </div>
                        {c.hora && <div className="text-[10px] font-bold flex-shrink-0" style={{ color:'#f59e0b' }}>{c.hora}</div>}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button className="text-[10px] px-2 py-0.5 rounded border transition"
                            style={{ borderColor:'rgba(45,212,191,0.3)', color:'#2dd4bf' }}
                            onClick={() => moverAJugado(c)}>⚽</button>
                          <button className="text-[11px] text-muted hover:text-red-400 transition" onClick={() => eliminarProxima(i + 1)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}

          {/* Sin datos (solo en lista) */}
          {!proxCalView && liga.proximas_fechas.length === 0 && !proxAddOpen && (
            <div className="card p-8 text-center space-y-2">
              <div className="text-3xl">📅</div>
              <div className="font-bold text-blanco">Sin partidos programados</div>
              <p className="text-sm text-muted">Añade el fixture de la próxima jornada manualmente o importa desde CSV.</p>
              <button className="btn btn-primary text-xs mx-auto" onClick={() => setProxAddOpen(true)}>＋ Añadir partido</button>
            </div>
          )}

          {/* Panel añadir / importar */}
          {proxAddOpen && (
            <div className="space-y-3">
              <div className="card p-4 space-y-3">
                <div className="text-sm font-extrabold">➕ Añadir partido manualmente</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Jornada</label>
                    <input className="field text-xs" placeholder="J8" value={proxManual.jornada}
                      onChange={e => setProxManual(p => ({ ...p, jornada: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Fecha</label>
                    <input className="field text-xs" placeholder="03/11" value={proxManual.fecha}
                      onChange={e => setProxManual(p => ({ ...p, fecha: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Local *</label>
                    <input className="field text-xs" placeholder="Mi equipo" value={proxManual.local}
                      onChange={e => setProxManual(p => ({ ...p, local: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Visitante *</label>
                    <input className="field text-xs" placeholder="Rival FC" value={proxManual.visitante}
                      onChange={e => setProxManual(p => ({ ...p, visitante: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Hora</label>
                    <input className="field text-xs" placeholder="11:00" value={proxManual.hora}
                      onChange={e => setProxManual(p => ({ ...p, hora: e.target.value }))} />
                  </div>
                </div>
                {proxMsg && !proxTxt && (
                  <div className="text-[11px]" style={{ color: proxMsg.startsWith('⚠') ? '#ef4444' : '#34d399' }}>{proxMsg}</div>
                )}
                <button className="btn btn-primary w-full text-xs" onClick={guardarProxiManual} disabled={proxGuardando}>
                  {proxGuardando ? 'Guardando…' : '💾 Añadir partido'}
                </button>
              </div>

              <div className="card p-4 space-y-3">
                <div className="text-sm font-extrabold">📥 Importar desde CSV</div>
                <div className="rounded-lg p-3 text-[11px] leading-relaxed"
                  style={{ background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.15)' }}>
                  <div className="font-mono text-cyan">jornada, fecha, local, visitante, hora</div>
                  <div className="text-muted mt-1">Ej: <span className="font-mono text-blanco">J8, 03/11, Cabrils CE, Arenys, 11:00</span></div>
                </div>
                <textarea
                  className="field font-mono text-xs h-24"
                  placeholder={"J8, 03/11, Cabrils CE, Arenys, 11:00\nJ9, 10/11, Rival FC, Cabrils CE, 17:00"}
                  value={proxTxt}
                  onChange={e => { setProxTxt(e.target.value); setProxPrev(e.target.value.trim() ? parseProximas(e.target.value) : []) }}
                />
                {proxPrev.length > 0 && <div className="text-[11px] font-bold text-cyan">{proxPrev.length} partidos detectados</div>}
                {proxMsg && proxTxt && (
                  <div className="text-[11px]" style={{ color: proxMsg.startsWith('⚠') ? '#ef4444' : '#34d399' }}>{proxMsg}</div>
                )}
                <div className="flex gap-2">
                  {proxTxt && <button className="btn btn-outline flex-1 text-xs" onClick={() => { setProxTxt(''); setProxPrev([]); setProxMsg('') }}>Limpiar</button>}
                  <button className="btn btn-primary flex-1 text-xs" onClick={importarProximas} disabled={!proxPrev.length || proxGuardando}>
                    {proxGuardando ? 'Importando…' : `💾 Añadir ${proxPrev.length || ''} partidos`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Modal registrar resultado */}
      {resultModal && (
        <ResultadoModal
          inicial={resultModal === 'nuevo' ? null : resultModal}
          onGuardar={guardarResultado}
          onCerrar={() => setResultModal(null)}
          guardando={jugGuardando}
        />
      )}
    </div>
  )
}

/* ══ Calendario mensual ══════════════════════════════════════ */
function parseFecha(str) {
  if (!str) return null
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/)
  if (!m) return null
  const day = parseInt(m[1], 10)
  const mon = parseInt(m[2], 10) - 1
  const yr = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])) : new Date().getFullYear()
  const d = new Date(yr, mon, day)
  return isNaN(d.getTime()) ? null : d
}

function CalendarioMes({ partidos, onEliminar, tabla = [], clubNombre = '', nuestrosPartidos = [] }) {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [sel, setSel] = useState(null)

  const porDia = {}
  partidos.forEach((p, idx) => {
    const d = parseFecha(p.fecha)
    if (d && d.getMonth() === mes && d.getFullYear() === anio) {
      const key = d.getDate()
      if (!porDia[key]) porDia[key] = []
      porDia[key].push({ ...p, _idx: idx })
    }
  })

  const primerDia = new Date(anio, mes, 1).getDay()
  const diasMes = new Date(anio, mes + 1, 0).getDate()
  const celdas = primerDia === 0 ? 6 : primerDia - 1

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  function prev() { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1); setSel(null) }
  function next() { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1); setSel(null) }

  // Busca el último partido jugado contra un rival en nuestrosPartidos (Informes)
  function ultimoVsRival(rivalNom) {
    if (!rivalNom || !nuestrosPartidos.length) return null
    const key = rivalNom.trim().toLowerCase().split(/\s+/)[0]
    const matches = nuestrosPartidos.filter(p => (p.rival || '').toLowerCase().includes(key))
    if (!matches.length) return null
    return matches.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
  }

  // Busca escudo/ico del equipo en la tabla
  function icoEquipo(nom) {
    if (!nom) return '🛡️'
    const key = nom.trim().toLowerCase().split(/\s+/)[0]
    const eq = tabla.find(t => t.nom.toLowerCase().includes(key))
    return eq?.ico || '🛡️'
  }

  const selPartidos = sel ? (porDia[sel] || []) : []

  return (
    <div className="space-y-3">
      {/* Cabecera mes */}
      <div className="flex items-center justify-between px-1">
        <button className="w-8 h-8 rounded-lg border border-borde text-muted hover:text-blanco hover:border-cyan transition text-sm font-bold" onClick={prev}>‹</button>
        <div className="text-sm font-extrabold">{MESES[mes]} {anio}</div>
        <button className="w-8 h-8 rounded-lg border border-borde text-muted hover:text-blanco hover:border-cyan transition text-sm font-bold" onClick={next}>›</button>
      </div>

      {/* Grid */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
        <div className="grid grid-cols-7 mb-1">
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} className="text-center text-[10px] font-extrabold text-muted py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: celdas }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: diasMes }).map((_, i) => {
            const dia = i + 1
            const tienePartido = !!porDia[dia]
            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
            const esSel = sel === dia
            return (
              <button
                key={dia}
                onClick={() => setSel(esSel ? null : dia)}
                className="relative flex flex-col items-center justify-center transition"
                style={{
                  height: 42,
                  borderRadius: 8,
                  background: esSel ? 'rgba(45,212,191,0.18)' : tienePartido ? 'rgba(45,212,191,0.06)' : 'transparent',
                  border: esSel ? '1px solid rgba(45,212,191,0.5)' : esHoy ? '1px solid rgba(45,212,191,0.3)' : '1px solid transparent',
                }}
              >
                <span className="text-[12px] font-bold leading-none"
                  style={{ color: esHoy ? '#2dd4bf' : tienePartido ? '#fafafa' : '#52525b' }}>
                  {dia}
                </span>
                {tienePartido && (
                  <span style={{ fontSize: 10, lineHeight: 1, marginTop: 2 }}>⚽</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle día */}
      {sel && (
        <div className="space-y-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-muted px-1">
            {sel} de {MESES[mes]} · {selPartidos.length} partido{selPartidos.length !== 1 ? 's' : ''}
          </div>
          {selPartidos.length === 0 ? (
            <div className="text-[12px] text-muted px-1">Sin partidos este día.</div>
          ) : selPartidos.map((p, k) => {
            const rivalNom = p.local?.toLowerCase().includes(clubNombre.toLowerCase().split(' ')[0]) ? p.visitante : p.local
            const ultimo = ultimoVsRival(rivalNom)
            const icoLocal = icoEquipo(p.local)
            const icoVisitante = icoEquipo(p.visitante)
            const esLocal = p.local?.toLowerCase().includes((clubNombre || '').toLowerCase().split(' ')[0])
            let resUltimo = null
            if (ultimo) {
              const gl = ultimo.goles_favor ?? ultimo.gf ?? '?'
              const gc = ultimo.goles_contra ?? ultimo.gc ?? '?'
              resUltimo = `${gl} – ${gc}`
            }
            return (
              <div key={k} style={{ background: 'linear-gradient(135deg,#16213e,#1a1a22)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 14, overflow: 'hidden' }}>
                {/* Barra top */}
                <div style={{ height: 3, background: 'linear-gradient(90deg,#2dd4bf,#3b82f6)' }} />
                <div style={{ padding: '12px 14px 14px' }}>
                  {/* Jornada + hora + eliminar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {p.jornada && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                          style={{ background: 'rgba(45,212,191,0.12)', color: '#2dd4bf' }}>
                          J{p.jornada}
                        </span>
                      )}
                      {p.hora && (
                        <span className="text-[11px] font-black" style={{ color: '#f59e0b' }}>⏰ {p.hora}</span>
                      )}
                      <span className="text-[10px] text-muted">{p.fecha}</span>
                    </div>
                    <button className="text-muted hover:text-red-400 text-xs transition" onClick={() => onEliminar(p._idx)}>✕</button>
                  </div>

                  {/* Escudos + equipos */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-center">
                      <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 6 }}>{icoLocal}</div>
                      <div className="text-[12px] font-extrabold leading-tight" style={{ color: esLocal ? '#2dd4bf' : '#fafafa' }}>
                        {p.local}
                      </div>
                      <div className="text-[9px] text-muted mt-0.5 uppercase tracking-wide">Local</div>
                    </div>
                    <div className="text-center flex-shrink-0 px-2">
                      <div className="text-[10px] font-black tracking-widest text-muted">VS</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 6 }}>{icoVisitante}</div>
                      <div className="text-[12px] font-extrabold leading-tight text-blanco">{p.visitante}</div>
                      <div className="text-[9px] text-muted mt-0.5 uppercase tracking-wide">Visitante</div>
                    </div>
                  </div>

                  {/* Último enfrentamiento */}
                  {ultimo ? (
                    <div className="mt-3 rounded-lg px-3 py-2 flex items-center gap-2"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #27272a' }}>
                      <span className="text-[10px] text-muted flex-shrink-0">Último vs {rivalNom?.split(' ')[0] || 'ellos'}:</span>
                      <span className="text-[11px] font-black text-blanco mx-1">{resUltimo}</span>
                      {ultimo.fecha && <span className="text-[9px] text-muted">· {ultimo.fecha}</span>}
                      {ultimo.local !== undefined && (
                        <span className="text-[9px] ml-auto" style={{
                          color: ultimo.resultado === 'victoria' ? '#34d399' : ultimo.resultado === 'derrota' ? '#f87171' : '#f59e0b'
                        }}>
                          {ultimo.resultado === 'victoria' ? '✓ Victoria' : ultimo.resultado === 'derrota' ? '✗ Derrota' : '= Empate'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg px-3 py-2 text-[10px] text-muted text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #27272a' }}>
                      Sin historial previo contra {rivalNom?.split(' ')[0] || 'este rival'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-[10px] text-muted px-1">
        <span className="flex items-center gap-1">⚽ Partido programado</span>
        <span className="flex items-center gap-1.5">
          <span style={{ width:8,height:8,borderRadius:3,border:'1px solid rgba(45,212,191,0.4)',display:'inline-block' }}/>
          Hoy
        </span>
      </div>
    </div>
  )
}

/* ══ Modal registrar resultado ══════════════════════════════ */
function ResultadoModal({ inicial, onGuardar, onCerrar, guardando }) {
  const [form, setForm] = useState({
    jornada: inicial?.jornada || '',
    fecha: inicial?.fecha || '',
    local: inicial?.local || '',
    visitante: inicial?.visitante || '',
    golesLocal: '',
    golesVisitante: '',
  })
  const [err, setErr] = useState('')

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  function submit() {
    if (!form.local || !form.visitante) { setErr('Local y visitante son obligatorios.'); return }
    if (form.golesLocal === '' || form.golesVisitante === '') { setErr('Indica el resultado.'); return }
    onGuardar({
      jornada: form.jornada,
      fecha: form.fecha,
      local: form.local,
      visitante: form.visitante,
      golesLocal: parseInt(form.golesLocal, 10),
      golesVisitante: parseInt(form.golesVisitante, 10),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCerrar}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background:'#18181b', border:'1px solid #27272a' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde">
          <div className="text-sm font-extrabold">⚽ Registrar resultado</div>
          <button className="text-muted hover:text-white text-xl leading-none" onClick={onCerrar}>✕</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Jornada</label>
              <input className="field text-xs" placeholder="J8" value={form.jornada}
                onChange={e => setForm(f => ({ ...f, jornada: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Fecha</label>
              <input className="field text-xs" placeholder="03/11" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Equipo local *</label>
            <input className="field text-sm" placeholder="Mi equipo" value={form.local}
              onChange={e => setForm(f => ({ ...f, local: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Equipo visitante *</label>
            <input className="field text-sm" placeholder="Rival FC" value={form.visitante}
              onChange={e => setForm(f => ({ ...f, visitante: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Goles local *</label>
              <input className="field text-center text-xl font-black" type="number" min="0" max="30"
                placeholder="0" value={form.golesLocal}
                onChange={e => setForm(f => ({ ...f, golesLocal: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">Goles visitante *</label>
              <input className="field text-center text-xl font-black" type="number" min="0" max="30"
                placeholder="0" value={form.golesVisitante}
                onChange={e => setForm(f => ({ ...f, golesVisitante: e.target.value }))} />
            </div>
          </div>
          {err && <div className="text-[11px] text-red-400">{err}</div>}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button className="btn btn-outline flex-1" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primary flex-1" onClick={submit} disabled={guardando}>
            {guardando ? 'Guardando…' : '💾 Guardar resultado'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ Modal bloc de notas ════════════════════════════════════ */
function NotasModal({ rival, texto, proximoPartido, onGuardar, onCerrar }) {
  const [draft, setDraft] = useState(texto)

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCerrar}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#18181b', border: '1px solid #27272a', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde">
          <div>
            <div className="text-sm font-extrabold">📋 {rival.ico} {rival.nom}</div>
            <div className="text-[11px] text-muted mt-0.5">Notas del entrenador · se mostrarán antes del partido</div>
          </div>
          <button className="text-muted hover:text-white text-xl leading-none" onClick={onCerrar}>✕</button>
        </div>

        {/* Próximo partido si existe */}
        {proximoPartido && (
          <div className="mx-5 mt-4 px-3 py-2 rounded-lg text-[11px]"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <span className="text-cyan font-bold">📅 Próximo partido:</span>
            <span className="text-muted ml-2">{proximoPartido.fecha && `${proximoPartido.fecha} · `}{proximoPartido.local} vs {proximoPartido.visitante}</span>
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="text-[10px] text-muted uppercase tracking-wide mb-2 font-semibold">Mis notas</div>
          <textarea
            autoFocus
            className="w-full rounded-lg p-3 text-sm leading-relaxed resize-none"
            style={{ background: '#0f0f11', border: '1px solid #27272a', color: '#fafafa', minHeight: 220, outline: 'none' }}
            placeholder={`Apunta todo lo que sepas de ${rival.nom.split(' ')[0]}:

• Sistema táctico (ej: 4-3-3 presión alta)
• Jugadores peligrosos y a quién marcar
• Cómo atacan y cómo defienden
• Debilidades a explotar
• Historial de enfrentamientos
• Árbitro, campo, condiciones…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          {draft && (
            <div className="text-[10px] text-muted mt-1 text-right">{draft.length} caracteres</div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 px-5 pb-5">
          <button className="btn btn-outline flex-1" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primary flex-1" onClick={() => onGuardar(draft)}>
            💾 Guardar notas
          </button>
        </div>
      </div>
    </div>
  )
}
