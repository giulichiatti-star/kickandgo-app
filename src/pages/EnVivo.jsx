import { useEffect, useRef, useState } from 'react'
import '../ev2.css'
import { ultimaConvocatoria } from '../lib/convocatorias'
import { guardarPartido } from '../lib/partidos'
import { getPerfil } from '../lib/perfil'
import { clasificarVoz } from '../lib/voz'
import { ordenarTitulares } from '../lib/formaciones'
import Jersey from '../components/Jersey'

// Formaciones HORIZONTALES (x = profundidad, nuestra portería a la izquierda)
const FORM_H_11 = {
  '4-3-3': [[6,50],[16,16],[16,39],[16,61],[16,84],[28,28],[28,50],[28,72],[42,20],[42,50],[42,80]],
  '4-4-2': [[6,50],[16,16],[16,39],[16,61],[16,84],[28,16],[28,39],[28,61],[28,84],[42,36],[42,64]],
  '4-2-3-1': [[6,50],[16,16],[16,39],[16,61],[16,84],[26,38],[26,62],[40,22],[40,50],[40,78],[48,50]],
  '3-5-2': [[6,50],[16,28],[16,50],[16,72],[28,12],[28,34],[28,50],[28,66],[28,88],[42,38],[42,62]],
  '5-3-2': [[6,50],[16,12],[16,31],[16,50],[16,69],[16,88],[28,28],[28,50],[28,72],[42,38],[42,62]],
}
const FORM_H_7 = {
  '2-3-1': [[8,50],[20,30],[20,70],[32,25],[32,50],[32,75],[46,50]],
  '3-2-1': [[8,50],[20,25],[20,50],[20,75],[34,35],[34,65],[48,50]],
  '2-2-2': [[8,50],[20,33],[20,67],[34,33],[34,67],[48,33],[48,67]],
  '1-3-2': [[8,50],[20,50],[34,25],[34,50],[34,75],[48,35],[48,65]],
  '3-1-2': [[8,50],[20,25],[20,50],[20,75],[34,50],[48,35],[48,65]],
}
const FORM_H_9 = {
  '3-3-2': [[7,50],[18,25],[18,50],[18,75],[30,25],[30,50],[30,75],[44,35],[44,65]],
  '3-2-3': [[7,50],[18,25],[18,50],[18,75],[30,38],[30,62],[44,25],[44,50],[44,75]],
  '2-4-2': [[7,50],[18,33],[18,67],[30,18],[30,40],[30,60],[30,82],[44,35],[44,65]],
  '2-3-3': [[7,50],[18,33],[18,67],[30,28],[30,50],[30,72],[44,25],[44,50],[44,75]],
  '3-1-3-1': [[7,50],[18,25],[18,50],[18,75],[28,50],[38,28],[38,50],[38,72],[48,50]],
}
const formsDe = (tipo) => (tipo === '7' ? FORM_H_7 : tipo === '9' ? FORM_H_9 : FORM_H_11)
const defForm = (tipo) => (tipo === '7' ? '2-3-1' : tipo === '9' ? '3-3-2' : '4-3-3')
const defFormRival = (tipo) => (tipo === '7' ? '3-2-1' : tipo === '9' ? '3-3-2' : '4-4-2')

const RIVAL_DEMO = [1,4,2,5,3,6,8,10,7,9,11].map((d, i) => ({ id: 'r' + i, dorsal: d, nombre: 'Rival ' + d, cat: i === 0 ? 'POR' : 'MED' }))

