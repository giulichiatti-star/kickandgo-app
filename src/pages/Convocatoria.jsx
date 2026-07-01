import { useEffect, useMemo, useState } from 'react'
import { listarJugadores, posACat } from '../lib/jugadores'
import { guardarConvocatoria, ultimaConvocatoria } from '../lib/convocatorias'
import { getPerfil } from '../lib/perfil'
import { nTitulares, nSuplentes, formacionesPara, formacionDefecto, categoriaSlot, rolSugeridoSlot } from '../lib/formaciones'
import { useEquipo } from '../contexts/EquipoContext'
import { listarLesiones } from '../lib/lesiones'
import Jersey from '../components/Jersey'
import '../ev2.css'

export default function Convocatoria() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [jugadores, setJugadores] = useState([])
  const [asignaciones, setAsignaciones] = useState([]) // array de ids o null, por slot
  const [suplentes, setSuplentes] = useState([]) // ids
  const [rival, setRival] = useState('')
  const [fecha, setFecha] = useState('')
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')
  const [tipo, setTipo] = useState('11')
  const [formacion, setFormacion] = useState('4-3-3')
  const [club, setClub] = useState('')
  const [lesActivas, setLesActivas] = useState([])
  const [picker, setPicker] = useState(null) // { slot } | { modo:'suplente' } | null
  const [moviendo, setMoviendo] = useState(null) // índice de slot en modo "mover"
  const MAX_TIT = nTitulares(tipo)
  const MAX_SUP = nSuplentes(tipo)
  const coords = formacionesPara(tipo)[formacion] || Object.values(formacionesPara(tipo))[0]

  useEffect(() => {
    (async () => {
      try {
        const t = equipoActivo?.tipo_equipo || '11'
        setTipo(t); setClub(equipoActivo?.nombre || '')
        const formInicial = formacionDefecto(t)
        setFormacion(formInicial)
        const [js, les] = await Promise.all([listarJugadores(eid), listarLesiones(eid).catch(() => [])])
        setJugadores(js)
        setLesActivas(les.filter(l => !l.alta))
        const ult = await ultimaConvocatoria(eid)
        const nSlots = (formacionesPara(t)[ult?.formacion] || formacionesPara(t)[formInicial]).length
        if (ult) {
          setRival(ult.rival || '')
          setFecha(ult.fecha || '')
          const formUlt = ult.formacion && formacionesPara(t)[ult.formacion] ? ult.formacion : formInicial
          setFormacion(formUlt)
          const tits = (ult.titulares || []).map((x) => x.id).filter(Boolean)
          const arr = new Array(nSlots).fill(null)
          tits.slice(0, nSlots).forEach((id, i) => { arr[i] = id })
          setAsignaciones(arr)
          setSuplentes((ult.suplentes || []).map((s) => s.id).filter(Boolean))
        } else {
          setAsignaciones(new Array(nSlots).fill(null))
        }
      } catch (e) { setMsg(e.message) }
      finally { setCargando(false) }
    })()
  }, [eid])

  // Al cambiar de formación, conservar los jugadores ya puestos que quepan en los nuevos slots
  function cambiarFormacion(f) {
    setFormacion(f)
    const nuevos = (formacionesPara(tipo)[f] || []).length
    setAsignaciones((a) => {
      const arr = new Array(nuevos).fill(null)
      a.forEach((id, i) => { if (id && i < nuevos) arr[i] = id })
      return arr
    })
  }

  const byId = (id) => jugadores.find((j) => j.id === id)
  const idsEnCampo = asignaciones.filter(Boolean)
  const yaConvocado = (id) => idsEnCampo.includes(id) || suplentes.includes(id)
  const hayPortero = asignaciones[0] != null

  function asignarSlot(slot, jugadorId) {
    setAsignaciones((a) => {
      const arr = [...a]
      // liberar si el jugador ya estaba en otro slot
      const prevIdx = arr.findIndex((id) => id === jugadorId)
      if (prevIdx !== -1) arr[prevIdx] = null
      arr[slot] = jugadorId
      return arr
    })
    setSuplentes((s) => s.filter((id) => id !== jugadorId))
    setPicker(null)
  }

  function quitarSlot(slot) {
    setAsignaciones((a) => { const arr = [...a]; arr[slot] = null; return arr })
    setPicker(null)
  }

  function iniciarMover(slot) {
    setPicker(null)
    setMoviendo(slot)
  }

  function moverA(destino) {
    if (moviendo === null) return
    setAsignaciones((a) => {
      const arr = [...a]
      const tmp = arr[destino]
      arr[destino] = arr[moviendo]
      arr[moviendo] = tmp
      return arr
    })
    setMoviendo(null)
  }

  function agregarSuplente(jugadorId) {
    setAsignaciones((a) => a.map((id) => (id === jugadorId ? null : id)))
    setSuplentes((s) => (s.includes(jugadorId) ? s : [...s, jugadorId]))
    setPicker(null)
  }

  function quitarSuplente(id) {
    setSuplentes((s) => s.filter((x) => x !== id))
  }

  function limpiarTodo() {
    if (!confirm('¿Vaciar la convocatoria (titulares y suplentes)?')) return
    setAsignaciones(new Array(coords.length).fill(null))
    setSuplentes([])
    setMsg('')
  }

  function whatsapp() {
    const fmt = (id) => {
      const j = byId(id)
      if (!j) return null
      const cat = posACat(j.posicion)
      const ico = cat === 'POR' ? '🧤' : cat === 'DEF' ? '🛡️' : cat === 'MED' ? '⚙️' : '⚡'
      return `  ${ico} #${j.dorsal} ${j.nombre} (${cat})`
    }
    const lineasTit = idsEnCampo.map(fmt).filter(Boolean)
    const lineasSup = suplentes.map(fmt).filter(Boolean)
    const fechaFmt = fecha
      ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      : null
    const lineas = [
      `⚽ *CONVOCATORIA — FÚTBOL ${tipo}*${club ? `\n🏟️ ${club}` : ''}`,
      rival ? `🆚 Rival: *${rival}*` : null,
      fechaFmt ? `📅 ${fechaFmt}` : null,
      '',
      `⭐ *TITULARES (${lineasTit.length}/${MAX_TIT})*`,
      ...lineasTit,
      lineasSup.length ? '' : null,
      lineasSup.length ? `🔄 *SUPLENTES (${lineasSup.length}/${MAX_SUP})*` : null,
      ...lineasSup,
      '',
      `Total convocados: ${lineasTit.length + lineasSup.length} jugadores`,
      '——————————————',
      '_KickAndGo_ 🚀',
    ].filter((l) => l !== null)
    const texto = encodeURIComponent(lineas.join('\n'))
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  async function guardar() {
    setMsg('')
    if (idsEnCampo.length < MAX_TIT) { setMsg(`⚠️ Necesitas ${MAX_TIT} titulares en el campo`); return }
    if (!hayPortero) { setMsg('⚠️ Falta el portero (posición bajo palos)'); return }
    const empaqueta = (id, cat) => {
      const j = byId(id)
      return { id: j.id, nombre: j.nombre, dorsal: j.dorsal, posicion: j.posicion, cat }
    }
    const titularesOrdenados = asignaciones
      .map((id, i) => (id ? empaqueta(id, categoriaSlot(formacion, i)) : null))
      .filter(Boolean)
    try {
      await guardarConvocatoria({
        rival, fecha, formacion,
        titulares: titularesOrdenados,
        suplentes: suplentes.map((id) => empaqueta(id, posACat(byId(id)?.posicion))),
      }, eid)
      setMsg('✅ Convocatoria guardada')
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-extrabold">Convocatoria</h1>
          <p className="text-xs text-muted">{idsEnCampo.length + suplentes.length} / {MAX_TIT + MAX_SUP} convocados · Fútbol {tipo}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={limpiarTodo}>🧹 Limpiar</button>
          <button className="btn btn-outline" onClick={whatsapp}
            style={{ borderColor: '#25d366', color: '#25d366' }}
            title="Compartir convocatoria por WhatsApp">
            📲 WhatsApp
          </button>
          <button className="btn btn-primary" onClick={guardar}>✓ Confirmar</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted">Rival</label>
          <input className="field mt-1" value={rival} onChange={(e) => setRival(e.target.value)} placeholder="Próximo rival" />
        </div>
        <div>
          <label className="text-xs text-muted">Fecha</label>
          <input className="field mt-1" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted">Formación</label>
          <select className="field mt-1" value={formacion} onChange={(e) => cambiarFormacion(e.target.value)}>
            {Object.keys(formacionesPara(tipo)).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progreso de convocados */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-muted mb-1">
          <span>{idsEnCampo.length}/{MAX_TIT} titulares · {suplentes.length}/{MAX_SUP} suplentes</span>
          <span>{idsEnCampo.length + suplentes.length}/{MAX_TIT + MAX_SUP}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-white/5">
          <div style={{ width: `${(idsEnCampo.length / (MAX_TIT + MAX_SUP)) * 100}%`, background: '#2dd4bf' }} />
          <div style={{ width: `${(suplentes.length / (MAX_TIT + MAX_SUP)) * 100}%`, background: '#3b82f6' }} />
        </div>
      </div>

      {msg && <div className="text-xs mb-3 text-zinc-300">{msg}</div>}
      {moviendo !== null && (
        <div className="text-xs mb-3 font-bold" style={{ color: '#f59e0b' }}>
          🔄 Elige la posición destino para mover al jugador… <button className="underline ml-2" onClick={() => setMoviendo(null)}>Cancelar</button>
        </div>
      )}

      {jugadores.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No hay jugadores en la plantilla. Añádelos primero en <b className="text-cyan">Plantilla</b>.
        </div>
      ) : (
        <>
          {/* Pizarra */}
          <div className="card p-3 mb-4">
            <div className="ev2-pitch" style={{ borderRadius: 10, position: 'relative' }}>
              <svg className="ev2-pitch-lines" viewBox="0 0 160 100" preserveAspectRatio="none">
                <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                <circle cx="80" cy="50" r="13" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                <rect x="2" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
                <rect x="138" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
              </svg>
              {coords.map(([x, y], i) => {
                const jid = asignaciones[i]
                const j = jid ? byId(jid) : null
                const lesion = j ? lesActivas.find(l => l.jugador_id === j.id) : null
                const enModoMover = moviendo !== null
                const esOrigenMover = moviendo === i
                return (
                  <div key={i}
                    onClick={() => {
                      if (enModoMover) { moverA(i); return }
                      setPicker({ slot: i })
                    }}
                    className="ev2-player"
                    style={{
                      left: `${x}%`, top: `${y}%`, position: 'absolute', transform: 'translate(-50%,-50%)',
                      outline: esOrigenMover ? '2px solid #f59e0b' : enModoMover ? '2px dashed rgba(245,158,11,.5)' : 'none',
                      borderRadius: '50%',
                    }}>
                    {j ? (
                      <>
                        <Jersey num={j.dorsal} side="local" gk={i === 0} vista="camisetas" />
                        <div className="ev2-pname">{j.nombre.split(' ')[0]}</div>
                      </>
                    ) : (
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', border: '2px dashed rgba(255,255,255,.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'rgba(255,255,255,.5)',
                      }}>+</div>
                    )}
                    {!j && <div className="ev2-pname" style={{ fontSize: 9 }}>{rolSugeridoSlot(tipo, formacion, i)}</div>}
                    {lesion && <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 11 }}>🩺</div>}
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-muted mt-2">Toca una posición para asignar o cambiar jugador. Si ya tiene jugador, podrás moverlo o quitarlo.</p>
          </div>

          {/* Suplentes */}
          <div className="card p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-extrabold text-azul">🔄 Suplentes</span>
              <span className="text-xs text-muted">{suplentes.length}/{MAX_SUP}</span>
            </div>
            {suplentes.length === 0 ? (
              <div className="text-[11px] text-muted py-2">Vacío</div>
            ) : (
              <div className="space-y-1 mb-2">
                {suplentes.map((id) => {
                  const j = byId(id); if (!j) return null
                  return (
                    <div key={id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">#{j.dorsal} {j.nombre}</span>
                      <button className="text-[10px] text-muted hover:text-cyan" onClick={() => quitarSuplente(id)}>quitar</button>
                    </div>
                  )
                })}
              </div>
            )}
            {suplentes.length < MAX_SUP && (
              <button className="btn btn-outline text-xs w-full" onClick={() => setPicker({ modo: 'suplente' })}>+ Añadir suplente</button>
            )}
          </div>
        </>
      )}

      {picker && (
        <SlotPicker
          picker={picker}
          jugadores={jugadores}
          yaConvocado={yaConvocado}
          lesActivas={lesActivas}
          slotOcupado={picker.slot != null ? asignaciones[picker.slot] : null}
          rolSlot={picker.slot != null ? rolSugeridoSlot(tipo, formacion, picker.slot) : null}
          catSlot={picker.slot != null ? categoriaSlot(formacion, picker.slot) : null}
          onElegir={(id) => picker.modo === 'suplente' ? agregarSuplente(id) : asignarSlot(picker.slot, id)}
          onMover={picker.slot != null ? () => iniciarMover(picker.slot) : null}
          onQuitar={picker.slot != null && asignaciones[picker.slot] ? () => quitarSlot(picker.slot) : null}
          onCerrar={() => setPicker(null)}
        />
      )}
    </div>
  )
}

function SlotPicker({ picker, jugadores, yaConvocado, lesActivas, slotOcupado, rolSlot, catSlot, onElegir, onMover, onQuitar, onCerrar }) {
  const [busqueda, setBusqueda] = useState('')

  const sugeridos = useMemo(() => {
    if (!catSlot) return []
    return jugadores.filter(j => !yaConvocado(j.id) && posACat(j.posicion) === catSlot)
  }, [jugadores, catSlot])

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return []
    const q = busqueda.trim().toLowerCase()
    return jugadores.filter(j =>
      j.nombre.toLowerCase().includes(q) || String(j.dorsal).includes(q)
    )
  }, [jugadores, busqueda])

  function Fila({ j }) {
    const lesion = lesActivas.find(l => l.jugador_id === j.id)
    const cat = posACat(j.posicion)
    return (
      <button onClick={() => onElegir(j.id)}
        className="w-full flex items-center gap-3 p-2 rounded-lg border border-borde hover:bg-white/5 text-left">
        <span className="flex-1 text-sm">#{j.dorsal} {j.nombre}</span>
        {lesion && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>🩺 LES</span>
        )}
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/5">{cat}</span>
      </button>
    )
  }

  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card p-5" style={{ maxWidth: 440, width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(45,212,191,.3)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold">{picker.modo === 'suplente' ? 'Añadir suplente' : `Posición: ${rolSlot}`}</div>
          <button onClick={onCerrar} className="text-muted">✕</button>
        </div>

        {slotOcupado && (
          <div className="flex gap-2 mb-3">
            {onMover && <button className="btn btn-outline text-xs flex-1" onClick={onMover}>🔄 Mover a otra posición</button>}
            {onQuitar && <button className="btn btn-outline text-xs flex-1" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,.3)' }} onClick={onQuitar}>✕ Quitar</button>}
          </div>
        )}

        <input className="field mb-3" placeholder="Buscar otro jugador por nombre o dorsal…"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

        {busqueda.trim() ? (
          <div className="space-y-1.5">
            {resultados.length === 0 ? (
              <div className="text-xs text-muted text-center py-4">Sin resultados</div>
            ) : resultados.map(j => <Fila key={j.id} j={j} />)}
          </div>
        ) : (
          <>
            {catSlot && <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">Sugeridos para esta posición</div>}
            <div className="space-y-1.5">
              {sugeridos.length === 0 ? (
                <div className="text-xs text-muted text-center py-4">No hay jugadores disponibles de esta posición — usa el buscador.</div>
              ) : sugeridos.map(j => <Fila key={j.id} j={j} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
