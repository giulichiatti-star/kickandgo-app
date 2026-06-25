import { useEffect, useRef, useState } from 'react'
import { getPerfil, updatePerfil } from '../lib/perfil'
import '../rivinf.css'
import { getCompeticion, guardarCompeticion, parseTabla, parseGoleadores, parseCalendario } from '../lib/competicion'
import { listarJugadores, vaciarPlantilla } from '../lib/jugadores'
import { borrarTodosPartidos } from '../lib/partidos'
import { borrarTodasTarjetas } from '../lib/tarjetas'
import { borrarTodosEntrenos } from '../lib/entrenamientos'
import { supabase } from '../lib/supabase'
import { useEquipo } from '../contexts/EquipoContext'
import { suscribirPush, cancelarPush, tieneSuscripcion } from '../lib/push'

/* ── Guía rápida animada ── */
const PASOS_GUIA = [
  {
    num: '01',
    titulo: 'Nombre del club',
    desc: 'Escribe el nombre de tu equipo, tu nombre como entrenador y la temporada actual.',
    demo: () => (
      <div style={{width:'100%'}}>
        <div className="guia-field-label">Nombre del club</div>
        <div className="guia-field-mock">
          <span className="guia-typing-text">Llavaneres CF</span>
        </div>
        <div className="guia-field-label">Entrenador</div>
        <div className="guia-field-mock">
          <span className="guia-typing-text" style={{animationDelay:'.8s'}}>Borja Martínez</span>
        </div>
      </div>
    ),
  },
  {
    num: '02',
    titulo: 'Sube el escudo',
    desc: 'Pulsa "Subir escudo" y elige una imagen de tu dispositivo (máx ~600 KB). Se muestra en el inicio.',
    demo: () => (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
        <div className="guia-shield-anim">🛡️</div>
        <div className="guia-btn-mock cyan-pulse">📷 Subir escudo</div>
      </div>
    ),
  },
  {
    num: '03',
    titulo: 'Carga la clasificación',
    desc: 'Pega los datos de tu liga en CSV (copia desde la web de tu federación) o carga el archivo directo.',
    demo: () => (
      <div style={{width:'100%',background:'#0f0f11',borderRadius:8,padding:'8px 10px',border:'1px solid #3f3f46'}}>
        <div style={{fontSize:9,color:'#52525b',marginBottom:4,fontFamily:'monospace'}}>pos, equipo, PJ, PG, PE, PP, GF, GC, PTS</div>
        {['1, Vilassar Dalt, 29, 19, 5, 5, 68, 32, 62','2, Cabrils CE, 29, 18, 4, 7, 61, 38, 58','3, Llavaneres CF, 29, 17, 4, 8, 55, 31, 55','4, Arenys de Mar, 29, 15, 3, 11, 48, 40, 48'].map((l,i)=>(
          <div key={i} className="guia-csv-line">{l}</div>
        ))}
      </div>
    ),
  },
  {
    num: '04',
    titulo: 'Guarda y listo',
    desc: 'Pulsa "Guardar" — los datos aparecen al instante en Rivales, Clasificación y el Asistente IA.',
    demo: () => (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
        <div className="guia-check-anim">✓</div>
        <div style={{fontSize:10,color:'#34d399',fontWeight:700,textAlign:'center'}}>¡Datos guardados!</div>
        <div style={{fontSize:9,color:'#52525b',textAlign:'center'}}>Rivales y Asistente<br/>ya usan tus datos</div>
      </div>
    ),
  },
]