const QUICK = [
  { tipo: 'corner', ico: '⛳', lbl: 'Córner\na favor' },
  { tipo: 'corner-rival', ico: '🚩', lbl: 'Córner\nrival' },
  { tipo: 'falta-favor', ico: '🟢', lbl: 'Falta\na favor' },
  { tipo: 'falta', ico: '🔴', lbl: 'Falta\nen contra' },
  { tipo: 'tiro', ico: '🎯', lbl: 'Tiro' },
  { tipo: 'robo', ico: '🔄', lbl: 'Robo' },
  { tipo: 'perdida', ico: '📤', lbl: 'Pérdida' },
  { tipo: 'offside', ico: '🚩', lbl: 'F. juego' },
]
const RADIAL = [
  { tipo: 'gol', ico: '⚽', lbl: 'Gol' },
  { tipo: 'asistencia', ico: '🅰️', lbl: 'Asist.' },
  { tipo: 'tiro', ico: '🎯', lbl: 'Tiro' },
  { tipo: 'amarilla', ico: '🟨', lbl: 'Amarilla' },
  { tipo: 'roja', ico: '🟥', lbl: 'Roja' },
  { tipo: 'falta', ico: '⚠️', lbl: 'Falta' },
]
const ICONO_MARCA = { gol: '⚽', asistencia: '🅰️', amarilla: '🟨', roja: '🟥', cambio: '🔄' }
const META = {
  gol: { label: 'Gol' }, 'gol-rival': { label: 'Gol rival' }, asistencia: { label: 'Asistencia' },
  amarilla: { label: 'Amarilla' }, roja: { label: 'Roja' }, tiro: { label: 'Tiro' },
  corner: { label: 'Córner' }, 'corner-rival': { label: 'Córner rival' },
  'falta-favor': { label: 'Falta a favor' }, falta: { label: 'Falta en contra' },
  robo: { label: 'Robo' }, perdida: { label: 'Pérdida' }, offside: { label: 'Fuera de juego' }, cambio: { label: 'Cambio' },
}
function mmss(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

export default function EnVivo() {
  const [titulares, setTitulares] = useState([])
  const [suplentes, setSuplentes] = useState([])
  const [rival, setRival] = useState('Rival')
  const [club, setClub] = useState('Nuestro equipo')
  const [escudo, setEscudo] = useState('')
  const [tipo, setTipo] = useState('11')
  const [formacion, setFormacion] = useState('4-3-3')
  const [formacionRival, setFormacionRival] = useState('4-4-2')
  const [vista, setVista] = useState('camisetas')
  const [tab, setTab] = useState('partido')
  const [gf, setGf] = useState(0)
  const [gc, setGc] = useState(0)
  const [seg, setSeg] = useState(0)
  const [corriendo, setCorriendo] = useState(false)
  const [eventos, setEventos] = useState([])
  const [marks, setMarks] = useState({})
  const [sel, setSel] = useState(null) // {id,dorsal,nombre}
  const [escuchando, setEscuchando] = useState(false)
  const [oido, setOido] = useState('')
  const [saleId, setSaleId] = useState('')
  const [entraId, setEntraId] = useState('')
  const [saleRival, setSaleRival] = useState('')
  const [entraRival, setEntraRival] = useState('')
  const [notas, setNotas] = useState('')
  const [stats, setStats] = useState({ tiros: 0, corners: 0, faltas: 0, amarillas: 0 })
  const timer = useRef(null), recRef = useRef(null), escRef = useRef(false), titRef = useRef([])
  titRef.current = titulares

  useEffect(() => {
    (async () => {
      const c = await ultimaConvocatoria()
      if (c) {
        setTitulares((c.titulares || []).map((t) => ({ ...t })))
        setSuplentes((c.suplentes || []).map((t) => ({ ...t })))
        setRival(c.rival || 'Rival')
      }
      try {
        const p = await getPerfil()
        if (p?.club_nombre) setClub(p.club_nombre)
        if (p?.escudo_url) setEscudo(p.escudo_url)
        const t = p?.tipo_equipo || '11'
        setTipo(t); setFormacion(c?.formacion?.includes('-') ? c.formacion : defForm(t))
        setFormacionRival(defFormRival(t))
      } catch {}
    })()
  }, [])

  useEffect(() => {
    if (corriendo) timer.current = setInterval(() => setSeg((s) => s + 1), 1000)
    else clearInterval(timer.current)
    return () => clearInterval(timer.current)
  }, [corriendo])
  useEffect(() => () => { try { recRef.current?.stop() } catch {} }, [])

  /* Auto-activar voz cuando se conecta un micrófono o auriculares con mic */
  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return
    let prevMics = 0
    const checkMics = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const mics = devices.filter((d) => d.kind === 'audioinput' && d.deviceId !== 'default').length
        if (mics > prevMics && !escRef.current) {
          // Se conectó un mic/auricular — activar voz automáticamente
          toggleVoz()
        } else if (mics < prevMics && escRef.current) {
          // Se desconectó — parar
          escRef.current = false; try { recRef.current?.stop() } catch {}
          setEscuchando(false)
        }
        prevMics = mics
      } catch {}
    }
    navigator.mediaDevices.enumerateDevices().then((d) => {
      prevMics = d.filter((x) => x.kind === 'audioinput' && x.deviceId !== 'default').length
    }).catch(() => {})
    navigator.mediaDevices.addEventListener('devicechange', checkMics)
    return () => navigator.mediaDevices.removeEventListener('devicechange', checkMics)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const min = Math.floor(seg / 60)

  // Posiciones de cancha
  const coords = formsDe(tipo)[formacion] || Object.values(formsDe(tipo))[0]
  const puntosLocal = ordenarTitulares(titulares).slice(0, coords.length).map((j, i) => ({
    ...j, x: coords[i][0], y: coords[i][1], gk: i === 0, side: 'local',
  }))
  const rivalForm = formsDe(tipo)[formacionRival] || Object.values(formsDe(tipo))[0]
  const puntosRival = RIVAL_DEMO.slice(0, rivalForm.length).map((j, i) => ({
    ...j, x: 100 - rivalForm[i][0], y: rivalForm[i][1], gk: i === 0, side: 'rival',
  }))

  function bump(s) { setStats((p) => ({ ...p, [s]: (p[s] || 0) + 1 })) }

  function registrar(tipoEv, jug) {
    const ev = { min, tipo: tipoEv, icon: ICONO_MARCA[tipoEv] || '•', label: (META[tipoEv]?.label || tipoEv), jugador: jug ? `#${jug.dorsal} ${jug.nombre}` : null }
    setEventos((e) => [ev, ...e])
    if (tipoEv === 'gol') { setGf((g) => g + 1); bump('tiros') }
    if (tipoEv === 'gol-rival') setGc((g) => g + 1)
    if (tipoEv === 'tiro') bump('tiros')
    if (tipoEv === 'corner') bump('corners')
    if (tipoEv === 'falta' || tipoEv === 'falta-favor') bump('faltas')
    if (tipoEv === 'amarilla') bump('amarillas')
    if (jug && ICONO_MARCA[tipoEv]) setMarks((m) => ({ ...m, [jug.dorsal]: [...(m[jug.dorsal] || []), ICONO_MARCA[tipoEv]] }))
    // doble amarilla = roja
    if (tipoEv === 'amarilla' && jug) {
      const ya = eventos.filter((x) => x.tipo === 'amarilla' && x.jugador === ev.jugador).length
      if (ya >= 1) {
        setEventos((e) => [{ min, tipo: 'roja', icon: '🟥', label: 'Roja (doble amarilla)', jugador: ev.jugador }, ...e])
        setMarks((m) => ({ ...m, [jug.dorsal]: [...(m[jug.dorsal] || []), '🟥'] }))
      }
    }
    setSel(null)
  }

  function cambio() {
    const sale = titulares.find((j) => j.id === saleId)
    const entra = suplentes.find((j) => j.id === entraId)
    if (!sale || !entra) return
    setTitulares((t) => t.map((j) => (j.id === saleId ? entra : j)))
    setSuplentes((s) => s.map((j) => (j.id === entraId ? sale : j)))
    setEventos((e) => [{ min, tipo: 'cambio', icon: '🔄', label: 'Cambio', jugador: `Sale ${sale.nombre} · Entra ${entra.nombre}` }, ...e])
    setMarks((m) => ({ ...m, [entra.dorsal]: [...(m[entra.dorsal] || []), '🔄'] }))
    setSaleId(''); setEntraId('')
  }

  function cambioRival() {
    if (!saleRival.trim() || !entraRival.trim()) return
    setEventos((e) => [{ min, tipo: 'cambio-rival', icon: '🔄', label: `Cambio ${rival}`, jugador: `Sale #${saleRival} · Entra #${entraRival}` }, ...e])
    setSaleRival(''); setEntraRival('')
  }

  // Voz
  function toggleVoz() {
    if (escuchando) { escRef.current = false; try { recRef.current?.stop() } catch {} setEscuchando(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Tu navegador no soporta voz (usa Chrome/Android)'); return }
    const rec = new SR(); rec.lang = 'es-ES'; rec.continuous = true; rec.interimResults = false
    rec.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) { const txt = e.results[i][0].transcript; setOido(txt); const r = clasificarVoz(txt, titRef.current, club, rival); if (r) registrar(r.tipo, r.jugador) } }
    rec.onend = () => { if (escRef.current) { try { rec.start() } catch {} } }
    recRef.current = rec; try { rec.start(); escRef.current = true; setEscuchando(true) } catch {}
  }

  async function finalizar() {
    if (!confirm('¿Finalizar y guardar el partido?')) return
    try {
      await guardarPartido({ rival, gf, gc, formacion, notas_entrenador: notas, eventos: eventos.map((e) => ({ min: e.min, tipo: e.tipo, label: e.label, jugador: e.jugador })) })
      setCorriendo(false); alert('✅ Partido guardado en Informes')
    } catch (e) { alert('⚠️ ' + e.message) }
  }

  const Player = ({ p }) => {
    const isSel = sel?.id === p.id
    const ms = marks[p.dorsal] || []
    return (
      <div className={`ev2-player${isSel ? ' sel' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}
        onClick={() => p.side === 'local' && setSel(isSel ? null : { id: p.id, dorsal: p.dorsal, nombre: p.nombre })}>
        {ms.length > 0 && <div className="ev2-pmarks">{ms.map((m, k) => <span key={k} className="ev2-pmark">{m}</span>)}</div>}
        <Jersey num={p.dorsal} side={p.side} gk={p.gk} vista={vista} />
        <div className="ev2-pname">{(p.nombre || '').split(' ')[0]}</div>
      </div>
    )
  }

  return (
    <div className="ev2-wrap" style={{ margin: '-20px -16px' }}>
      {/* TOPBAR */}
      <div className="ev2-topbar">
        <div className="ev2-logo"><div className="ev2-logo-mark">K</div><div className="ev2-logo-txt">KICK<br />AND <span>GO</span></div></div>
        <div className="ev2-scoreboard">
          <div className="ev2-team-block rt"><div className="ev2-tname">{club}</div><div className="ev2-tsub">Local</div></div>
          <div className="ev2-shield">{escudo ? <img src={escudo} alt="" /> : '🛡️'}</div>
          <div className="ev2-score-center">
            <div className="ev2-score-big">{gf} - {gc}</div>
            <div className="ev2-clock2">{mmss(seg)}</div>
            <div className="ev2-period">{corriendo ? 'En juego' : seg ? 'Pausado' : 'No iniciado'}</div>
          </div>
          <div className="ev2-shield">⚫</div>
          <div className="ev2-team-block"><div className="ev2-tname">{rival}</div><div className="ev2-tsub">Visitante</div></div>
        </div>
        <div className="ev2-actions">
          <button className="ev2-abtn" onClick={() => setCorriendo((c) => !c)}>{corriendo ? '⏸' : '▶'}<small>{corriendo ? 'PAUSA' : 'INICIAR'}</small></button>
          <button className={`ev2-abtn voice${escuchando ? ' on' : ''}`} onClick={toggleVoz}>🎙️<small>VOZ</small></button>
          <button className="ev2-abtn danger" onClick={finalizar}>⏹<small>FIN</small></button>
        </div>
      </div>

      {/* TABS */}
      <div className="ev2-tabbar">
        {['partido', 'alineaciones', 'estadisticas'].map((t) => (
          <div key={t} className={`ev2-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t.toUpperCase()}</div>
        ))}
      </div>

      <div className="ev2-grid">
        {/* COLUMNA CENTRAL */}
        <div>
          {tab === 'partido' && (
            <>
              {/* Chips formación nuestra */}
              <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-cyan uppercase shrink-0 pr-1">{club.split(' ')[0]}</span>
                {Object.keys(formsDe(tipo)).map((f) => (
                  <button key={f} onClick={() => {
                    if (f !== formacion) {
                      setFormacion(f)
                      setEventos((ev) => [{ min, tipo: 'formacion', icon: '🔀', label: `Cambio de formación → ${f}`, jugador: null }, ...ev])
                    }
                  }}
                    className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${formacion === f ? 'border-cyan bg-cyan/10 text-cyan' : 'border-borde text-muted'}`}>{f}</button>
                ))}
              </div>
              {/* Chips formación rival */}
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-rojo uppercase shrink-0 pr-1">{rival.split(' ')[0]}</span>
                {Object.keys(formsDe(tipo)).map((f) => (
                  <button key={f} onClick={() => {
                    if (f !== formacionRival) {
                      setFormacionRival(f)
                      setEventos((ev) => [{ min, tipo: 'formacion-rival', icon: '🔀', label: `${rival} cambia a ${f}`, jugador: null }, ...ev])
                    }
                  }}
                    className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${formacionRival === f ? 'border-rojo bg-rojo/10 text-rojo' : 'border-borde text-muted'}`}>{f}</button>
                ))}
              </div>
              {/* CANCHA */}
              <div className="ev2-pitch-wrap">
                <div className="ev2-pitch">
                  <svg className="ev2-pitch-lines" viewBox="0 0 160 100" preserveAspectRatio="none">
                    <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                    <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                    <circle cx="80" cy="50" r="13" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                    <rect x="2" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
                    <rect x="138" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
                  </svg>
                  <div className="ev2-pname-banner l">{club.toUpperCase()}</div>
                  <div className="ev2-form-chip l">{formacion}</div>
                  <div className="ev2-form-chip r">{formacionRival}</div>
                  <div className="ev2-pname-banner r">{rival.toUpperCase()}</div>
                  {puntosLocal.map((p) => <Player key={p.id} p={p} />)}
                  {puntosRival.map((p) => <Player key={p.id} p={p} />)}
                </div>
              </div>

              {/* Fila acciones + radial */}
              <div className="ev2-row3">
                {/* Acciones rápidas */}
                <div className="ev2-rail-card" style={{ margin: 0 }}>
                  <div className="ev2-rail-h">Acciones rápidas del equipo</div>
                  <div className="ev2-quick-grid">
                    {QUICK.map((q) => (
                      <div key={q.tipo} className="ev2-quick-btn" onClick={() => registrar(q.tipo === 'corner-rival' ? 'corner-rival' : q.tipo, null)}>
                        <div className="ev2-quick-ico">{q.ico}</div>
                        <div className="ev2-quick-lbl">{q.lbl.split('\n').map((l, i) => <div key={i}>{l}</div>)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="ev2-rail-h" style={{ marginTop: 14 }}>Modo voz</div>
                  <button className={`ev2-abtn voice${escuchando ? ' on' : ''}`} style={{ width: '100%', flexDirection: 'row', gap: 8 }} onClick={toggleVoz}>🎙️ {escuchando ? 'Escuchando…' : 'Activar voz'}</button>
                  {escuchando && oido && <div className="text-[11px] text-muted italic mt-2">"{oido}"</div>}
                </div>

                {/* Radial jugador */}
                <div className="ev2-rail-card" style={{ margin: 0 }}>
                  <div className="ev2-rail-h" style={{ justifyContent: 'center' }}>{sel ? `#${sel.dorsal} ${sel.nombre}` : 'Selecciona un jugador'}</div>
                  {sel ? (
                    <div className="ev2-radial">
                      <div className="ev2-radial-center"><div className="n">{sel.dorsal}</div><div className="nm">{(sel.nombre || '').split(' ')[0]}</div></div>
                      {RADIAL.map((a, i) => {
                        const ang = (-90 + i * (360 / RADIAL.length)) * Math.PI / 180
                        const R = 78
                        return (
                          <div key={a.tipo} className="ev2-ritem" style={{ left: `calc(50% + ${Math.cos(ang) * R}px)`, top: `calc(50% + ${Math.sin(ang) * R}px)` }}
                            onClick={() => registrar(a.tipo, sel)}>
                            <div className="ico">{a.ico}</div><div className="lbl">{a.lbl}</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : <div className="ev2-radial-empty">Toca un jugador en la cancha para registrar su acción.</div>}
                </div>
              </div>
            </>
          )}

          {tab === 'alineaciones' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="ev2-rail-card" style={{ margin: 0 }}>
                <div className="ev2-rail-h">{club}</div>
                {titulares.map((j, i) => <div key={j.id} className="flex items-center gap-2 py-1.5 border-b border-borde text-sm"><span className="w-6 h-6 rounded-full grid place-items-center text-xs font-black" style={{ background: i === 0 ? '#8b5cf6' : '#1c8043', color: '#fff' }}>{j.dorsal}</span>{j.nombre}</div>)}
              </div>
              <div className="ev2-rail-card" style={{ margin: 0 }}>
                <div className="ev2-rail-h">Suplentes</div>
                {suplentes.length ? suplentes.map((j) => <div key={j.id} className="flex items-center gap-2 py-1.5 border-b border-borde text-sm"><span className="w-6 h-6 rounded-full grid place-items-center text-xs font-black bg-white/10">{j.dorsal}</span>{j.nombre}</div>) : <div className="text-xs text-muted">Sin suplentes.</div>}
              </div>
            </div>
          )}

          {tab === 'estadisticas' && (
            <div className="ev2-rail-card" style={{ margin: 0 }}>
              <div className="ev2-rail-h">📊 Estadísticas en vivo</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Tiros', stats.tiros, '#3b82f6'], ['Córners', stats.corners, '#2dd4bf'], ['Faltas', stats.faltas, '#f59e0b'], ['Amarillas', stats.amarillas, '#8b5cf6']].map(([l, v, c]) => (
                  <div key={l} className="card p-3"><div className="text-2xl font-black" style={{ color: c }}>{v}</div><div className="text-[10px] text-muted">{l}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RAIL DERECHO */}
        <div>
          {/* Vista */}
          <div className="ev2-rail-card">
            <div className="ev2-rail-h">Vista de jugadores</div>
            <div className="ev2-vista">
              {[['camisetas', '👕', 'Camiseta'], ['chapas', '⬤', 'Chapa'], ['escudo', '🛡️', 'Escudo']].map(([v, ic, l]) => (
                <div key={v} className={`ev2-vopt${vista === v ? ' active' : ''}`} onClick={() => setVista(v)}><span style={{ fontSize: 16 }}>{ic}</span>{l}</div>
              ))}
            </div>
          </div>

          {/* Cambios nuestro equipo */}
          <div className="ev2-rail-card">
            <div className="ev2-rail-h">🔄 Cambio — {club}</div>
            <div className="text-[10px] text-rojo font-bold mb-1">SALE</div>
            <select className="field mb-2" value={saleId} onChange={(e) => setSaleId(e.target.value)}>
              <option value="">— titular —</option>
              {titulares.map((j) => <option key={j.id} value={j.id}>#{j.dorsal} {j.nombre}</option>)}
            </select>
            <div className="text-center text-muted text-sm mb-1">↓</div>
            <div className="text-[10px] text-cyan font-bold mb-1">ENTRA</div>
            <select className="field mb-2" value={entraId} onChange={(e) => setEntraId(e.target.value)}>
              <option value="">— suplente —</option>
              {suplentes.map((j) => <option key={j.id} value={j.id}>#{j.dorsal} {j.nombre}</option>)}
            </select>
            <button className="btn btn-primary w-full text-xs" onClick={cambio} disabled={!saleId || !entraId}>Confirmar cambio</button>
          </div>

          {/* Cambios rival */}
          <div className="ev2-rail-card">
            <div className="ev2-rail-h">🔄 Cambio — {rival}</div>
            <div className="text-[10px] text-rojo font-bold mb-1">SALE dorsal</div>
            <input
              className="field mb-2" type="number" min={1} max={99}
              placeholder="Nº dorsal sale"
              value={saleRival} onChange={(e) => setSaleRival(e.target.value)}
            />
            <div className="text-center text-muted text-sm mb-1">↓</div>
            <div className="text-[10px] text-cyan font-bold mb-1">ENTRA dorsal</div>
            <input
              className="field mb-2" type="number" min={1} max={99}
              placeholder="Nº dorsal entra"
              value={entraRival} onChange={(e) => setEntraRival(e.target.value)}
            />
            <button className="btn btn-outline w-full text-xs" style={{ borderColor: 'rgba(239,68,68,.4)', color: '#f87171' }} onClick={cambioRival} disabled={!saleRival || !entraRival}>Registrar cambio rival</button>
          </div>

          {/* Notas del entrenador */}
          <div className="ev2-rail-card">
            <div className="ev2-rail-h">📝 Notas del entrenador</div>
            <textarea
              className="field text-xs"
              rows={4}
              placeholder="Observaciones durante el partido: táctica, lesiones, rendimiento, instrucciones…"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
            <div className="text-[10px] text-muted mt-1">Se guardan al finalizar el partido.</div>
          </div>

          {/* Eventos */}
          <div className="ev2-rail-card">
            <div className="ev2-rail-h">Eventos del partido ({eventos.length})</div>
            {eventos.length === 0 ? <div className="text-[11px] text-muted">Sin eventos.</div> : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {eventos.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted w-8">{e.min}'</span><span>{e.icon}</span>
                    <span className="flex-1 text-xs">{e.label}{e.jugador ? ` · ${e.jugador}` : ''}</span>
                    <button className="text-muted hover:text-rojo text-xs" onClick={() => setEventos((ev) => ev.filter((_, k) => k !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
