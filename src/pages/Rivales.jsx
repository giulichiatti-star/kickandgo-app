import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../rivinf.css'
import { getCompeticion, guardarCompeticion, resolverLiga, calcularTabla, parseJugados, parseProximas, parseCalendario } from '../lib/competicion'
import { supabase } from '../lib/supabase'

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
  const [tab, setTab] = useState('general')
  const [liga, setLiga] = useState(() => resolverLiga(null))
  const [sel, setSel] = useState(null)
  const [golFiltro, setGolFiltro] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const [notas, setNotas] = useState({})
  const [notasModal, setNotasModal] = useState(false)
  const [compRaw, setCompRaw] = useState(null) // competicion original de Supabase
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

  useEffect(() => {
    (async () => {
      const [comp, n] = await Promise.all([
        getCompeticion(),
        getNotasRivales(),
      ])
      const l = resolverLiga(comp)
      setCompRaw(comp)
      setLiga(l)
      if (l.tabla.length) setSel(l.tabla.find((t) => t.miEquipo) || l.tabla[0])
      setNotas(n)
    })()
  }, [])

  function analizarCal(txt) {
    setCalTxt(txt)
    setCalPrev(txt.trim() ? parseCalendario(txt) : [])
  }

  async function guardarCalendario() {
    if (!calPrev.length) { setCalMsg('Pega partidos primero.'); return }
    setCalGuardando(true); setCalMsg('')
    try {
      const nuevo = { ...(compRaw || {}), calendario: calPrev }
      await guardarCompeticion(nuevo)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo))
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
      await guardarCompeticion(nuevo)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo))
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
      await guardarCompeticion(nuevo)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo))
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
    await guardarCompeticion(nuevo)
    setCompRaw(nuevo)
    setLiga(resolverLiga(nuevo))
  }

  async function importarJugados() {
    if (!jugPrev.length) { setJugMsg('Pega resultados primero.'); return }
    setJugGuardando(true); setJugMsg('')
    try {
      const jugados = [...(compRaw?.calendario_jugado || []), ...jugPrev]
      const nuevaTabla = calcularTabla(jugados)
      const nuevo = { ...(compRaw || {}), calendario_jugado: jugados, tabla: nuevaTabla }
      await guardarCompeticion(nuevo)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo))
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
      await guardarCompeticion(nuevo)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo))
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
      await guardarCompeticion(nuevo)
      setCompRaw(nuevo)
      setLiga(resolverLiga(nuevo))
      setProxTxt(''); setProxPrev([])
      setProxMsg(`✅ ${proxPrev.length} partidos añadidos.`)
    } catch (e) { setProxMsg('⚠️ ' + e.message) }
    finally { setProxGuardando(false) }
  }

  async function eliminarProxima(idx) {
    const proximas = (compRaw?.proximas_fechas || []).filter((_, i) => i !== idx)
    const nuevo = { ...(compRaw || {}), proximas_fechas: proximas }
    await guardarCompeticion(nuevo)
    setCompRaw(nuevo)
    setLiga(resolverLiga(nuevo))
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
          {Object.keys(notas).filter(k => notas[k]?.trim()).length === 0 ? (
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
                    <button className="text-[10px] text-cyan border border-cyan/30 rounded-lg px-2.5 py-1 hover:bg-cyan/10 transition"
                      onClick={() => { setSel(equipoInfo || sel); setNotasModal(true) }}>
                      ✏ Editar
                    </button>
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
          <div>
            <div className="text-[14px] font-extrabold text-blanco">Próximas fechas</div>
            <div className="text-[11px] text-muted">
              {liga.proximas_fechas.length ? `${liga.proximas_fechas.length} partidos programados` : 'Sin partidos programados'}
            </div>
          </div>

          {liga.proximas_fechas.length > 0 && (
            <div className="riv2-tabla-wrap">
              <table className="riv2-tabla">
                <thead>
                  <tr>
                    <th style={{ width:28 }}>J</th>
                    <th style={{ width:64 }}>Fecha</th>
                    <th>Local</th>
                    <th style={{ width:40, textAlign:'center' }}>Hora</th>
                    <th>Visitante</th>
                    <th style={{ width:90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {liga.proximas_fechas.map((c, i) => (
                    <tr key={i}>
                      <td className="pos-num">{c.jornada || i + 1}</td>
                      <td style={{ color:'#71717a', fontSize:11 }}>{c.fecha || '—'}</td>
                      <td className="equipo-nombre">{c.local}</td>
                      <td style={{ textAlign:'center', color:'#71717a', fontSize:11 }}>{c.hora || '—'}</td>
                      <td className="equipo-nombre">{c.visitante}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            className="text-[10px] px-2 py-0.5 rounded border transition"
                            style={{ borderColor:'rgba(45,212,191,0.4)', color:'#2dd4bf' }}
                            onClick={() => moverAJugado(c)}
                          >✏ Resultado</button>
                          <button className="text-[11px] text-muted hover:text-red-400 transition" onClick={() => eliminarProxima(i)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Añadir manual */}
          <div className="card p-4 space-y-3">
            <div className="text-sm font-extrabold">➕ Añadir partido</div>
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

          {/* Import CSV */}
          <div className="card p-4 space-y-3">
            <div className="text-sm font-extrabold">📥 Importar desde CSV</div>
            <div className="rounded-lg p-3 text-[11px] leading-relaxed"
              style={{ background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.15)' }}>
              <div className="font-mono text-cyan">jornada, fecha, local, visitante, hora</div>
              <div className="text-muted mt-1">Ejemplo: <span className="font-mono text-blanco">J8, 03/11, Cabrils CE, Arenys, 11:00</span></div>
            </div>
            <textarea
              className="field font-mono text-xs h-24"
              placeholder={"J8, 03/11, Cabrils CE, Arenys, 11:00\nJ9, 10/11, Rival FC, Cabrils CE, 17:00"}
              value={proxTxt}
              onChange={e => { setProxTxt(e.target.value); setProxPrev(e.target.value.trim() ? parseProximas(e.target.value) : []) }}
            />
            {proxPrev.length > 0 && (
              <div className="text-[11px] font-bold text-cyan">{proxPrev.length} partidos detectados</div>
            )}
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
