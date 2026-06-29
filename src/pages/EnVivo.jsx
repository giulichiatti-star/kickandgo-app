import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ManualControls from '../components/envivo/ManualControls'
import ValoracionModal from '../components/envivo/ValoracionModal'
import '../ev2.css'
import { ultimaConvocatoria } from '../lib/convocatorias'
import { guardarPartido, listarPartidos } from '../lib/partidos'
import { getCompeticion, guardarCompeticion } from '../lib/competicion'
import { getPerfil } from '../lib/perfil'
import { useEquipo } from '../contexts/EquipoContext'
import { clasificarVoz } from '../lib/voz'
import { ordenarTitulares } from '../lib/formaciones'
import Jersey from '../components/Jersey'

// Formaciones HORIZONTALES (x = profundidad, nuestra portería a la izquierda)
const FORM_H_11 = {
  // 4 defensas
  '4-3-3':   [[6,50],[16,16],[16,39],[16,61],[16,84],[28,28],[28,50],[28,72],[42,20],[42,50],[42,80]],
  '4-4-2':   [[6,50],[16,16],[16,39],[16,61],[16,84],[28,16],[28,39],[28,61],[28,84],[42,36],[42,64]],
  '4-2-3-1': [[6,50],[16,16],[16,39],[16,61],[16,84],[26,38],[26,62],[36,20],[36,50],[36,80],[48,50]],
  '4-1-4-1': [[6,50],[16,16],[16,39],[16,61],[16,84],[25,50],[34,16],[34,39],[34,61],[34,84],[48,50]],
  '4-3-2-1': [[6,50],[16,16],[16,39],[16,61],[16,84],[26,28],[26,50],[26,72],[38,36],[38,64],[48,50]],
  '4-5-1':   [[6,50],[16,16],[16,39],[16,61],[16,84],[30,10],[30,30],[30,50],[30,70],[30,90],[46,50]],
  '4-4-1-1': [[6,50],[16,16],[16,39],[16,61],[16,84],[28,16],[28,39],[28,61],[28,84],[40,50],[48,50]],
  // 3 defensas
  '3-5-2':   [[6,50],[16,28],[16,50],[16,72],[28,12],[28,34],[28,50],[28,66],[28,88],[42,38],[42,62]],
  '3-4-3':   [[6,50],[16,28],[16,50],[16,72],[28,16],[28,39],[28,61],[28,84],[42,25],[42,50],[42,75]],
  '3-4-2-1': [[6,50],[16,28],[16,50],[16,72],[28,16],[28,39],[28,61],[28,84],[38,36],[38,64],[48,50]],
  '3-3-3-1': [[6,50],[16,28],[16,50],[16,72],[26,25],[26,50],[26,75],[36,25],[36,50],[36,75],[48,50]],
  '3-6-1':   [[6,50],[16,28],[16,50],[16,72],[28,10],[28,26],[28,42],[28,58],[28,74],[28,90],[46,50]],
  // 5 defensas
  '5-3-2':   [[6,50],[16,12],[16,31],[16,50],[16,69],[16,88],[28,28],[28,50],[28,72],[42,38],[42,62]],
  '5-4-1':   [[6,50],[16,12],[16,31],[16,50],[16,69],[16,88],[28,16],[28,39],[28,61],[28,84],[46,50]],
  '5-2-3':   [[6,50],[16,12],[16,31],[16,50],[16,69],[16,88],[28,38],[28,62],[42,25],[42,50],[42,75]],
  '5-2-2-1': [[6,50],[16,12],[16,31],[16,50],[16,69],[16,88],[26,36],[26,64],[36,36],[36,64],[46,50]],
}
const FORM_H_7 = {
  '2-3-1': [[8,50],[20,30],[20,70],[32,25],[32,50],[32,75],[46,50]],
  '3-2-1': [[8,50],[20,25],[20,50],[20,75],[34,35],[34,65],[48,50]],
  '2-2-2': [[8,50],[20,33],[20,67],[34,33],[34,67],[48,33],[48,67]],
  '1-3-2': [[8,50],[20,50],[34,25],[34,50],[34,75],[48,35],[48,65]],
  '3-1-2': [[8,50],[20,25],[20,50],[20,75],[34,50],[48,35],[48,65]],
  '1-2-3': [[8,50],[20,50],[32,25],[32,75],[42,20],[42,50],[42,80]],
  '2-1-3': [[8,50],[20,33],[20,67],[32,50],[42,20],[42,50],[42,80]],
}
const FORM_H_9 = {
  '3-3-2': [[7,50],[18,25],[18,50],[18,75],[30,25],[30,50],[30,75],[44,35],[44,65]],
  '3-2-3': [[7,50],[18,25],[18,50],[18,75],[30,38],[30,62],[44,25],[44,50],[44,75]],
  '2-4-2': [[7,50],[18,33],[18,67],[30,18],[30,40],[30,60],[30,82],[44,35],[44,65]],
  '2-3-3': [[7,50],[18,33],[18,67],[30,28],[30,50],[30,72],[44,25],[44,50],[44,75]],
  '3-1-3-1': [[7,50],[18,25],[18,50],[18,75],[28,50],[38,28],[38,50],[38,72],[48,50]],
  '4-3-1': [[7,50],[18,17],[18,39],[18,61],[18,83],[30,25],[30,50],[30,75],[46,50]],
  '4-2-2': [[7,50],[18,17],[18,39],[18,61],[18,83],[30,35],[30,65],[44,35],[44,65]],
  '3-4-1': [[7,50],[18,25],[18,50],[18,75],[29,17],[29,38],[29,62],[29,83],[46,50]],
  '2-2-4': [[7,50],[18,33],[18,67],[30,33],[30,67],[42,17],[42,38],[42,62],[42,83]],
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
const ICONO_MARCA = { gol: '⚽', 'gol-rival': '⚽', asistencia: '🅰️', amarilla: '🟨', 'amarilla-rival': '🟨', roja: '🟥', 'roja-rival': '🟥', cambio: '🔄', 'cambio-rival': '🔄' }
const META = {
  gol: { label: 'Gol' }, 'gol-rival': { label: 'Gol rival' }, asistencia: { label: 'Asistencia' },
  amarilla: { label: 'Amarilla' }, 'amarilla-rival': { label: 'Amarilla rival' },
  roja: { label: 'Roja' }, 'roja-rival': { label: 'Roja rival' },
  tiro: { label: 'Tiro' }, 'tiro-rival': { label: 'Tiro rival' },
  corner: { label: 'Córner' }, 'corner-rival': { label: 'Córner rival' },
  'falta-favor': { label: 'Falta a favor' }, falta: { label: 'Falta en contra' },
  robo: { label: 'Robo' }, perdida: { label: 'Pérdida' }, offside: { label: 'Fuera de juego' }, cambio: { label: 'Cambio' }, 'cambio-rival': { label: 'Cambio rival' },
}
function mmss(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

export default function EnVivo() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const navigate = useNavigate()
  const [titulares, setTitulares] = useState([])
  const [suplentes, setSuplentes] = useState([])
  const [rival, setRival] = useState('Rival')
  const [club, setClub] = useState('Nuestro equipo')
  const [escudo, setEscudo] = useState('')
  const [tipo, setTipo] = useState('11')
  const [formacion, setFormacion] = useState('4-3-3')
  const [formacionRival, setFormacionRival] = useState('4-4-2')
  const [coordsManual, setCoordsManual] = useState(null) // null = usa formación, array = manual
  const [modoManual, setModoManual] = useState(false)
  const canchaRef = useRef(null)
  const [vista, setVista] = useState('camisetas')
  const [tab, setTab] = useState('partido')
  const [gf, setGf] = useState(0)
  const [gc, setGc] = useState(0)
  const [seg, setSeg] = useState(0)
  const [tiempo, setTiempo] = useState(1) // 1 = primer tiempo, 2 = segundo tiempo
  const [descanso, setDescanso] = useState(false)
  const [corriendo, setCorriendo] = useState(false)
  const [partidoRestaurado, setPartidoRestaurado] = useState(false)
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
  const [localVisitante, setLocalVisitante] = useState('local')
  const [valorModal, setValorModal] = useState(false)
  const [valoraciones, setValoraciones] = useState({})
  const [toast, setToast] = useState(null)
  const timer = useRef(null), recRef = useRef(null), escRef = useRef(false), titRef = useRef([])
  const clubRef = useRef(club), rivalRef = useRef(rival), lastVozRef = useRef({ txt: '', ts: 0 })
  titRef.current = titulares
  clubRef.current = club
  rivalRef.current = rival

  useEffect(() => {
    // Restaurar partido en curso si existe en localStorage
    try {
      const saved = localStorage.getItem('kg_envivo')
      if (saved) {
        const s = JSON.parse(saved)
        // Validar que el partido guardado pertenece al equipo activo
        if (s.equipo_id && s.equipo_id !== eid) {
          localStorage.removeItem('kg_envivo')
        } else if (s.gf !== undefined) {
          setGf(s.gf); setGc(s.gc); setSeg(s.seg || 0)
          if (s.tiempo) setTiempo(s.tiempo)
          if (s.descanso) setDescanso(s.descanso)
          if (s.coordsManual) { setCoordsManual(s.coordsManual); setModoManual(true) }
          setEventos(s.eventos || []); setMarks(s.marks || {})
          setNotas(s.notas || ''); setStats(s.stats || { tiros:0, corners:0, faltas:0, amarillas:0 })
          setRival(s.rival || 'Rival'); setClub(s.club || 'Nuestro equipo')
          if (s.titulares?.length) setTitulares(s.titulares)
          if (s.suplentes?.length) setSuplentes(s.suplentes)
          if (s.formacion) setFormacion(s.formacion)
          if (s.tipo) setTipo(s.tipo)
          setPartidoRestaurado(true)
          return // no cargar convocatoria encima del partido guardado
        }
      }
    } catch (err) { console.error("[EnVivo] restaurar localStorage", err) }

    ;(async () => {
      if (!eid) return
      const [c, previos] = await Promise.all([ultimaConvocatoria(eid), listarPartidos(eid).catch(() => [])])
      if (c) {
        setTitulares((c.titulares || []).map((t) => ({ ...t })))
        setSuplentes((c.suplentes || []).map((t) => ({ ...t })))
        setRival(c.rival || 'Rival')
      }
      try {
        const p = await getPerfil()
        if (equipoActivo?.nombre) setClub(equipoActivo.nombre)
        else if (p?.club_nombre) setClub(p.club_nombre)
        if (equipoActivo?.escudo_url) setEscudo(equipoActivo.escudo_url)
        else if (p?.escudo_url) setEscudo(p.escudo_url)
        const t = equipoActivo?.tipo_equipo || p?.tipo_equipo || '11'
        setTipo(t); setFormacion(c?.formacion?.includes('-') ? c.formacion : defForm(t))
        setFormacionRival(defFormRival(t))
      } catch (err) { console.error("[EnVivo] cargar perfil", err) }
    })()
  }, [eid])

  // Guardar estado del partido en localStorage cada 30 segundos
  useEffect(() => {
    const id = setInterval(() => {
      try {
        localStorage.setItem('kg_envivo', JSON.stringify({
          gf, gc, seg, tiempo, descanso, eventos, marks, notas, stats,
          rival, club, titulares, suplentes, formacion, tipo, coordsManual,
          equipo_id: eid, ts: Date.now(),
        }))
      } catch (err) { console.error("[EnVivo] localStorage save", err) }
    }, 30000)
    return () => clearInterval(id)
  }, [gf, gc, seg, tiempo, descanso, eventos, marks, notas, stats, rival, club, titulares, suplentes, formacion, tipo, coordsManual, eid])

  // Duración del primer tiempo según tipo de equipo (en segundos)
  const durT1 = tipo === '7' ? 35 * 60 : tipo === '9' ? 40 * 60 : 45 * 60

  useEffect(() => {
    if (corriendo) {
      timer.current = setInterval(() => setSeg((s) => s + 1), 1000)
    } else {
      clearInterval(timer.current)
    }
    return () => clearInterval(timer.current)
  }, [corriendo, tiempo, durT1])
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

  // Minuto real mostrado (2T arranca desde durT1)
  const minMostrado = tiempo === 2 ? Math.floor(durT1 / 60) + Math.floor(seg / 60) : min

  function iniciarSegundoTiempo() {
    setDescanso(false)
    setTiempo(2)
    setSeg(0)
    setCorriendo(true)
  }

  function textoperiodo() {
    if (descanso) return 'Descanso'
    if (!corriendo && seg === 0) return 'No iniciado'
    if (!corriendo) return tiempo === 1 ? 'Pausado 1T' : 'Pausado 2T'
    return tiempo === 1 ? '1er Tiempo' : '2º Tiempo'
  }

  // Posiciones de cancha
  const coords = coordsManual || formsDe(tipo)[formacion] || Object.values(formsDe(tipo))[0]
  const puntosLocal = ordenarTitulares(titulares).slice(0, coords.length).map((j, i) => ({
    ...j, x: coords[i][0], y: coords[i][1], gk: i === 0, side: 'local',
  }))

  function handleDragJugador(e, idx) {
    if (!modoManual) return
    e.preventDefault()
    const cancha = canchaRef.current
    if (!cancha) return
    const rect = cancha.getBoundingClientRect()
    const base = coordsManual || formsDe(tipo)[formacion] || Object.values(formsDe(tipo))[0]
    const newCoords = base.map((c) => [...c])

    function onMove(ev) {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      const x = Math.round(Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100)))
      const y = Math.round(Math.min(97, Math.max(3, ((clientY - rect.top) / rect.height) * 100)))
      newCoords[idx] = [x, y]
      setCoordsManual([...newCoords])
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }
  const rivalForm = formsDe(tipo)[formacionRival] || Object.values(formsDe(tipo))[0]
  const puntosRival = RIVAL_DEMO.slice(0, rivalForm.length).map((j, i) => ({
    ...j, x: 100 - rivalForm[i][0], y: rivalForm[i][1], gk: i === 0, side: 'rival',
  }))

  function bump(s) { setStats((p) => ({ ...p, [s]: (p[s] || 0) + 1 })) }

  function registrar(tipoEv, jug) {
    const ev = { min, tipo: tipoEv, icon: ICONO_MARCA[tipoEv] || '•', label: (META[tipoEv]?.label || tipoEv), jugador: jug ? `#${jug.dorsal} ${jug.nombre}` : null, jugador_id: jug?.id || null }
    if (tipoEv === 'gol') { setGf((g) => g + 1); bump('tiros') }
    if (tipoEv === 'gol-rival') setGc((g) => g + 1)
    if (tipoEv === 'tiro') bump('tiros')
    if (tipoEv === 'corner') bump('corners')
    if (tipoEv === 'falta' || tipoEv === 'falta-favor') bump('faltas')
    if (tipoEv === 'amarilla') bump('amarillas')
    if (jug && ICONO_MARCA[tipoEv]) setMarks((m) => ({ ...m, [jug.id]: [...(m[jug.id] || []), ICONO_MARCA[tipoEv]] }))
    // doble amarilla = roja — usar updater para leer el array más reciente
    setEventos((prev) => {
      const lista = [ev, ...prev]
      if (tipoEv === 'amarilla' && jug) {
        const ya = prev.filter((x) => x.tipo === 'amarilla' && x.jugador === ev.jugador).length
        if (ya >= 1) {
          setMarks((m) => ({ ...m, [jug.id]: [...(m[jug.id] || []), '🟥'] }))
          return [{ min, tipo: 'roja', icon: '🟥', label: 'Roja (doble amarilla)', jugador: ev.jugador }, ...lista]
        }
      }
      return lista
    })
    setSel(null)
  }

  function cambio() {
    const sale = titulares.find((j) => j.id === saleId)
    const entra = suplentes.find((j) => j.id === entraId)
    if (!sale || !entra) return
    setTitulares((t) => t.map((j) => (j.id === saleId ? entra : j)))
    setSuplentes((s) => s.map((j) => (j.id === entraId ? sale : j)))
    setEventos((e) => [{ min, tipo: 'cambio', icon: '🔄', label: 'Cambio', jugador: `Sale ${sale.nombre} · Entra ${entra.nombre}` }, ...e])
    setMarks((m) => ({ ...m, [entra.id]: [...(m[entra.id] || []), '🔄'] }))
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
    rec.onresult = (e) => { const i = e.resultIndex; if (e.results[i]?.isFinal) { const txt = e.results[i][0].transcript; const now = Date.now(); if (txt === lastVozRef.current.txt && now - lastVozRef.current.ts < 2000) return; lastVozRef.current = { txt, ts: now }; setOido(txt); const r = clasificarVoz(txt, titRef.current, clubRef.current, rivalRef.current); if (r) { const jug = r.dorsalRival != null ? (RIVAL_DEMO.find(j => j.dorsal === r.dorsalRival) || null) : r.jugador; registrar(r.tipo, jug) } } }
    rec.onend = () => { if (escRef.current) { try { rec.start() } catch {} } }
    recRef.current = rec; try { rec.start(); escRef.current = true; setEscuchando(true) } catch {}
  }

  function showToast(msg, tipo = 'ok') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  async function guardarFinal(vals) {
    const payload = {
      rival, gf, gc, formacion,
      local_visitante: localVisitante,
      notas_entrenador: notas,
      eventos: eventos.map((e) => ({ min: e.min, tipo: e.tipo, label: e.label, jugador: e.jugador })),
      valoraciones: vals,
      _eid: eid,
      _ts: Date.now(),
    }
    try {
      await guardarPartido(payload, eid)

      try {
        const comp = await getCompeticion(eid)
        if (comp?.proximas_fechas?.length) {
          const rivalNorm = (rival || '').toLowerCase()
          const proximas = comp.proximas_fechas.filter(p =>
            !p.local?.toLowerCase().includes(rivalNorm) &&
            !p.visitante?.toLowerCase().includes(rivalNorm)
          )
          if (proximas.length !== comp.proximas_fechas.length) {
            await guardarCompeticion({ ...comp, proximas_fechas: proximas }, eid)
          }
        }
      } catch (err) { console.error("[EnVivo] guardarFinal comp", err) }

      localStorage.removeItem('kg_envivo')
      setValorModal(false)
      setCorriendo(false)
      showToast('✅ Partido guardado')
      setTimeout(() => navigate('/informes'), 800)
    } catch {
      const pendientes = JSON.parse(localStorage.getItem('kg_pendientes') || '[]')
      pendientes.push(payload)
      localStorage.setItem('kg_pendientes', JSON.stringify(pendientes))
      localStorage.removeItem('kg_envivo')
      setValorModal(false)
      setCorriendo(false)
      showToast('📴 Sin conexión — partido guardado localmente', 'warn')
    }
  }

  async function finalizar() {
    setCorriendo(false)
    setValorModal(true)
  }

  const Player = ({ p, onDragStart }) => {
    const isSel = sel?.id === p.id
    const ms = marks[p.id] || []
    return (
      <div className={`ev2-player${isSel ? ' sel' : ''}`}
        style={{ left: `${p.x}%`, top: `${p.y}%`, cursor: onDragStart ? 'grab' : undefined, userSelect: 'none' }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        onClick={() => !onDragStart && p.side === 'local' && setSel(isSel ? null : { id: p.id, dorsal: p.dorsal, nombre: p.nombre })}>
        {ms.length > 0 && <div className="ev2-pmarks">{ms.map((m, k) => <span key={k} className="ev2-pmark">{m}</span>)}</div>}
        <Jersey num={p.dorsal} side={p.side} gk={p.gk} vista={vista} />
        <div className="ev2-pname">{(p.nombre || '').split(' ')[0]}</div>
      </div>
    )
  }

  return (
    <>
    <div className="ev2-wrap" style={{ margin: '-20px -16px' }}>
      {valorModal && (
        <ValoracionModal
          titulares={titulares}
          gf={gf} gc={gc} rival={rival}
          valoraciones={valoraciones}
          onChange={setValoraciones}
          onGuardar={() => guardarFinal(valoraciones)}
          onSaltar={() => guardarFinal({})}
        />
      )}
      {partidoRestaurado && (
        <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold"
          style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }}>
          <span>🔄 Partido restaurado — continúa donde lo dejaste</span>
          <button onClick={() => { localStorage.removeItem('kg_envivo'); window.location.reload() }}
            className="text-[10px] opacity-60 hover:opacity-100 ml-3">Descartar</button>
        </div>
      )}
      {/* TOPBAR */}
      <div className="ev2-topbar">
        <div className="ev2-logo"><div className="ev2-logo-mark">K</div><div className="ev2-logo-txt">KICK<br />AND <span>GO</span></div></div>
        <div className="ev2-scoreboard">
          <div className="ev2-team-block rt"><div className="ev2-tname">{club}</div><div className="ev2-tsub" style={{cursor:'pointer',color:localVisitante==='local'?'#10b981':'#f59e0b'}} onClick={()=>setLocalVisitante(v=>v==='local'?'visitante':'local')}>{localVisitante==='local'?'🏠 Local':'✈️ Visitante'}</div></div>
          <div className="ev2-shield">{escudo ? <img src={escudo} alt="" /> : '🛡️'}</div>
          <div className="ev2-score-center">
            <div className="ev2-score-big">{gf} - {gc}</div>
            <div className="ev2-clock2" style={{ color: descanso ? '#f59e0b' : undefined }}>
              {descanso ? 'DESC' : `${minMostrado}'`}
            </div>
            <div className="ev2-period" style={{ color: descanso ? '#f59e0b' : tiempo === 2 ? '#2dd4bf' : undefined }}>
              {textoperiodo()}
            </div>
          </div>
          <div className="ev2-shield">⚫</div>
          <div className="ev2-team-block"><div className="ev2-tname">{rival}</div><div className="ev2-tsub">Visitante</div></div>
        </div>
        <div className="ev2-actions">
          {descanso ? (
            <button className="ev2-abtn" onClick={iniciarSegundoTiempo} style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>▶<small>2º TIEMPO</small></button>
          ) : (
            <button className="ev2-abtn" onClick={() => setCorriendo((c) => !c)}>{corriendo ? '⏸' : '▶'}<small>{corriendo ? 'PAUSA' : tiempo === 2 ? 'REANUDAR' : 'INICIAR'}</small></button>
          )}
          {!descanso && tiempo === 1 && seg >= durT1 && (
            <button className="ev2-abtn" onClick={() => { setCorriendo(false); setDescanso(true) }} style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>☕<small>DESCANSO</small></button>
          )}
          <button className={`ev2-rec-btn${escuchando ? ' on' : ''}`} onClick={toggleVoz}>
            <div className="ev2-rec-ico">
              {escuchando ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="3" width="4" height="11" rx="2"/><rect x="16" y="3" width="4" height="11" rx="2"/>
                </svg>
              ) : (
                <svg width="14" height="18" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="9" y="2" width="6" height="11" rx="3"/>
                  <path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-black tracking-wide">
                {escuchando ? 'GRABANDO' : 'GRABAR'}
              </span>
              {escuchando
                ? <span className="ev2-oido">{oido || 'Escuchando…'}</span>
                : <span className="text-[9px] opacity-60 font-normal">toca para activar</span>
              }
            </div>
            {escuchando && <div className="ev2-rec-dot ml-1" />}
          </button>
          <button className="ev2-abtn danger" onClick={finalizar}>⏹<small>FIN</small></button>
        </div>
      </div>

      {/* Banner descanso */}
      {descanso && (
        <div className="flex items-center justify-between px-4 py-2.5 text-sm font-bold"
          style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }}>
          <span>☕ Descanso — {Math.floor(durT1 / 60)} min completados</span>
          <button className="px-3 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.25)', border: '1px solid #f59e0b' }}
            onClick={iniciarSegundoTiempo}>▶ Iniciar 2º Tiempo</button>
        </div>
      )}

      {/* Aviso grabar partido */}
      {corriendo && !escuchando && (
        <button className="ev2-rec-hint" onClick={toggleVoz}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="11" rx="3"/>
            <path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/>
          </svg>
          <span>🔴 Graba el partido con tu voz — di "gol", "amarilla", "cambio"…</span>
          <span className="ml-auto text-[10px] opacity-60 font-normal">Activar →</span>
        </button>
      )}

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
                    if (f !== formacion || modoManual) {
                      setFormacion(f)
                      setCoordsManual(null)
                      setModoManual(false)
                      setEventos((ev) => [{ min, tipo: 'formacion', icon: '🔀', label: `Cambio de formación → ${f}`, jugador: null }, ...ev])
                    }
                  }}
                    className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${formacion === f && !modoManual ? 'border-cyan bg-cyan/10 text-cyan' : 'border-borde text-muted'}`}>{f}</button>
                ))}
                <button onClick={() => {
                  if (!modoManual) {
                    setCoordsManual((formsDe(tipo)[formacion] || Object.values(formsDe(tipo))[0]).map(c => [...c]))
                    setModoManual(true)
                  } else {
                    setModoManual(false)
                  }
                }} className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap shrink-0 ${modoManual ? 'border-dorado bg-dorado/10 text-dorado' : 'border-borde text-muted'}`}>
                  ✏️ Manual{modoManual ? ' (activo)' : ''}
                </button>
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
                {modoManual && (
                  <div className="text-[10px] text-center py-1 font-bold" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                    ✏️ Modo manual — arrastra los jugadores para reposicionarlos
                  </div>
                )}
                {titulares.length === 0 && (
                  <div style={{
                    position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
                    zIndex:20,textAlign:'center',pointerEvents:'none',
                    background:'rgba(15,15,17,0.85)',borderRadius:12,padding:'16px 24px',
                    border:'1px solid #27272a'
                  }}>
                    <div style={{fontSize:28,marginBottom:6}}>📋</div>
                    <div style={{fontSize:13,fontWeight:700,color:'#fafafa'}}>Sin convocatoria</div>
                    <div style={{fontSize:11,color:'#71717a',marginTop:4}}>Ve a <b style={{color:'#10b981'}}>Convocatoria</b> y confirma los jugadores antes del partido</div>
                  </div>
                )}
                <div className="ev2-pitch" ref={canchaRef}>
                  <svg className="ev2-pitch-lines" viewBox="0 0 160 100" preserveAspectRatio="none">
                    <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                    <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                    <circle cx="80" cy="50" r="13" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                    <rect x="2" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
                    <rect x="138" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
                  </svg>
                  <div className="ev2-pname-banner l">{club.toUpperCase()}</div>
                  <div className="ev2-form-chip l">{modoManual ? 'manual' : formacion}</div>
                  <div className="ev2-form-chip r">{formacionRival}</div>
                  <div className="ev2-pname-banner r">{rival.toUpperCase()}</div>
                  {puntosLocal.map((p, i) => (
                    <Player key={p.id} p={p}
                      onDragStart={modoManual ? (e) => handleDragJugador(e, i) : undefined} />
                  ))}
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
                  <button className={`ev2-rec-btn w-full justify-center${escuchando ? ' on' : ''}`} onClick={toggleVoz}>
                    <div className="ev2-rec-ico">
                      <svg width="13" height="16" viewBox="0 0 24 24" fill="none" stroke={escuchando ? 'white' : '#fca5a5'} strokeWidth="2.2" strokeLinecap="round">
                        <rect x="9" y="2" width="6" height="11" rx="3"/>
                        <path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/>
                      </svg>
                    </div>
                    {escuchando ? 'GRABANDO' : 'Activar grabación'}
                    {escuchando && <div className="ev2-rec-dot ml-auto" />}
                  </button>
                  {escuchando && oido && <div className="text-[10px] text-muted italic mt-1.5">"{oido}"</div>}
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
          {/* CONTROL MANUAL */}
          <ManualControls rival={rival} onRegistrar={registrar} />

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
                    <button className="text-muted hover:text-rojo text-xs" onClick={() => {
                      // Revertir marcador
                      if (e.tipo === 'gol') { setGf((g) => Math.max(0, g - 1)); setStats((s) => ({ ...s, tiros: Math.max(0, s.tiros - 1) })) }
                      if (e.tipo === 'gol-rival') setGc((g) => Math.max(0, g - 1))
                      // Revertir stats
                      if (e.tipo === 'tiro') setStats((s) => ({ ...s, tiros: Math.max(0, s.tiros - 1) }))
                      if (e.tipo === 'corner') setStats((s) => ({ ...s, corners: Math.max(0, s.corners - 1) }))
                      if (e.tipo === 'falta' || e.tipo === 'falta-favor') setStats((s) => ({ ...s, faltas: Math.max(0, s.faltas - 1) }))
                      if (e.tipo === 'amarilla') setStats((s) => ({ ...s, amarillas: Math.max(0, s.amarillas - 1) }))
                      // Quitar marca del jugador (⚽ amarilla roja etc)
                      const ico = ICONO_MARCA[e.tipo]
                      if (ico && e.jugador_id) {
                        setMarks((m) => {
                          const arr = [...(m[e.jugador_id] || [])]
                          const idx = arr.lastIndexOf(ico)
                          if (idx !== -1) arr.splice(idx, 1)
                          return { ...m, [e.jugador_id]: arr }
                        })
                      }
                      setEventos((ev) => ev.filter((_, k) => k !== i))
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed',bottom:24,right:24,zIndex:9999,
          background: toast.tipo==='warn' ? '#78350f' : '#166534',
          color: toast.tipo==='warn' ? '#fcd34d' : '#86efac',
          border:`1px solid ${toast.tipo==='warn'?'#f59e0b':'#22c55e'}`,
          borderLeft:`3px solid ${toast.tipo==='warn'?'#f59e0b':'#22c55e'}`,
          borderRadius:10,padding:'10px 16px',fontSize:13,fontWeight:600,
          boxShadow:'0 4px 24px rgba(0,0,0,0.4)',maxWidth:320
        }}>
          {toast.msg}
        </div>
      )}
    </div>
    </>
  )
}

