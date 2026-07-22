import { useEffect, useMemo, useState } from 'react'
import { temporadaDe, temporadasDe, temporadaActual } from '../lib/season'
import { listarJugadores } from '../lib/jugadores'
import { listarTarjetas, crearTarjeta, borrarTarjeta } from '../lib/tarjetas'
import { listarLesiones, crearLesion, darAlta, borrarLesion } from '../lib/lesiones'
import { getPerfil } from '../lib/perfil'
import { useEquipo } from '../contexts/EquipoContext'
import { notificarRiesgoSancion } from '../lib/push'

const LIMITE = 5

/* ── helpers ── */
const ini = (nombre = '') => nombre.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

function Avatar({ j, size = 36, bg = 'rgba(39,39,42,1)', color = '#d4d4d8', children }) {
  return (
    <div className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-black relative"
      style={{ width: size, height: size, background: j?.foto_url ? 'transparent' : bg, color, fontSize: size * 0.3 }}>
      {j?.foto_url
        ? <img src={j.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : ini(j?.nombre)}
      {children}
    </div>
  )
}
const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'
const diasDesde = (d) => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : 0
const diasHasta = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null

const GRAVEDADES = [
  { id: 'leve',     lbl: 'Leve',     color: '#f59e0b', desc: '1–7 días' },
  { id: 'moderada', lbl: 'Moderada', color: '#f97316', desc: '1–3 semanas' },
  { id: 'grave',    lbl: 'Grave',    color: '#ef4444', desc: '1–3 meses' },
]

/* ── sugerencias IA disciplina ── */
function sugerenciasIA(tarjetas, jugadores) {
  const sugs = []
  const cuentas = {}
  tarjetas.forEach((t) => {
    if (!cuentas[t.jugador_id]) cuentas[t.jugador_id] = { am: 0, ro: 0 }
    if (t.tipo === 'amarilla') cuentas[t.jugador_id].am++
    else cuentas[t.jugador_id].ro++
  })
  const enRiesgo = Object.entries(cuentas).filter(([, v]) => v.am >= 4)
  if (enRiesgo.length > 0) {
    const nombres = enRiesgo.map(([id]) => jugadores.find((j) => j.id === id)?.nombre?.split(' ')[0] || '?').join(', ')
    sugs.push({ ico: '⚠️', tipo: 'advertencia', titulo: 'Jugadores en riesgo de sanción', desc: `${nombres} tienen 4+ amarillas. Considerar no arriesgarlos en duelos divididos esta jornada.` })
  }
  const sancionados = Object.entries(cuentas).filter(([, v]) => v.am >= LIMITE || v.ro >= 1)
  if (sancionados.length > 0) {
    const nombres = sancionados.map(([id]) => jugadores.find((j) => j.id === id)?.nombre?.split(' ')[0] || '?').join(', ')
    sugs.push({ ico: '🚫', tipo: 'error', titulo: 'Posibles sancionados', desc: `${nombres} podrían cumplir sanción. Verificar reglamento de la competición.` })
  }
  const totalAm = tarjetas.filter((t) => t.tipo === 'amarilla').length
  const partidos = [...new Set(tarjetas.map((t) => t.fecha))].length
  if (partidos > 2 && totalAm / partidos > 2.5) {
    sugs.push({ ico: '📊', tipo: 'info', titulo: 'Alto índice de amonestaciones', desc: `El equipo promedia ${(totalAm / partidos).toFixed(1)} amarillas por partido. Trabajar disciplina táctica en los próximos entrenamientos.` })
  }
  if (sugs.length === 0) sugs.push({ ico: '✅', tipo: 'ok', titulo: 'Disciplina bajo control', desc: 'Ningún jugador en riesgo inmediato de sanción. Mantener la línea.' })
  return sugs
}

/* ── sugerencias IA lesiones ── */
function sugerenciasLesionesIA(lesiones, jugadores) {
  const activas = lesiones.filter((l) => !l.alta)
  const sugs = []
  const graves = activas.filter((l) => l.gravedad === 'grave')
  if (graves.length > 0) {
    const ns = graves.map((l) => jugadores.find((j) => j.id === l.jugador_id)?.nombre?.split(' ')[0] || '?').join(', ')
    sugs.push({ ico: '🚨', tipo: 'error', titulo: 'Lesiones graves activas', desc: `${ns}: lesión grave en curso. No forzar la recuperación, respetar los tiempos médicos.` })
  }
  const proxAlta = activas.filter((l) => l.fecha_alta && diasHasta(l.fecha_alta) <= 7 && diasHasta(l.fecha_alta) >= 0)
  if (proxAlta.length > 0) {
    const ns = proxAlta.map((l) => jugadores.find((j) => j.id === l.jugador_id)?.nombre?.split(' ')[0] || '?').join(', ')
    sugs.push({ ico: '🔜', tipo: 'info', titulo: 'Alta médica próxima', desc: `${ns} podría estar disponible esta semana. Planificar reincorporación progresiva al grupo.` })
  }
  if (activas.length >= 3) {
    sugs.push({ ico: '📋', tipo: 'advertencia', titulo: `${activas.length} bajas activas`, desc: 'Alta carga de lesiones. Revisar carga de entrenamiento y adaptar convocatorias.' })
  }
  if (sugs.length === 0) {
    if (activas.length === 0) sugs.push({ ico: '💪', tipo: 'ok', titulo: 'Plantilla al 100%', desc: 'Sin bajas por lesión en este momento. Todos disponibles para la próxima convocatoria.' })
    else sugs.push({ ico: '🩺', tipo: 'info', titulo: `${activas.length} jugador${activas.length > 1 ? 'es' : ''} en recuperación`, desc: 'Seguir los protocolos de recuperación y evaluar disponibilidad antes de cada partido.' })
  }
  return sugs
}

export default function Disciplina() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [tab, setTab] = useState('disciplina')
  const [jugadores, setJugadores] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [lesiones, setLesiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tempSel, setTempSel] = useState(null) // null = campeonato actual

  /* modales */
  const [modalT, setModalT] = useState(false)
  const [modalL, setModalL] = useState(false)
  const [formT, setFormT] = useState({ jugador_id: '', tipo: 'amarilla', minuto: '', motivo: '', fecha: '' })
  const [formL, setFormL] = useState({ jugador_id: '', tipo: '', zona: '', gravedad: 'leve', fecha_inicio: '', fecha_alta: '', notas: '' })
  const [msg, setMsg] = useState('')

  async function refrescar() {
    setCargando(true)
    try {
      const [js, ts, ls] = await Promise.all([
        listarJugadores(eid),
        listarTarjetas(eid),
        listarLesiones(eid),
      ])
      setJugadores(js); setTarjetas(ts); setLesiones(ls)
    } catch (e) { setMsg(e.message) } finally { setCargando(false) }
  }
  // Solo cargar cuando el equipo activo está listo. Si se llama sin equipo,
  // las funciones traen los datos de TODOS los equipos (por eso al refrescar
  // salían todas las tarjetas/lesiones): evitamos ese estado intermedio.
  useEffect(() => {
    if (eid) { refrescar() }
    else { setJugadores([]); setTarjetas([]); setLesiones([]); setCargando(false) }
  }, [eid])

  /* ── Filtro por campeonato/temporada ── */
  const fechaT = (t) => t.fecha || t.creado
  const fechaL = (l) => l.fecha_inicio || l.creado
  const temporadas = useMemo(
    () => temporadasDe([...tarjetas.map(fechaT), ...lesiones.map(fechaL)]),
    [tarjetas, lesiones]
  )
  const actual = temporadas[0] || temporadaActual([])
  const temp = tempSel || actual  // temporada efectiva ('todas' = sin filtro)
  const enTemp = (fecha) => temp === 'todas' || temporadaDe(fecha) === temp
  const tarjetas_ = useMemo(() => temp === 'todas' ? tarjetas : tarjetas.filter((t) => enTemp(fechaT(t))), [tarjetas, temp])
  const lesiones_ = useMemo(() => temp === 'todas' ? lesiones : lesiones.filter((l) => enTemp(fechaL(l))), [lesiones, temp])

  /* cuentas tarjetas (de la temporada seleccionada) */
  function cuentaT(jid) {
    const ts = tarjetas_.filter((t) => t.jugador_id === jid)
    return { am: ts.filter((t) => t.tipo === 'amarilla').length, ro: ts.filter((t) => t.tipo === 'roja').length }
  }
  const nombreJ = (jid) => jugadores.find((j) => j.id === jid)?.nombre || '—'

  async function guardarTarjeta() {
    if (!formT.jugador_id) { setMsg('Elige un jugador'); return }
    try {
      await crearTarjeta({ ...formT, minuto: formT.minuto ? parseInt(formT.minuto) : null }, eid)
      setModalT(false); setFormT({ jugador_id: '', tipo: 'amarilla', minuto: '', motivo: '', fecha: '' })
      setMsg(''); await refrescar()
      // Notificar si el jugador queda en riesgo de sanción
      if (formT.tipo === 'amarilla') {
        const nuevasCuentas = cuentaT(formT.jugador_id)
        if (nuevasCuentas.am >= LIMITE - 1) {
          notificarRiesgoSancion(nombreJ(formT.jugador_id), nuevasCuentas.am + 1).catch(() => {})
        }
      }
    } catch (e) { setMsg(e.message) }
  }

  async function guardarLesion() {
    if (!formL.jugador_id) { setMsg('Elige un jugador'); return }
    if (!formL.fecha_inicio) { setMsg('Indica la fecha de inicio'); return }
    try {
      await crearLesion(formL, eid)
      setModalL(false); setFormL({ jugador_id: '', tipo: '', zona: '', gravedad: 'leve', fecha_inicio: '', fecha_alta: '', notas: '' })
      setMsg(''); await refrescar()
    } catch (e) { setMsg(e.message) }
  }

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  /* ── datos disciplina (temporada seleccionada) ── */
  const totalAm = tarjetas_.filter((t) => t.tipo === 'amarilla').length
  const totalRo = tarjetas_.filter((t) => t.tipo === 'roja').length
  const conTarjetas = jugadores
    .map((j) => ({ j, ...cuentaT(j.id) }))
    .filter((x) => x.am > 0 || x.ro > 0)
    .sort((a, b) => b.am - a.am || b.ro - a.ro)
  const sancionados = conTarjetas.filter((x) => x.am >= LIMITE || x.ro >= 1)
  const enRiesgo = conTarjetas.filter((x) => x.am >= 4 && x.am < LIMITE && x.ro === 0)
  const normales = conTarjetas.filter((x) => x.am < 4 && x.ro === 0)
  const limpios = jugadores.filter((j) => { const c = cuentaT(j.id); return c.am === 0 && c.ro === 0 })

  /* ── datos lesiones ── */
  // Las lesiones ACTIVAS se muestran siempre (una baja no se "cierra" al cambiar
  // de campeonato: el jugador sigue lesionado). El historial (con alta) sí se
  // filtra por la temporada seleccionada.
  const lesActivas = lesiones.filter((l) => !l.alta)
  const lesHistorial = lesiones_.filter((l) => l.alta)

  const sugsDisc = sugerenciasIA(tarjetas_, jugadores)
  const sugsLes = sugerenciasLesionesIA([...lesActivas, ...lesHistorial], jugadores)

  const colorSug = { ok: 'rgba(16,185,129,0.08)', advertencia: 'rgba(245,158,11,0.08)', error: 'rgba(239,68,68,0.08)', info: 'rgba(59,130,246,0.08)' }
  const borderSug = { ok: 'rgba(16,185,129,0.25)', advertencia: 'rgba(245,158,11,0.25)', error: 'rgba(239,68,68,0.25)', info: 'rgba(59,130,246,0.25)' }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-extrabold">Disciplina & Lesiones</h1>
          <p className="text-[11px] text-muted">
            {temp === 'todas' ? 'Histórico completo (todas las temporadas)' : `Campeonato ${temp}`} · control médico y disciplinario
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {temporadas.length > 0 && (
            <label className="flex items-center gap-1.5 text-[11px] text-muted bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5">
              🏆
              <select
                value={temp}
                onChange={(e) => setTempSel(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#2dd4bf', fontWeight: 700, fontSize: 12, outline: 'none', cursor: 'pointer' }}
              >
                <option value={actual} style={{ background: '#18181b', color: '#fafafa' }}>Actual · {actual}</option>
                {temporadas.filter((t) => t !== actual).map((t) => (
                  <option key={t} value={t} style={{ background: '#18181b', color: '#fafafa' }}>{t}</option>
                ))}
                <option value="todas" style={{ background: '#18181b', color: '#fafafa' }}>Todas (histórico)</option>
              </select>
            </label>
          )}
          <button className="btn btn-outline" onClick={() => { setMsg(''); setModalL(true) }}>+ Lesión</button>
          <button className="btn btn-primary" onClick={() => { setMsg(''); setModalT(true) }}>+ Tarjeta</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#18181b] rounded-xl p-1 w-fit">
        {[['disciplina','🟨 Disciplina'],['lesiones','🩺 Lesiones']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-[#27272a] text-white' : 'text-muted hover:text-white'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ══ TAB DISCIPLINA ══ */}
      {tab === 'disciplina' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="card p-3 text-center">
              <div className="text-2xl font-black text-dorado">{totalAm}</div>
              <div className="text-[10px] text-muted mt-0.5">🟨 Amarillas totales</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-black text-rojo">{totalRo}</div>
              <div className="text-[10px] text-muted mt-0.5">🟥 Rojas totales</div>
            </div>
            <div className="card p-3 text-center" style={{ borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.04)' }}>
              <div className="text-2xl font-black" style={{ color: '#f97316' }}>{enRiesgo.length}</div>
              <div className="text-[10px] text-muted mt-0.5">⚠️ En riesgo</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-black text-verde">{limpios.length}</div>
              <div className="text-[10px] text-muted mt-0.5">✅ Sin tarjetas</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            {/* Lista jugadores */}
            <div className="card p-4">
              <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Estado disciplinario del plantel</div>

              {sancionados.length > 0 && (
                <>
                  <SectionLabel color="#ef4444">🚫 Sancionados / Expulsados</SectionLabel>
                  {sancionados.map((x) => <JugadorRow key={x.j.id} x={x} limite={LIMITE} tipo="sancionado" />)}
                </>
              )}

              {enRiesgo.length > 0 && (
                <>
                  <SectionLabel color="#f97316">⚠️ En riesgo — próxima amarilla = sanción</SectionLabel>
                  {enRiesgo.map((x) => <JugadorRow key={x.j.id} x={x} limite={LIMITE} tipo="riesgo" />)}
                </>
              )}

              {normales.length > 0 && (
                <>
                  <SectionLabel color="#f59e0b">📋 Con amonestaciones</SectionLabel>
                  {normales.map((x) => <JugadorRow key={x.j.id} x={x} limite={LIMITE} tipo="normal" />)}
                </>
              )}

              {limpios.length > 0 && (
                <>
                  <SectionLabel color="#10b981">✅ Sin amonestaciones</SectionLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {limpios.map((j) => (
                      <div key={j.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]"
                        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <span className="text-verde text-xs">✓</span>
                        <span className="font-semibold">{j.nombre}</span>
                        <span className="text-muted text-[10px]">#{j.dorsal}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {conTarjetas.length === 0 && limpios.length === 0 && (
                <div className="py-8 text-center text-sm text-muted">Sin jugadores registrados.</div>
              )}
            </div>

            {/* Panel lateral */}
            <div className="flex flex-col gap-4">
              {/* Sugerencias IA */}
              <div className="card p-4">
                <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🤖 Análisis IA</div>
                <div className="flex flex-col gap-2">
                  {sugsDisc.map((s, i) => (
                    <div key={i} className="rounded-lg p-3 text-[11px]"
                      style={{ background: colorSug[s.tipo], border: `1px solid ${borderSug[s.tipo]}` }}>
                      <div className="font-bold mb-0.5">{s.ico} {s.titulo}</div>
                      <div className="text-muted leading-relaxed">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertas próxima jornada */}
              {(sancionados.length > 0 || enRiesgo.length > 0) && (
                <div className="card p-4" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                  <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🚨 Alertas próxima jornada</div>
                  <div className="flex flex-col gap-2">
                    {sancionados.map((x) => (
                      <AlertaItem key={x.j.id} ico="🚫" tipo="error"
                        titulo={`${x.j.nombre} — NO DISPONIBLE`}
                        desc={`${x.ro > 0 ? 'Expulsión directa' : `${x.am} amarillas acumuladas`}. Verificar si cumple sanción esta jornada.`} />
                    ))}
                    {enRiesgo.map((x) => (
                      <AlertaItem key={x.j.id} ico="⚠️" tipo="advertencia"
                        titulo={`${x.j.nombre} — PRECAUCIÓN`}
                        desc={`${x.am} amarillas. La próxima amonestación implica sanción automática.`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Historial */}
              {tarjetas_.length > 0 && (
                <div className="card p-4">
                  <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📅 Historial reciente</div>
                  <div className="flex flex-col gap-2">
                    {tarjetas_.slice(0, 8).map((t) => (
                      <div key={t.id} className="flex items-start gap-2.5">
                        <span className="text-sm flex-shrink-0">{t.tipo === 'roja' ? '🟥' : '🟨'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold truncate">{nombreJ(t.jugador_id)}</div>
                          <div className="text-[10px] text-muted">{fmtFecha(t.fecha)}{t.minuto ? ` · min. ${t.minuto}'` : ''}{t.motivo ? ` · ${t.motivo}` : ''}</div>
                        </div>
                        <button className="text-muted hover:text-rojo text-[10px] flex-shrink-0 mt-0.5"
                          onClick={async () => { await borrarTarjeta(t.id); refrescar() }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══ TAB LESIONES ══ */}
      {tab === 'lesiones' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="card p-3 text-center" style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
              <div className="text-2xl font-black text-rojo">{lesActivas.length}</div>
              <div className="text-[10px] text-muted mt-0.5">🩺 Bajas activas</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-black text-verde">{jugadores.length - lesActivas.length}</div>
              <div className="text-[10px] text-muted mt-0.5">✅ Disponibles</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-black text-rojo">{lesActivas.filter((l) => l.gravedad === 'grave').length}</div>
              <div className="text-[10px] text-muted mt-0.5">🚨 Lesiones graves</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-black text-muted">{lesHistorial.length}</div>
              <div className="text-[10px] text-muted mt-0.5">📋 Historial total</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            {/* Lista lesiones activas */}
            <div className="card p-4">
              <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Bajas activas</div>

              {lesActivas.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-3xl mb-2">💪</div>
                  <div className="text-sm font-semibold">Plantilla al 100%</div>
                  <div className="text-xs text-muted mt-1">Ninguna baja por lesión en este momento.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {lesActivas.map((l) => {
                    const j = jugadores.find((jj) => jj.id === l.jugador_id)
                    const g = GRAVEDADES.find((g) => g.id === l.gravedad) || GRAVEDADES[0]
                    const dias = diasDesde(l.fecha_inicio)
                    const alta = l.fecha_alta ? diasHasta(l.fecha_alta) : null
                    return (
                      <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <Avatar j={j} size={36} bg={`${g.color}22`} color={g.color} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">{j?.nombre || '—'}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${g.color}22`, color: g.color }}>{g.lbl}</span>
                          </div>
                          <div className="text-[11px] text-muted mt-0.5">
                            {l.zona && <span className="mr-2">📍 {l.zona}</span>}
                            {l.tipo && <span className="mr-2">· {l.tipo}</span>}
                          </div>
                          <div className="text-[10px] text-muted mt-1">
                            Desde {fmtFecha(l.fecha_inicio)} ({dias}d)
                            {alta !== null && alta >= 0 && <span className="text-verde ml-2">· Alta en ~{alta}d</span>}
                            {alta !== null && alta < 0 && <span style={{ color: '#f97316' }} className="ml-2">· Alta prevista superada</span>}
                          </div>
                          {l.notas && <div className="text-[10px] text-muted mt-1 italic">{l.notas}</div>}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button className="text-[10px] px-2 py-1 rounded bg-verde/10 text-verde border border-verde/20 font-semibold hover:bg-verde/20"
                            onClick={async () => { await darAlta(l.id, l.jugador_id); refrescar() }}>Alta</button>
                          <button className="text-[10px] text-muted hover:text-rojo"
                            onClick={async () => { await borrarLesion(l.id, l.jugador_id); refrescar() }}>✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Historial altas */}
              {lesHistorial.length > 0 && (
                <>
                  <div className="text-xs font-bold text-muted uppercase tracking-wide mt-5 mb-2">Historial — recuperados</div>
                  <div className="flex flex-col gap-2">
                    {lesHistorial.slice(0, 8).map((l) => {
                      const j = jugadores.find((jj) => jj.id === l.jugador_id)
                      const g = GRAVEDADES.find((g) => g.id === l.gravedad) || GRAVEDADES[0]
                      return (
                        <div key={l.id} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-borde last:border-0">
                          <span style={{ color: g.color }}>●</span>
                          <span className="font-semibold flex-1">{j?.nombre || '—'}</span>
                          <span className="text-muted">{l.zona || l.tipo || '—'}</span>
                          <span className="text-muted">{fmtFecha(l.fecha_inicio)} → {fmtFecha(l.fecha_alta)}</span>
                          <button className="text-muted hover:text-rojo ml-1" onClick={async () => { await borrarLesion(l.id, l.jugador_id); refrescar() }}>✕</button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Panel lateral lesiones */}
            <div className="flex flex-col gap-4">
              {/* IA */}
              <div className="card p-4">
                <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🤖 Análisis IA</div>
                <div className="flex flex-col gap-2">
                  {sugsLes.map((s, i) => (
                    <div key={i} className="rounded-lg p-3 text-[11px]"
                      style={{ background: colorSug[s.tipo], border: `1px solid ${borderSug[s.tipo]}` }}>
                      <div className="font-bold mb-0.5">{s.ico} {s.titulo}</div>
                      <div className="text-muted leading-relaxed">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="card p-4">
                <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📋 Disponibilidad</div>
                <div className="flex flex-col gap-1.5">
                  {jugadores.map((j) => {
                    const les = lesActivas.find((l) => l.jugador_id === j.id)
                    const g = les ? GRAVEDADES.find((g) => g.id === les.gravedad) : null
                    return (
                      <div key={j.id} className="flex items-center gap-2 text-[11px]">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: les ? (g?.color || '#ef4444') : '#10b981' }} />
                        <span className="flex-1 truncate">{j.nombre}</span>
                        <span className="text-muted">{les ? `🩺 ${g?.lbl || 'Baja'}` : '✅'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ MODAL TARJETA ══ */}
      {modalT && (
        <Modal onClose={() => setModalT(false)} titulo="🟨 Registrar tarjeta">
          <div className="space-y-3">
            <FieldSelect label="Jugador" value={formT.jugador_id} onChange={(v) => setFormT({ ...formT, jugador_id: v })}>
              <option value="">— elige —</option>
              {jugadores.map((j) => <option key={j.id} value={j.id}>#{j.dorsal} {j.nombre}</option>)}
            </FieldSelect>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1">Tipo</label>
                <div className="flex gap-2">
                  {['amarilla','roja'].map((tipo) => (
                    <button key={tipo} onClick={() => setFormT({ ...formT, tipo })}
                      className="flex-1 py-2 rounded-lg border text-sm font-bold transition-all"
                      style={formT.tipo === tipo ? { borderColor: tipo === 'roja' ? '#ef4444' : '#f59e0b', background: tipo === 'roja' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: tipo === 'roja' ? '#ef4444' : '#f59e0b' } : { borderColor: '#27272a', color: '#71717a' }}>
                      {tipo === 'roja' ? '🟥' : '🟨'}
                    </button>
                  ))}
                </div>
              </div>
              <FieldInput label="Minuto" type="number" placeholder="ej: 55" value={formT.minuto} onChange={(v) => setFormT({ ...formT, minuto: v })} />
            </div>
            <FieldInput label="Fecha" type="date" value={formT.fecha} onChange={(v) => setFormT({ ...formT, fecha: v })} />
            <FieldInput label="Motivo (opcional)" placeholder="Ej: entrada fuerte, protestar…" value={formT.motivo} onChange={(v) => setFormT({ ...formT, motivo: v })} />
          </div>
          {msg && <div className="text-xs text-rojo mt-3">{msg}</div>}
          <ModalBtns onCancel={() => setModalT(false)} onSave={guardarTarjeta} />
        </Modal>
      )}

      {/* ══ MODAL LESIÓN ══ */}
      {modalL && (
        <Modal onClose={() => setModalL(false)} titulo="🩺 Registrar lesión">
          <div className="space-y-3">
            <FieldSelect label="Jugador" value={formL.jugador_id} onChange={(v) => setFormL({ ...formL, jugador_id: v })}>
              <option value="">— elige —</option>
              {jugadores.map((j) => <option key={j.id} value={j.id}>#{j.dorsal} {j.nombre}</option>)}
            </FieldSelect>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Tipo de lesión" placeholder="Ej: esguince, rotura…" value={formL.tipo} onChange={(v) => setFormL({ ...formL, tipo: v })} />
              <FieldInput label="Zona muscular" placeholder="Ej: tobillo, isquio…" value={formL.zona} onChange={(v) => setFormL({ ...formL, zona: v })} />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Gravedad</label>
              <div className="flex gap-2">
                {GRAVEDADES.map((g) => (
                  <button key={g.id} onClick={() => setFormL({ ...formL, gravedad: g.id })}
                    className="flex-1 py-2 px-1 rounded-lg border text-[11px] font-bold transition-all"
                    style={formL.gravedad === g.id ? { borderColor: g.color, background: `${g.color}18`, color: g.color } : { borderColor: '#27272a', color: '#71717a' }}>
                    {g.lbl}<br /><span className="font-normal opacity-70">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Fecha inicio" type="date" value={formL.fecha_inicio} onChange={(v) => setFormL({ ...formL, fecha_inicio: v })} />
              <FieldInput label="Alta estimada" type="date" value={formL.fecha_alta} onChange={(v) => setFormL({ ...formL, fecha_alta: v })} />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Notas</label>
              <textarea className="field" rows={2} placeholder="Observaciones, protocolo…" value={formL.notas} onChange={(e) => setFormL({ ...formL, notas: e.target.value })} />
            </div>
          </div>
          {msg && <div className="text-xs text-rojo mt-3">{msg}</div>}
          <ModalBtns onCancel={() => setModalL(false)} onSave={guardarLesion} />
        </Modal>
      )}
    </div>
  )
}

/* ── Sub-componentes ── */
function SectionLabel({ color, children }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-wide mt-4 mb-2 pb-1 border-b border-borde" style={{ color }}>
      {children}
    </div>
  )
}

function JugadorRow({ x, limite, tipo }) {
  const pct = Math.min((x.am / limite) * 100, 100)
  const barColor = tipo === 'sancionado' ? '#ef4444' : tipo === 'riesgo' ? '#f97316' : '#f59e0b'
  const posTag = x.j.posicion?.substring(0, 3).toUpperCase() || '—'
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-borde last:border-0 flex-wrap">
      <Avatar
        j={x.j}
        size={36}
        bg={tipo === 'sancionado' ? 'rgba(239,68,68,0.1)' : tipo === 'riesgo' ? 'rgba(249,115,22,0.1)' : 'rgba(39,39,42,1)'}
        color={tipo === 'sancionado' ? '#ef4444' : '#d4d4d8'}
      >
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-[#27272a] px-1 rounded font-bold text-muted">{posTag}</span>
      </Avatar>
      <div className="flex-1 min-w-[100px]">
        <div className="text-sm font-semibold">{x.j.nombre}</div>
        <div className="text-[10px] text-muted">{x.j.posicion} · #{x.j.dorsal}</div>
        {x.am > 0 && (
          <div className="mt-1 h-1 w-full rounded-full bg-[#27272a] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        )}
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        {Array.from({ length: x.am }).map((_, i) => <div key={i} className="w-3 h-4 rounded-sm" style={{ background: '#f59e0b' }} />)}
        {Array.from({ length: x.ro }).map((_, i) => <div key={i} className="w-3 h-4 rounded-sm" style={{ background: '#ef4444' }} />)}
      </div>
      <div className="flex gap-3 flex-shrink-0">
        <div className="text-center"><div className="text-sm font-black" style={{ color: '#f59e0b' }}>{x.am}</div><div className="text-[9px] text-muted">🟨</div></div>
        <div className="text-center"><div className="text-sm font-black" style={{ color: '#ef4444' }}>{x.ro}</div><div className="text-[9px] text-muted">🟥</div></div>
      </div>
      {tipo === 'sancionado' && <span className="text-[9px] font-black px-2 py-0.5 rounded bg-rojo/20 text-rojo">SANCIONADO</span>}
      {tipo === 'riesgo' && <span className="text-[9px] font-black px-2 py-0.5 rounded" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>⚠️ RIESGO</span>}
    </div>
  )
}

function AlertaItem({ ico, tipo, titulo, desc }) {
  const bg = { error: 'rgba(239,68,68,0.06)', advertencia: 'rgba(249,115,22,0.06)' }
  const border = { error: 'rgba(239,68,68,0.2)', advertencia: 'rgba(249,115,22,0.2)' }
  return (
    <div className="flex gap-2.5 p-3 rounded-lg text-[11px]" style={{ background: bg[tipo], border: `1px solid ${border[tipo]}` }}>
      <span className="text-base flex-shrink-0">{ico}</span>
      <div><div className="font-bold mb-0.5">{titulo}</div><div className="text-muted leading-relaxed">{desc}</div></div>
    </div>
  )
}

function Modal({ onClose, titulo, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card w-full sm:max-w-lg p-5 rounded-b-none sm:rounded-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-extrabold mb-4">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

function ModalBtns({ onCancel, onSave }) {
  return (
    <div className="flex gap-2 mt-5">
      <button className="btn btn-outline flex-1" onClick={onCancel}>Cancelar</button>
      <button className="btn btn-primary flex-1" onClick={onSave}>Guardar</button>
    </div>
  )
}

function FieldSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </div>
  )
}

function FieldInput({ label, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <input className="field" type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
