import { useEffect, useMemo, useState } from 'react'
import {
  listarJugadores, crearJugador, actualizarJugador, eliminarJugador, posACat, crearJugadoresBulk,
} from '../lib/jugadores'
import { parseImport } from '../lib/importar'
import { getPerfil, updatePerfil } from '../lib/perfil'
import { listarPartidos } from '../lib/partidos'
import { listarTarjetas } from '../lib/tarjetas'
import { listarEntrenos } from '../lib/entrenamientos'
import { useEquipo } from '../contexts/EquipoContext'
import '../equipo.css'

const POSICIONES = [
  'Portero', 'Lateral derecho', 'Central', 'Lateral izquierdo',
  'Mediocampista', 'Mediapunta', 'Extremo', 'Delantero centro',
]
const vacio = { nombre: '', dorsal: '', posicion: 'Mediocampista', pie: 'Derecho', nacimiento: '', foto_url: '', peso_kg: '', altura_cm: '' }
const FILTROS = [['Todos', 'ALL'], ['Porteros', 'POR'], ['Defensas', 'DEF'], ['Medios', 'MED'], ['Delanteros', 'DEL']]

// clase de forma según rating
function formaClase(r) {
  if (r === null) return 'les'
  if (r >= 8) return 'alta'; if (r >= 7) return 'buena'; if (r >= 6.3) return 'media'; if (r >= 5.3) return 'baja'; return 'mala'
}