function GuiaRapida() {
  const [paso, setPaso] = useState(0)
  const [visible, setVisible] = useState(() => localStorage.getItem('guia_ajustes_ok') !== '1')
  const timer = useRef(null)

  useEffect(() => {
    if (!visible) return
    timer.current = setInterval(() => setPaso(p => (p + 1) % PASOS_GUIA.length), 4000)
    return () => clearInterval(timer.current)
  }, [visible])

  function ir(i) { setPaso(i); clearInterval(timer.current) }
  function cerrar() { setVisible(false); localStorage.setItem('guia_ajustes_ok','1') }

  if (!visible) return null
  const p = PASOS_GUIA[paso]
  const Demo = p.demo

  return (
    <div className="guia-wrap">
      <div className="guia-topbar"/>
      <div className="guia-inner">
        <div className="guia-header">
          <div className="guia-title">⚡ Guía de inicio rápido</div>
          <button className="guia-close" onClick={cerrar} title="Cerrar">×</button>
        </div>
        <div className="guia-content">
          <div className="guia-left">
            <div className="guia-paso-num">Paso {p.num} de 04</div>
            <div className="guia-paso-titulo">{p.titulo}</div>
            <div className="guia-paso-desc">{p.desc}</div>
          </div>
          <div className="guia-right">
            <Demo key={paso}/>
          </div>
        </div>
        <div className="guia-footer">
          <div className="guia-dots">
            {PASOS_GUIA.map((_,i) => (
              <div key={i} className={`guia-dot${i===paso?' active':''}`} onClick={()=>ir(i)}/>
            ))}
          </div>
          <div className="guia-nav">
            {paso > 0 && <button className="guia-nav-btn" onClick={()=>ir(paso-1)}>← Atrás</button>}
            {paso < PASOS_GUIA.length - 1
              ? <button className="guia-nav-btn primary" onClick={()=>ir(paso+1)}>Siguiente →</button>
              : <button className="guia-nav-btn primary" onClick={cerrar}>Entendido ✓</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Ajustes() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [form, setForm] = useState({
    entrenador: '', club_nombre: '', descripcion: '', tipo_equipo: '11', escudo_url: '', temporada: '',
  })
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [p, comp] = await Promise.all([getPerfil(), getCompeticion(eid)])
        setForm({
          entrenador: p.entrenador || '',
          club_nombre: p.club_nombre || '',
          descripcion: p.descripcion || '',
          tipo_equipo: p.tipo_equipo || '11',
          escudo_url: p.escudo_url || '',
          temporada: comp?.temporada || '',
        })
        setEmail(p.email || '')
      } catch (e) { setMsg('⚠️ ' + e.message) }
      finally { setCargando(false) }
    })()
  }, [eid])

  function subirEscudo(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 600 * 1024) { setMsg('⚠️ Imagen muy grande (máx ~600KB)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, escudo_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function guardar() {
    setMsg('')
    try {
      const { temporada, ...resto } = form
      await updatePerfil(resto)
      // temporada se guarda dentro de competicion para no necesitar migración
      const comp = await getCompeticion(eid)
      await guardarCompeticion({ ...(comp||{}), temporada }, eid)
      setMsg('✅ Guardado')
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Club y ajustes</h1>
      <GuiaRapida />

      {/* Escudo */}
      <div className="card p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-white/5 border border-borde grid place-items-center text-3xl overflow-hidden flex-shrink-0">
          {form.escudo_url ? <img src={form.escudo_url} className="w-full h-full object-cover" /> : '🛡️'}
        </div>
        <div>
          <label className="btn btn-outline text-xs cursor-pointer">
            📷 Subir escudo
            <input type="file" accept="image/*" className="hidden" onChange={subirEscudo} />
          </label>
          <div className="text-[10px] text-muted mt-1">Se muestra en el inicio · máx ~600KB</div>
        </div>
      </div>

      {/* Datos */}
      <div className="card p-4 space-y-3">
        <Campo label="Tu nombre (entrenador)" value={form.entrenador}
          onChange={(v) => setForm({ ...form, entrenador: v })} placeholder="Ej: Borja" />
        <Campo label="Nombre del club" value={form.club_nombre}
          onChange={(v) => setForm({ ...form, club_nombre: v })} placeholder="Ej: Llavaneres CF" />
        <Campo label="Descripción / categoría" value={form.descripcion}
          onChange={(v) => setForm({ ...form, descripcion: v })} placeholder="Ej: Llavaneres 3ª" />
        <Campo label="Temporada" value={form.temporada}
          onChange={(v) => setForm({ ...form, temporada: v })} placeholder="Ej: 2024/25" />
      </div>

      {/* Tipo de equipo */}
      <div className="card p-4">
        <div className="text-xs text-muted mb-2">Tipo de equipo</div>
        <div className="flex gap-2">
          {['11', '9', '7'].map((t) => (
            <button key={t} onClick={() => setForm({ ...form, tipo_equipo: t })}
              className={`flex-1 py-3 rounded-lg border text-sm font-bold transition ${
                form.tipo_equipo === t ? 'border-cyan bg-cyan/10 text-cyan' : 'border-borde text-muted'}`}>
              Fútbol {t}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-muted mt-2">
          Cada tipo tiene <b>su propia plantilla</b>. Cambiarlo aquí (o en Equipo) hace que toda la app
          muestre los jugadores, formaciones y convocatoria de ese equipo.
        </div>
      </div>

      <div className="text-xs text-muted">Cuenta: {email}</div>
      {msg && <div className="text-xs text-zinc-300">{msg}</div>}
      <button className="btn btn-primary w-full" onClick={guardar}>💾 Guardar</button>

      <LigaRivales />

      <NotificacionesPush />

      <ContactoSoporte />

      <ZonaPeligro />

      {/* Privacidad / GDPR */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-bold">🔒 Privacidad y datos</h2>
        <p className="text-[11px] text-muted leading-relaxed">
          Tus datos se almacenan de forma segura y solo tú puedes acceder a ellos.
          Puedes consultar nuestra{' '}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-cyan underline">
            política de privacidad
          </a>{' '}
          en cualquier momento.
        </p>
        <EliminarCuenta />
      </div>
    </div>
  )
}

function NotificacionesPush() {
  const [activo, setActivo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    tieneSuscripcion().then(setActivo)
  }, [])

  async function toggle() {
    setCargando(true); setMsg('')
    if (activo) {
      await cancelarPush()
      setActivo(false)
      setMsg('Notificaciones desactivadas')
    } else {
      const ok = await suscribirPush()
      if (ok) { setActivo(true); setMsg('✅ Notificaciones activadas') }
      else setMsg('⚠️ No se pudo activar. Revisa los permisos del navegador.')
    }
    setCargando(false)
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-sm font-bold">🔔 Notificaciones push</h2>
      <p className="text-[11px] text-muted leading-relaxed">
        Recibe alertas en tu dispositivo: partido próximo, jugadores en riesgo de sanción, altas médicas.
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs">{activo ? '✅ Activadas' : '❌ Desactivadas'}</span>
        <button className={`btn text-xs ${activo ? 'btn-outline' : 'btn-primary'}`}
          onClick={toggle} disabled={cargando}>
          {cargando ? 'Procesando…' : activo ? 'Desactivar' : 'Activar notificaciones'}
        </button>
      </div>
      {msg && <div className="text-[11px] text-muted">{msg}</div>}
    </div>
  )
}

function EliminarCuenta() {
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const [cargando, setCargando] = useState(false)

  async function eliminar() {
    if (!confirm) { setConfirm(true); return }
    setCargando(true)
    try {
      // Llamada a la función de Supabase que borra datos y desactiva la cuenta
      const { error } = await supabase.rpc('eliminar_cuenta_usuario')
      if (error) throw error
      await supabase.auth.signOut()
    } catch (e) {
      setMsg('⚠️ ' + e.message + ' — Escríbenos a lopezlucas290@gmail.com para tramitarlo manualmente.')
      setCargando(false); setConfirm(false)
    }
  }

  return (
    <div>
      {!confirm ? (
        <button className="btn btn-outline text-xs text-rojo border-rojo/30 hover:bg-rojo/10 w-full"
          onClick={() => setConfirm(true)}>
          🗑 Solicitar eliminación de mi cuenta y datos
        </button>
      ) : (
        <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-xs font-bold text-rojo">⚠️ Esta acción es irreversible</p>
          <p className="text-[11px] text-muted">Se eliminarán tu cuenta, jugadores, partidos, entrenamientos y todos los datos asociados.</p>
          <div className="flex gap-2">
            <button className="btn btn-outline flex-1 text-xs" onClick={() => setConfirm(false)} disabled={cargando}>Cancelar</button>
            <button className="btn btn-danger flex-1 text-xs" onClick={eliminar} disabled={cargando}>
              {cargando ? 'Eliminando…' : 'Confirmar — eliminar todo'}
            </button>
          </div>
        </div>
      )}
      {msg && <p className="text-[11px] text-muted mt-2">{msg}</p>}
    </div>
  )
}

function ZonaPeligro() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [conteo, setConteo] = useState(0)
  const [msg, setMsg] = useState('')
  const [borrándoStats, setBorrandoStats] = useState(false)

  async function recontar() {
    try {
      const js = await listarJugadores(eid)
      setConteo(js.length)
    } catch { /* noop */ }
  }
  useEffect(() => { recontar() }, [eid])

  const n = conteo

  async function vaciar() {
    if (!n) return
    if (!confirm(`¿Vaciar la plantilla y todas las estadísticas (partidos, tarjetas, entrenamientos)? No se puede deshacer.`)) return
    if (!confirm('Confirma: se borrará todo para empezar de cero.')) return
    setMsg('')
    try {
      await Promise.all([
        vaciarPlantilla(eid),
        borrarTodosPartidos(eid),
        borrarTodasTarjetas(eid),
        borrarTodosEntrenos(eid),
      ])
      setMsg('✅ Plantilla y estadísticas borradas. App en cero.')
      await recontar()
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  async function borrarStats() {
    if (!confirm('¿Borrar todos los partidos, tarjetas y entrenamientos? La plantilla no se toca.')) return
    setBorrandoStats(true); setMsg('')
    try {
      await Promise.all([borrarTodosPartidos(eid), borrarTodasTarjetas(eid), borrarTodosEntrenos(eid)])
      setMsg('✅ Estadísticas borradas. La plantilla sigue intacta.')
    } catch (e) { setMsg('⚠️ ' + e.message) }
    finally { setBorrandoStats(false) }
  }

  return (
    <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
      <div>
        <h2 className="text-base font-extrabold text-rojo">⚠️ Zona de peligro</h2>
        <p className="text-[11px] text-muted mt-1">
          Vacía la plantilla y borra <b className="text-white">todos los partidos, tarjetas y entrenamientos</b>. Úsalo para empezar una nueva temporada en blanco.
        </p>
      </div>
      {msg && <div className="text-xs text-zinc-300">{msg}</div>}
      <button className="btn btn-danger w-full" onClick={vaciar} disabled={!n}>
        🗑️ Vaciar equipo activo {n ? `(${n} jugadores)` : ''}
      </button>
      <div className="border-t border-borde pt-3">
        <p className="text-[11px] text-muted mb-2">Solo borrar estadísticas (partidos, tarjetas, entrenamientos) sin tocar la plantilla.</p>
        <button className="btn btn-danger w-full" onClick={borrarStats} disabled={borrándoStats}>
          {borrándoStats ? 'Borrando…' : '📊 Borrar todas las estadísticas'}
        </button>
      </div>
    </div>
  )
}

function LigaRivales() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [nombre, setNombre] = useState('')
  const [tablaTxt, setTablaTxt] = useState('')
  const [golesTxt, setGolesTxt] = useState('')
  const [calTxt, setCalTxt] = useState('')
  const [guard, setGuard] = useState(null) // {tabla, goleadores, calendario}
  const [msg, setMsg] = useState('')
  const [borrando, setBorrando] = useState(false)

  useEffect(() => {
    (async () => {
      const c = await getCompeticion(eid)
      if (c) {
        setNombre(c.nombre || ''); setGuard(c)
      }
    })()
  }, [eid])

  async function nuevaTemporada() {
    if (!confirm('¿Iniciar nueva temporada? Se borrarán los rivales, la clasificación, el calendario Y todos los partidos registrados. No se puede deshacer.')) return
    setBorrando(true); setMsg('')
    try {
      await Promise.all([
        guardarCompeticion({}, eid),
        borrarTodosPartidos(eid),
      ])
      setGuard(null); setNombre(''); setTablaTxt(''); setGolesTxt(''); setCalTxt('')
      setMsg('✅ Temporada reiniciada. Carga los nuevos datos de la liga.')
    } catch (e) { setMsg('⚠️ ' + e.message) }
    finally { setBorrando(false) }
  }

  const prevTabla = tablaTxt ? parseTabla(tablaTxt) : (guard?.tabla || [])
  const prevGoles = golesTxt ? parseGoleadores(golesTxt) : (guard?.goleadores || [])
  const prevCal = calTxt ? parseCalendario(calTxt) : (guard?.calendario || [])

  async function guardarLiga() {
    setMsg('')
    const comp = {
      nombre: nombre || 'Mi liga',
      tabla: tablaTxt ? parseTabla(tablaTxt) : (guard?.tabla || []),
      goleadores: golesTxt ? parseGoleadores(golesTxt) : (guard?.goleadores || []),
      calendario: calTxt ? parseCalendario(calTxt) : (guard?.calendario || []),
    }
    try {
      await guardarCompeticion(comp, eid)
      setGuard(comp); setTablaTxt(''); setGolesTxt(''); setCalTxt('')
      setMsg('✅ Liga guardada. Rivales y el Asistente ya usan tus datos.')
    } catch (e) {
      setMsg(/column .*competicion/.test(e.message || '')
        ? '⚠️ Falta crear la columna. Ejecuta supabase/migracion_competicion.sql en Supabase.'
        : '⚠️ ' + e.message)
    }
  }

  return (
    <div className="card p-4 space-y-4 mt-2">
      <div>
        <h2 className="text-base font-extrabold">🛡️ Información de la liga (rivales)</h2>
        <p className="text-[11px] text-muted mt-1">
          Carga por bloques en CSV o texto (una fila por línea, separadas por coma, ; o tabulador).
          Lo que pegues sustituye a los datos de ejemplo en <b className="text-cyan">Rivales</b> y el <b className="text-cyan">Asistente</b>.
        </p>
      </div>

      <Campo label="Nombre de la competición" value={nombre} onChange={setNombre} placeholder="Ej: Tercera Catalana · Grup 6" />

      <BloqueImport
        titulo="📊 Clasificación"
        hint={<>Columnas (separadas por coma, punto y coma o tabulador):<br/><b className="text-cyan">pos, equipo, PJ, PG, PE, PP, GF, GC, PTS</b><br/>También acepta formato FCF con columna DIF: <b className="text-cyan">pos, equipo, PJ, PG, PE, PP, GF, GC, DIF, PTS</b></>}
        value={tablaTxt} onChange={setTablaTxt}
        placeholder={"1, Vilassar Dalt, 29, 19, 5, 5, 68, 32, 36, 62\n2, Cabrils CE, 29, 18, 4, 7, 61, 38, 23, 58"}
        prev={prevTabla.map((t) => `${t.pos}. ${t.nom} — ${t.pts} pts (${t.pg}V ${t.pe}E ${t.pp}D)`)} />

      <BloqueImport
        titulo="⚽ Goleadores"
        hint={<>Columnas: <b className="text-cyan">nombre, club, goles, asistencias</b></>}
        value={golesTxt} onChange={setGolesTxt}
        placeholder={"Marc Roca, Vilassar Dalt, 18, 5\nJordi Casas, Cabrils CE, 16, 3"}
        prev={prevGoles.map((g) => `${g.nom} (${g.club}) — ${g.goles} goles`)} />

      <BloqueImport
        titulo="📅 Calendario"
        hint={<>Columnas: <b className="text-cyan">jornada, fecha, local, visitante, resultado</b> (jornada/fecha/resultado opcionales)</>}
        value={calTxt} onChange={setCalTxt}
        placeholder={"J1, 15/09, Arenys de Mar, Mataró CE\nJ2, 22/09, Cabrils CE, Arenys de Mar, 2-1"}
        prev={prevCal.map((c) => `${c.jornada ? 'J' + c.jornada + ' · ' : ''}${c.local} vs ${c.visitante}${c.resultado ? ' (' + c.resultado + ')' : ''}`)} />

      {msg && <div className="text-xs text-zinc-300">{msg}</div>}
      <button className="btn btn-primary w-full" onClick={guardarLiga}>💾 Guardar información de la liga</button>
      <p className="text-[10px] text-muted">El calendario automático desde fcf.cat necesitaría un servidor; por ahora se carga manual aquí.</p>

      {/* Borrar torneo / nueva temporada */}
      {guard && Object.keys(guard).filter(k=>k!=='temporada').some(k=>Array.isArray(guard[k])&&guard[k].length) && (
        <div className="rounded-xl p-3 space-y-2 mt-2" style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.2)'}}>
          <div className="text-xs font-bold text-rojo">🔄 Iniciar nueva temporada</div>
          <p className="text-[11px] text-muted">Borra los rivales, clasificación, calendario <b className="text-white">y todos los partidos</b> registrados. Úsalo al empezar una nueva temporada.</p>
          <button className="btn btn-danger w-full text-xs" onClick={nuevaTemporada} disabled={borrando}>
            {borrando ? 'Borrando…' : '🗑️ Borrar torneo y partidos — nueva temporada'}
          </button>
        </div>
      )}
    </div>
  )
}

function BloqueImport({ titulo, hint, value, onChange, placeholder, prev }) {
  function cargarCSV(e) {
    const f = e.target.files?.[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target.result)
    reader.readAsText(f, 'UTF-8')
    e.target.value = ''
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-bold">{titulo}</label>
        <div className="flex items-center gap-2">
          {prev.length > 0 && <span className="text-[10px] text-cyan">{prev.length} cargados</span>}
          <label className="text-[10px] px-2 py-1 rounded-lg border border-borde text-muted hover:text-white hover:border-cyan transition cursor-pointer">
            📎 CSV
            <input type="file" accept=".csv,.txt" className="hidden" onChange={cargarCSV} />
          </label>
        </div>
      </div>
      <div className="text-[10px] text-muted mb-1.5 leading-relaxed">{hint}</div>
      <textarea className="field h-24 font-mono text-[11px]" value={value}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {prev.length > 0 && (
        <div className="mt-2 max-h-28 overflow-y-auto space-y-0.5">
          {prev.slice(0, 8).map((l, i) => <div key={i} className="text-[11px] text-muted">· {l}</div>)}
          {prev.length > 8 && <div className="text-[10px] text-muted">…y {prev.length - 8} más</div>}
        </div>
      )}
    </div>
  )
}

function Campo({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

const MOTIVOS = ['Consulta general', 'Error / bug', 'Mejora o sugerencia', 'Otro']

function ContactoSoporte() {
  const [emailC, setEmailC] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const [texto, setTexto] = useState('')
  const [img, setImg] = useState(null)
  const [imgName, setImgName] = useState('')
  const [enviado, setEnviado] = useState(false)

  function selImg(e) {
    const f = e.target.files?.[0]; if (!f) return
    setImgName(f.name)
    const reader = new FileReader()
    reader.onload = ev => setImg(ev.target.result)
    reader.readAsDataURL(f)
  }

  function enviar() {
    const subject = encodeURIComponent(`[Kick&Go] ${motivo}`)
    const body = encodeURIComponent(
      `De: ${emailC || '(no indicado)'}\nMotivo: ${motivo}\n\n${texto}` +
      (imgName ? `\n\n[Adjunto: ${imgName} — adjunta la imagen manualmente si tu cliente de correo no la incluye]` : '')
    )
    window.open(`mailto:kickandgoapp@gmail.com?subject=${subject}&body=${body}`, '_blank')
    setEnviado(true)
    setTimeout(() => setEnviado(false), 4000)
  }

  return (
    <div className="card p-4 space-y-3">
      <div>
        <h2 className="text-base font-extrabold">💬 Contacto y soporte</h2>
        <p className="text-[11px] text-muted mt-1">Consultas, dudas, mejoras, errores — escríbenos aquí.</p>
      </div>

      <div>
        <label className="text-xs text-muted">Tu email (para responderte)</label>
        <input className="field mt-1" type="email" placeholder="tu@email.com"
          value={emailC} onChange={e => setEmailC(e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-muted">Motivo</label>
        <select className="field mt-1" value={motivo} onChange={e => setMotivo(e.target.value)}>
          {MOTIVOS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted">Descripción</label>
        <textarea className="field mt-1 h-24 resize-none" placeholder="Explícanos qué pasó o qué mejorarías…"
          value={texto} onChange={e => setTexto(e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-muted block mb-1">Adjuntar imagen (opcional)</label>
        <label className="btn btn-outline text-xs cursor-pointer">
          📎 {imgName || 'Seleccionar imagen'}
          <input type="file" accept="image/*" className="hidden" onChange={selImg} />
        </label>
        {img && <img src={img} alt="preview" className="mt-2 rounded-lg max-h-32 object-contain border border-borde" />}
      </div>

      {enviado && (
        <div className="text-xs rounded-lg p-2.5" style={{background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',color:'#34d399'}}>
          ✅ Se abrió tu cliente de correo. Si adjuntaste imagen, añádela manualmente al email.
        </div>
      )}

      <button className="btn btn-primary w-full" onClick={enviar} disabled={!texto.trim()}>
        ✉️ Abrir correo y enviar
      </button>
    </div>
  )
}
