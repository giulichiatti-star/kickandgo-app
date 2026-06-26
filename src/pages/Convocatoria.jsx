import { useEffect, useState } from 'react'
import { listarJugadores, posACat } from '../lib/jugadores'
import { guardarConvocatoria, ultimaConvocatoria } from '../lib/convocatorias'
import { getPerfil } from '../lib/perfil'
import { nTitulares, nSuplentes, formacionesPara, formacionDefecto } from '../lib/formaciones'
import { useEquipo } from '../contexts/EquipoContext'
import { listarLesiones } from '../lib/lesiones'
import { useOnboarding } from '../hooks/useOnboarding'
import OnboardingBanner from '../components/OnboardingBanner'

const CAT_COLOR = {
  POR: 'bg-dorado/15 text-dorado',
  DEF: 'bg-azul/15 text-azul',
  MED: 'bg-morado/15 text-morado',
  DEL: 'bg-rojo/15 text-rojo',
}

export default function Convocatoria() {
  const { paso, avanzar, saltar } = useOnboarding()
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [jugadores, setJugadores] = useState([])
  const [titulares, setTitulares] = useState([]) // ids
  const [suplentes, setSuplentes] = useState([]) // ids
  const [rival, setRival] = useState('')
  const [fecha, setFecha] = useState('')
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')
  const [tipo, setTipo] = useState('11')
  const [formacion, setFormacion] = useState('4-3-3')
  const [club, setClub] = useState('')
  const [lesActivas, setLesActivas] = useState([])
  const MAX_TIT = nTitulares(tipo)
  const MAX_SUP = nSuplentes(tipo)

  useEffect(() => {
    (async () => {
      try {
        const t = equipoActivo?.tipo_equipo || '11'
        setTipo(t); setClub(equipoActivo?.nombre || '')
        setFormacion(formacionDefecto(t))
        const [js, les] = await Promise.all([listarJugadores(eid), listarLesiones(eid).catch(() => [])])
        setJugadores(js)
        setLesActivas(les.filter(l => !l.alta))
        const ult = await ultimaConvocatoria(eid)
        if (ult) {
          setRival(ult.rival || '')
          setFecha(ult.fecha || '')
          if (ult.formacion) setFormacion(ult.formacion)
          setTitulares((ult.titulares || []).map((t) => t.id).filter(Boolean))
          setSuplentes((ult.suplentes || []).map((s) => s.id).filter(Boolean))
        }
      } catch (e) { setMsg(e.message) }
      finally { setCargando(false) }
    })()
  }, [eid])

  const estaConvocado = (id) => titulares.includes(id) || suplentes.includes(id)

  function toggle(id) {
    if (estaConvocado(id)) {
      setTitulares((t) => t.filter((x) => x !== id))
      setSuplentes((s) => s.filter((x) => x !== id))
    } else if (titulares.length < MAX_TIT) {
      setTitulares((t) => [...t, id])
      setMsg('')
    } else if (suplentes.length < MAX_SUP) {
      setSuplentes((s) => [...s, id])
      setMsg(`✅ ${MAX_TIT} titulares completos · este va a suplentes`)
    } else {
      setMsg(`⚠️ Máximo ${MAX_TIT + MAX_SUP} convocados`)
    }
  }

  function limpiarTodo() {
    if (!confirm('¿Vaciar la convocatoria (titulares y suplentes)?')) return
    setTitulares([]); setSuplentes([]); setMsg('')
  }

  function aBanca(id) {
    setTitulares((t) => t.filter((x) => x !== id))
    if (suplentes.length < MAX_SUP) setSuplentes((s) => [...s, id])
  }
  function aTitular(id) {
    if (titulares.length >= MAX_TIT) { setMsg(`⚠️ Ya tienes ${MAX_TIT} titulares`); return }
    setSuplentes((s) => s.filter((x) => x !== id))
    setTitulares((t) => [...t, id])
  }

  const byId = (id) => jugadores.find((j) => j.id === id)
  const hayPortero = titulares.some((id) => posACat(byId(id)?.posicion) === 'POR')

  function whatsapp() {
    const fmt = (id) => {
      const j = byId(id)
      if (!j) return null
      const cat = posACat(j.posicion)
      const ico = cat === 'POR' ? '🧤' : cat === 'DEF' ? '🛡️' : cat === 'MED' ? '⚙️' : '⚡'
      return `  ${ico} #${j.dorsal} ${j.nombre} (${cat})`
    }
    // Ordenar titulares por categoría: POR → DEF → MED → DEL
    const orden = { POR: 0, DEF: 1, MED: 2, DEL: 3 }
    const titOrdenados = [...titulares].sort((a, b) => {
      const ja = byId(a); const jb = byId(b)
      return (orden[posACat(ja?.posicion)] ?? 9) - (orden[posACat(jb?.posicion)] ?? 9)
    })
    const lineasTit = titOrdenados.map(fmt).filter(Boolean)
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
    if (titulares.length < MAX_TIT) { setMsg(`⚠️ Necesitas ${MAX_TIT} titulares`); return }
    if (!hayPortero) { setMsg('⚠️ Falta un portero entre los titulares'); return }
    const empaqueta = (id) => {
      const j = byId(id)
      return { id: j.id, nombre: j.nombre, dorsal: j.dorsal, posicion: j.posicion, cat: posACat(j.posicion) }
    }
    try {
      await guardarConvocatoria({
        rival, fecha, formacion,
        titulares: titulares.map(empaqueta),
        suplentes: suplentes.map(empaqueta),
      }, eid)
      setMsg('✅ Convocatoria guardada')
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  return (
    <div>
      {paso === 2 && (
        <OnboardingBanner
          paso={2}
          titulo="Selecciona titulares y guarda la convocatoria"
          descripcion="Con la convocatoria guardada, el mapa del partido en vivo cargará automáticamente a tus jugadores."
          onAvanzar={() => avanzar(3)}
          onSaltar={saltar}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold">Convocatoria</h1>
          <p className="text-xs text-muted">{titulares.length + suplentes.length} / {MAX_TIT + MAX_SUP} convocados · Fútbol {tipo}</p>
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
          <select className="field mt-1" value={formacion} onChange={(e) => setFormacion(e.target.value)}>
            {Object.keys(formacionesPara(tipo)).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progreso de convocados */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-muted mb-1">
          <span>{titulares.length}/{MAX_TIT} titulares · {suplentes.length}/{MAX_SUP} suplentes</span>
          <span>{titulares.length + suplentes.length}/{MAX_TIT + MAX_SUP}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-white/5">
          <div style={{ width: `${(titulares.length / (MAX_TIT + MAX_SUP)) * 100}%`, background: '#2dd4bf' }} />
          <div style={{ width: `${(suplentes.length / (MAX_TIT + MAX_SUP)) * 100}%`, background: '#3b82f6' }} />
        </div>
      </div>

      {msg && <div className="text-xs mb-3 text-zinc-300">{msg}</div>}

      {jugadores.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No hay jugadores en la plantilla. Añádelos primero en <b className="text-cyan">Plantilla</b>.
        </div>
      ) : (
        <>
          {/* Titulares + Suplentes */}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <Bloque titulo="⭐ Titulares" color="text-cyan" count={`${titulares.length}/${MAX_TIT}`}
              ids={titulares} byId={byId} accion="→ banca" onAccion={aBanca} />
            <Bloque titulo="🔄 Suplentes" color="text-azul" count={`${suplentes.length}/${MAX_SUP}`}
              ids={suplentes} byId={byId} accion="→ titular" onAccion={aTitular} />
          </div>

          {/* Plantel disponible */}
          <div className="card p-3">
            <div className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Plantel — toca para convocar</div>
            <div className="space-y-1.5">
              {jugadores.map((j) => {
                const cat = posACat(j.posicion)
                const conv = estaConvocado(j.id)
                const lesion = lesActivas.find(l => l.jugador_id === j.id)
                return (
                  <button key={j.id} onClick={() => toggle(j.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition ${
                      conv ? 'border-cyan/40 bg-cyan/5' : 'border-borde hover:bg-white/5'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-black ${
                      conv ? 'bg-cyan border-cyan text-black' : 'border-borde'}`}>{conv ? '✓' : ''}</div>
                    <span className="flex-1 text-sm">#{j.dorsal} {j.nombre}</span>
                    {lesion && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                        title={`Lesión activa: ${lesion.zona || lesion.tipo || 'sin detalle'}`}>
                        🩺 LES
                      </span>
                    )}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${CAT_COLOR[cat]}`}>{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Bloque({ titulo, color, count, ids, byId, accion, onAccion }) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-extrabold ${color}`}>{titulo}</span>
        <span className="text-xs text-muted">{count}</span>
      </div>
      {ids.length === 0 ? (
        <div className="text-[11px] text-muted py-2">Vacío</div>
      ) : (
        <div className="space-y-1">
          {ids.map((id) => {
            const j = byId(id); if (!j) return null
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">#{j.dorsal} {j.nombre}</span>
                <button className="text-[10px] text-muted hover:text-cyan" onClick={() => onAccion(id)}>{accion}</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