export default function Plantilla() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [jugadores, setJugadores] = useState([])
  const [perfil, setPerfil] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [entrenos, setEntrenos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tipo, setTipo] = useState('11')
  const [tab, setTab] = useState('plantilla')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('ALL')
  const [impOpen, setImpOpen] = useState(false)
  const [impText, setImpText] = useState('')
  const [impPrev, setImpPrev] = useState([])
  const [impMsg, setImpMsg] = useState('')
  const [calModal, setCalModal] = useState(false)
  const [temporada, setTemporada] = useState({ nombre: '', total_partidos: '' })

  async function refrescar(t = tipo) {
    setCargando(true)
    try {
      const [js, p, ps, tj, en] = await Promise.all([
        listarJugadores(eid), getPerfil().catch(() => null), listarPartidos(eid).catch(() => []),
        listarTarjetas(eid).catch(() => []), listarEntrenos(eid).catch(() => []),
      ])
      setJugadores(js); setPerfil(p); setPartidos(ps); setTarjetas(tj); setEntrenos(en)
      if (p?.temporada) setTemporada({ nombre: p.temporada.nombre || '', total_partidos: p.temporada.total_partidos || '' })
    } catch (e) { setError(e.message) } finally { setCargando(false) }
  }
  useEffect(() => {
    const t = equipoActivo?.tipo_equipo || '11'
    setTipo(t)
    refrescar(t)
  }, [eid])

  async function cambiarTipo(t) {
    setTipo(t)
    await refrescar(t)
  }

  const totalCal = parseInt(temporada.total_partidos) || partidos.length || 0

  // Stats reales por jugador
  const stats = useMemo(() => {
    const m = {}
    jugadores.forEach((j) => { m[j.id] = { goles: 0, asist: 0, amar: 0, rojas: 0, asis: 0, totEnt: 0, pjs: 0 } })
    const porDorsal = {}; jugadores.forEach((j) => { porDorsal[j.dorsal] = j.id })
    const porNombre = {}; jugadores.forEach((j) => { porNombre[j.nombre?.toLowerCase()] = j.id })
    partidos.forEach((p) => {
      const jugados = new Set()
      // 1. Valoraciones del entrenador → titulares confirmados
      Object.keys(p.valoraciones || {}).forEach((id) => { if (m[id]) jugados.add(id) })
      // 2. Eventos individuales (gol, asistencia, amarilla, roja, tiro → llevaba dorsal)
      ;(Array.isArray(p.notas) ? p.notas : []).forEach((ev) => {
        const tipo = ev.tipo || ''
        if (/gol(?!.*rival)/i.test(tipo)) {
          const md = (ev.jugador || '').match(/#(\d+)/); const id = md && porDorsal[+md[1]]
          if (id && m[id]) { m[id].goles++; jugados.add(id) }
        }
        if (/asist/i.test(tipo)) {
          const md = (ev.jugador || '').match(/#(\d+)/); const id = md && porDorsal[+md[1]]
          if (id && m[id]) { m[id].asist++; jugados.add(id) }
        }
        // Cambios: "Sale Nombre · Entra Nombre" → el que entra también jugó
        if (tipo === 'cambio') {
          const partes = (ev.jugador || '').split('·')
          partes.forEach((parte) => {
            const nom = parte.replace(/sale|entra/gi, '').trim().toLowerCase()
            const id = porNombre[nom]
            if (id && m[id]) jugados.add(id)
          })
        }
      })
      jugados.forEach((id) => { m[id].pjs++ })
    })
    tarjetas.forEach((t) => { if (m[t.jugador_id]) { if (t.tipo === 'roja') m[t.jugador_id].rojas++; else m[t.jugador_id].amar++ } })
    entrenos.forEach((e) => {
      const a = e.asistencia || {}
      jugadores.forEach((j) => { if (j.id in a) { m[j.id].totEnt++; if (a[j.id]) m[j.id].asis++ } })
    })
    // Media de valoraciones del entrenador por jugador (últimos 5 partidos)
    const valPorJug = {}
    partidos.slice(0, 5).forEach((p) => {
      const vals = p.valoraciones || {}
      Object.entries(vals).forEach(([id, nota]) => {
        if (nota != null) {
          if (!valPorJug[id]) valPorJug[id] = []
          valPorJug[id].push(nota)
        }
      })
    })

    const totEnt = entrenos.length
    Object.entries(m).forEach(([id, s]) => {
      s.pctEnt = totEnt ? Math.round(s.asis / totEnt * 100) : null
      s.pct = s.totEnt ? Math.round(s.asis / s.totEnt * 100) : null
      s.pjsPct = totalCal ? Math.round(s.pjs / totalCal * 100) : null
      const notas = valPorJug[id]
      if (notas?.length) {
        const media = notas.reduce((a, n) => a + n, 0) / notas.length
        s.rating = Math.round(media * 10) / 10
        s.ratingFuente = 'entrenador'
      } else {
        s.rating = Math.max(3, Math.min(9.9, 6.3 + s.goles * 0.3 + s.asist * 0.2 - s.rojas * 0.6))
        s.ratingFuente = 'auto'
      }
    })
    return m
  }, [jugadores, partidos, tarjetas, entrenos, totalCal])

  function abrirNuevo() { setEditId(null); setForm(vacio); setError(''); setModal(true) }
  function abrirEdit(j) {
    setEditId(j.id)
    setForm({ nombre: j.nombre, dorsal: j.dorsal, posicion: j.posicion, pie: j.pie || 'Derecho', nacimiento: j.nacimiento || '', foto_url: j.foto_url || '', peso_kg: j.peso_kg ?? '', altura_cm: j.altura_cm ?? '' })
    setError(''); setModal(true)
  }

  function subirFoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 600 * 1024) { setError('Foto muy grande (máx ~600KB)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, foto_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.dorsal) { setError('Nombre y dorsal son obligatorios'); return }
    const dorsal = parseInt(form.dorsal) || 0
    const nombre = form.nombre.trim().toLowerCase()
    const otros = jugadores.filter((j) => j.id !== editId)
    const dorsalDup = otros.find((j) => j.dorsal === dorsal)
    const nombreDup = otros.find((j) => j.nombre.trim().toLowerCase() === nombre)
    if (dorsalDup) { setError(`El dorsal #${dorsal} ya lo tiene ${dorsalDup.nombre}.`); return }
    if (nombreDup) { setError(`Ya existe un jugador llamado "${nombreDup.nombre}".`); return }
    const payload = {
      nombre: form.nombre.trim(),
      dorsal,
      posicion: form.posicion,
      pie: form.pie,
      nacimiento: form.nacimiento || null,
      foto_url: form.foto_url || '',
      peso_kg: form.peso_kg !== '' ? parseFloat(form.peso_kg) : null,
      altura_cm: form.altura_cm !== '' ? parseFloat(form.altura_cm) : null,
    }
    try {
      if (editId) await actualizarJugador(editId, payload)
      else await crearJugador({ ...payload, estado: 'activo', tipo_equipo: tipo }, eid)
      setModal(false)
      await refrescar()
    } catch (e) { setError(e.message) }
  }

  async function borrar(j) {
    if (!confirm(`¿Dar de baja a ${j.nombre}?`)) return
    await eliminarJugador(j.id)
    await refrescar()
  }

  function abrirImport() { setImpText(''); setImpPrev([]); setImpMsg(''); setImpOpen(true) }
  function analizar(t) {
    setImpText(t)
    setImpPrev(parseImport(t))
  }
  async function confirmarImport() {
    if (!impPrev.length) { setImpMsg('Pega una lista primero'); return }
    try {
      await crearJugadoresBulk(impPrev, eid, tipo)
      setImpOpen(false)
      await refrescar()
    } catch (e) { setImpMsg(e.message) }
  }

  function inicial(n) {
    const p = (n || '').trim().split(/\s+/)
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()
  }

  const disponibles = jugadores.filter((j) => !j.estado || j.estado === 'activo').length
  const lesionados = jugadores.filter((j) => j.estado === 'lesionado').length
  const sancionados = jugadores.filter((j) => j.estado === 'sancionado').length
  const club = equipoActivo?.nombre || perfil?.club_nombre || 'Mi club'
  const lista = jugadores
    .filter((j) => filtro === 'ALL' || posACat(j.posicion) === filtro)
    .sort((a, b) => (b.estado === 'lesionado' ? -1 : 0) - (a.estado === 'lesionado' ? -1 : 0) || (stats[b.id]?.rating || 0) - (stats[a.id]?.rating || 0))

  // máximos goleadores (tab estadísticas)
  const goleadores = [...jugadores].map((j) => ({ j, ...stats[j.id] })).sort((a, b) => b.goles - a.goles).filter((x) => x.goles > 0).slice(0, 5)

  return (
    <div>
      {/* HEADER club */}
      <div className="equipo-header">
        <div className="equipo-header-left">
          <div className="club-logo-eq">{perfil?.escudo_url ? <img src={perfil.escudo_url} alt="" /> : '🛡️'}</div>
          <div className="club-info-eq">
            <h2>{club}</h2>
            <span>Plantilla {new Date().getFullYear()}</span>
          </div>
          <div className="club-stats-eq">
            <div className="cs-item"><span className="cs-icon">👥</span><div><div className="cs-val">{jugadores.length}</div><div className="cs-lbl">Jugadores</div></div></div>
            <div className="cs-item verde"><span className="cs-icon">✅</span><div><div className="cs-val">{disponibles}</div><div className="cs-lbl">Disponibles</div></div></div>
            <div className="cs-item rojo"><span className="cs-icon">🩺</span><div><div className="cs-val">{lesionados}</div><div className="cs-lbl">Lesionados</div></div></div>
            <div className="cs-item"><span className="cs-icon" style={{ opacity: .5 }}>🚫</span><div><div className="cs-val" style={{ color: '#a1a1aa' }}>{sancionados}</div><div className="cs-lbl">Sancionados</div></div></div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button className="btn btn-outline text-xs" onClick={abrirImport}>📥 Importar</button>
          <button className="btn btn-primary text-xs" onClick={abrirNuevo}>+ Jugador</button>
        </div>
      </div>

      {/* Barra tipo + temporada */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[11px] text-muted">Plantilla:</span>
        {[['11', 'Fútbol 11'], ['9', 'Fútbol 9'], ['7', 'Fútbol 7']].map(([t, lbl]) => (
          <button key={t} onClick={() => cambiarTipo(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${tipo === t ? 'border-cyan bg-cyan/10 text-cyan font-semibold' : 'border-borde text-muted'}`}>
            {lbl}
          </button>
        ))}
        <button
          className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-borde text-muted hover:border-cyan hover:text-cyan transition"
          onClick={() => setCalModal(true)}
        >
          📅 Temporada{temporada.total_partidos ? ` · ${temporada.total_partidos} partidos` : ''}
        </button>
      </div>

      {/* TABS */}
      <div className="equipo-tabs">
        {[['plantilla', 'PLANTILLA'], ['stats', 'GENERALES'], ['individual', 'INDIVIDUAL']].map(([id, lbl]) => (
          <button key={id} className={`etab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {error && <div className="text-xs text-rojo mb-3">{error}</div>}

      {cargando ? (
        <div className="text-sm text-muted py-10 text-center">Cargando…</div>
      ) : jugadores.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          Aún no hay jugadores. Pulsa <b className="text-cyan">+ Jugador</b> para empezar.
        </div>
      ) : tab === 'plantilla' ? (
        <>
          <div className="pos-filter">
            {FILTROS.map(([lbl, code]) => (
              <button key={code} className={`pf-btn ${filtro === code ? 'active' : ''}`} onClick={() => setFiltro(code)}>{lbl}</button>
            ))}
          </div>

          <div className="equipo-table-wrap">
            <table className="equipo-table">
              <thead>
                <tr>
                  <th>Jugador</th><th>Forma</th>
                  <th title="Entrenamientos asistidos / total registrados">Ent.</th>
                  <th title="% asistencia entrenos">%Ent</th>
                  <th title={`Partidos jugados / total calendario (${totalCal})`}>PJ</th>
                  <th title="% partidos jugados sobre total calendario">%PJ</th>
                  <th>⚽</th><th>🅰️</th><th>🟨</th><th>🟥</th><th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((j) => {
                  const s = stats[j.id] || {}
                  const les = j.estado === 'lesionado'
                  const rating = les ? null : s.rating
                  const fc = formaClase(rating)
                  const totEnt = entrenos.length
                  return (
                    <tr key={j.id}>
                      <td>
                        <div className="eq-jugador-cell">
                          <div className={`eq-av f-${fc}`}>
                            {j.foto_url ? <img src={j.foto_url} alt="" /> : inicial(j.nombre)}
                          </div>
                          <div>
                            <div className="eq-nom">
                              {j.nombre}
                              {j.estado === 'sancionado' && <span className="eq-badge-san">SAN</span>}
                              {les && <span className="eq-badge-les">LES</span>}
                            </div>
                            <div className="eq-sub-info">#{j.dorsal} · {j.posicion}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="forma-badge" title={s.ratingFuente === 'entrenador' ? 'Nota del entrenador (media últimos 5 partidos)' : 'Rating automático (goles/asist)'}>
                          <span className={`fs ${fc}`}>{rating === null ? '—' : rating.toFixed(1)}</span>
                          {s.ratingFuente === 'entrenador' && <span style={{fontSize:7,color:'#f59e0b',marginLeft:2}}>★</span>}
                        </div>
                      </td>
                      <td className="text-xs text-center">{totEnt ? `${s.asis}/${totEnt}` : '—'}</td>
                      <td>{s.pctEnt === null ? '—' : <span className={s.pctEnt >= 80 ? 'pct-per' : s.pctEnt >= 60 ? 'pct-ok' : 'pct-lo'}>{s.pctEnt}%</span>}</td>
                      <td className="text-xs text-center">{totalCal ? `${s.pjs}/${totalCal}` : `${s.pjs}`}</td>
                      <td>{s.pjsPct === null ? <span className="text-muted text-xs">—</span> : <span className={s.pjsPct >= 80 ? 'pct-per' : s.pjsPct >= 60 ? 'pct-ok' : 'pct-lo'}>{s.pjsPct}%</span>}</td>
                      <td><strong style={{ color: s.goles ? '#fff' : undefined }}>{s.goles || 0}</strong></td>
                      <td>{s.asist || 0}</td>
                      <td><span className={s.amar >= 4 ? 'eq-am-warn' : 'eq-am-ok'}>{s.amar || 0}{s.amar >= 4 ? ' ⚠️' : ''}</span></td>
                      <td>{s.rojas || 0}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="eq-act-btn" onClick={() => abrirEdit(j)} title="Editar">✏️</button>
                        <button className="eq-act-btn hover:!text-rojo" onClick={() => borrar(j)} title="Dar de baja">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === 'stats' ? (
        /* TAB ESTADÍSTICAS GENERALES */
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="ent2-panel" style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 12, padding: 14 }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted mb-3">🥇 Máximos goleadores</div>
            {goleadores.length === 0 ? <div className="text-sm text-muted">Sin goles registrados aún.</div> : goleadores.map(({ j, goles, asist }, i) => (
              <div key={j.id} className="flex items-center gap-3 py-1.5 border-b border-borde last:border-0">
                <span className="w-5 text-cyan font-bold text-xs">{i + 1}</span>
                <div className="eq-av f-buena" style={{ width: 30, height: 30, fontSize: 11 }}>{inicial(j.nombre)}</div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{j.nombre}</div><div className="text-[10px] text-muted">{asist} asistencias</div></div>
                <div className="text-lg font-black text-cyan">{goles}</div>
              </div>
            ))}
          </div>
          <div className="ent2-panel" style={{ background: '#1c1c20', border: '1px solid #27272a', borderRadius: 12, padding: 14 }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted mb-3">📊 Resumen plantilla</div>
            <div className="grid grid-cols-2 gap-2">
              {[['Porteros', 'POR'], ['Defensas', 'DEF'], ['Medios', 'MED'], ['Delanteros', 'DEL']].map(([lbl, code]) => (
                <div key={code} className="ent2-ek" style={{ background: '#1a2235', borderRadius: 9, padding: 10, textAlign: 'center' }}>
                  <div className="text-xl font-black text-cyan">{jugadores.filter((j) => posACat(j.posicion) === code).length}</div>
                  <div className="text-[9px] text-muted uppercase tracking-wide">{lbl}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-muted mt-3">
              Goles totales: <b className="text-cyan">{jugadores.reduce((a, j) => a + (stats[j.id]?.goles || 0), 0)}</b> ·
              Tarjetas: <b className="text-dorado"> {jugadores.reduce((a, j) => a + (stats[j.id]?.amar || 0), 0)}🟨</b> <b className="text-rojo">{jugadores.reduce((a, j) => a + (stats[j.id]?.rojas || 0), 0)}🟥</b>
            </div>
          </div>
        </div>
      ) : (
        /* TAB ESTADÍSTICAS INDIVIDUALES */
        <div className="space-y-2">
          {[...jugadores]
            .sort((a, b) => (stats[b.id]?.rating || 0) - (stats[a.id]?.rating || 0))
            .map((j) => {
              const s = stats[j.id] || {}
              const fc = formaClase(j.estado === 'lesionado' ? null : s.rating)
              const totEnt = entrenos.length
              return (
                <div key={j.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '12px 14px' }}>
                  {/* Cabecera jugador */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`eq-av f-${fc}`} style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>
                      {j.foto_url ? <img src={j.foto_url} alt="" /> : inicial(j.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{j.nombre}
                        {j.estado === 'sancionado' && <span className="eq-badge-san ml-1.5">SAN</span>}
                        {j.estado === 'lesionado' && <span className="eq-badge-les ml-1.5">LES</span>}
                      </div>
                      <div className="text-[10px] text-muted">#{j.dorsal} · {j.posicion} · {j.pie || 'Derecho'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`fs ${fc} text-base font-black`}>{j.estado === 'lesionado' ? '—' : s.rating?.toFixed(1)}</div>
                      <div className="text-[9px] text-muted uppercase">rating</div>
                    </div>
                  </div>
                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                    {[
                      ['⚽', 'Goles', s.goles || 0, '#2dd4bf'],
                      ['🅰️', 'Asist.', s.asist || 0, '#94a3b8'],
                      ['🟨', 'Amaril.', s.amar || 0, s.amar >= 4 ? '#f59e0b' : '#94a3b8'],
                      ['🟥', 'Rojas', s.rojas || 0, s.rojas ? '#ef4444' : '#94a3b8'],
                      ['🏟️', 'Partidos', s.pjs || 0, '#94a3b8'],
                      ['%', 'Part.%', s.pjsPct !== null ? `${s.pjsPct}%` : '—', s.pjsPct >= 80 ? '#10b981' : s.pjsPct >= 60 ? '#f59e0b' : '#94a3b8'],
                      ['🏃', 'Entrenos', totEnt ? `${s.asis}/${totEnt}` : '—', '#94a3b8'],
                      ['📊', 'Asist.%', s.pctEnt !== null ? `${s.pctEnt}%` : '—', s.pctEnt >= 80 ? '#10b981' : s.pctEnt >= 60 ? '#f59e0b' : '#94a3b8'],
                    ].map(([icon, lbl, val, color]) => (
                      <div key={lbl} style={{ background: '#1a2235', borderRadius: 8, padding: '7px 6px', textAlign: 'center' }}>
                        <div className="text-[11px]">{icon}</div>
                        <div className="font-black text-sm" style={{ color }}>{val}</div>
                        <div className="text-[9px] text-muted uppercase tracking-wide leading-tight mt-0.5">{lbl}</div>
                      </div>
                    ))}
                  </div>
                  {/* Barra progreso asistencia */}
                  {s.pctEnt !== null && (
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[9px] text-muted mb-0.5">
                        <span>Asistencia entrenos</span><span>{s.pctEnt}%</span>
                      </div>
                      <div style={{ background: '#27272a', borderRadius: 4, height: 4 }}>
                        <div style={{ width: `${s.pctEnt}%`, height: 4, borderRadius: 4, background: s.pctEnt >= 80 ? '#10b981' : s.pctEnt >= 60 ? '#f59e0b' : '#ef4444', transition: 'width .4s' }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-5"
             onClick={() => setModal(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardar}
            className="card w-full sm:max-w-md p-5 rounded-b-none sm:rounded-xl">
            <h2 className="text-base font-extrabold mb-4">
              {editId ? '✏️ Editar jugador' : '👤 Nuevo jugador'}
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-borde grid place-items-center text-xl overflow-hidden flex-shrink-0">
                {form.foto_url ? <img src={form.foto_url} className="w-full h-full object-cover" /> : '👤'}
              </div>
              <label className="btn btn-outline text-xs cursor-pointer">
                📷 Foto
                <input type="file" accept="image/*" className="hidden" onChange={subirFoto} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted">Nombre *</label>
                <input className="field mt-1" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre y apellido" />
              </div>
              <div>
                <label className="text-xs text-muted">Dorsal *</label>
                <input className="field mt-1" type="number" min="1" max="99" value={form.dorsal}
                  onChange={(e) => setForm({ ...form, dorsal: e.target.value })} placeholder="#" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-muted">Posición</label>
              <select className="field mt-1" value={form.posicion}
                onChange={(e) => setForm({ ...form, posicion: e.target.value })}>
                {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-muted">Pie hábil</label>
                <select className="field mt-1" value={form.pie}
                  onChange={(e) => setForm({ ...form, pie: e.target.value })}>
                  <option>Derecho</option><option>Izquierdo</option><option>Ambos</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted">Nacimiento</label>
                <input className="field mt-1" type="date" value={form.nacimiento || ''}
                  onChange={(e) => setForm({ ...form, nacimiento: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-muted">Peso (kg)</label>
                <input className="field mt-1" type="number" min="1" max="200" step="0.1" value={form.peso_kg}
                  onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} placeholder="Ej: 72" />
              </div>
              <div>
                <label className="text-xs text-muted">Altura (cm)</label>
                <input className="field mt-1" type="number" min="100" max="230" step="1" value={form.altura_cm}
                  onChange={(e) => setForm({ ...form, altura_cm: e.target.value })} placeholder="Ej: 178" />
              </div>
            </div>
            {error && <div className="text-xs text-rojo mt-3">{error}</div>}
            <div className="flex gap-2 mt-5">
              <button type="button" className="btn btn-outline flex-1" onClick={() => setModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary flex-1">
                {editId ? 'Guardar cambios' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal TEMPORADA / CALENDARIO */}
      {calModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-5"
          onClick={() => setCalModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="card w-full sm:max-w-md p-5 rounded-b-none sm:rounded-xl">
            <h2 className="text-base font-extrabold mb-1">📅 Configurar temporada</h2>
            <p className="text-[11px] text-muted mb-4">
              Define el total de partidos del calendario para calcular el % de participación de cada jugador.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted">Nombre de la temporada</label>
                <input className="field mt-1" value={temporada.nombre}
                  onChange={(e) => setTemporada((t) => ({ ...t, nombre: e.target.value }))}
                  placeholder="Ej: Temporada 2024/25" />
              </div>
              <div>
                <label className="text-xs text-muted">Total de partidos en el calendario</label>
                <input className="field mt-1" type="number" min={1} max={99}
                  value={temporada.total_partidos}
                  onChange={(e) => setTemporada((t) => ({ ...t, total_partidos: e.target.value }))}
                  placeholder="Ej: 22" />
                <div className="text-[10px] text-muted mt-1">
                  Partidos guardados en Informes: <b className="text-cyan">{partidos.length}</b>.
                  Si no pones total aquí, se usa ese número como base.
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn btn-outline flex-1" onClick={() => setCalModal(false)}>Cancelar</button>
              <button className="btn btn-primary flex-1" onClick={async () => {
                try {
                  await updatePerfil({ temporada })
                  setCalModal(false)
                } catch (e) { setError(e.message) }
              }}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal IMPORTAR */}
      {impOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={() => setImpOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="card w-full sm:max-w-md p-5 rounded-b-none sm:rounded-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-extrabold mb-1">📥 Importar plantilla</h2>
            <p className="text-[11px] text-muted mb-3">
              Pega del acta FCF (<b>APELLIDOS, NOMBRE</b>), un CSV (<b>nombre, dorsal, posición</b>) o una lista de nombres (uno por línea).
            </p>
            <textarea className="field h-40 font-mono text-xs" value={impText}
              onChange={(e) => analizar(e.target.value)}
              placeholder={"GARCIA LOPEZ, MARC\nFERRER SOLE, ALEX\n...\n\n— o —\nMarc Garcia, 9, Delantero centro"} />

            {impPrev.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-muted uppercase mb-1">Vista previa ({impPrev.length})</div>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {impPrev.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-7 text-cyan font-bold">#{p.dorsal}</span>
                      <span className="flex-1 truncate">{p.nombre}</span>
                      {p.posicion && <span className="text-[10px] text-muted">{p.posicion}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {impMsg && <div className="text-xs text-rojo mt-3">{impMsg}</div>}
            <div className="flex gap-2 mt-5">
              <button className="btn btn-outline flex-1" onClick={() => setImpOpen(false)}>Cancelar</button>
              <button className="btn btn-primary flex-1" onClick={confirmarImport} disabled={!impPrev.length}>
                Importar {impPrev.length || ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
