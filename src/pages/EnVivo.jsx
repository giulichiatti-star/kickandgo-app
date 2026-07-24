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
import PWAInstallBanner from '../components/PWAInstallBanner'
import { usePWAInstall } from '../hooks/usePWAInstall'
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
  { tipo: 'tiro-puerta', ico: '🎯', lbl: 'Tiro puerta' },
  { tipo: 'tiro-fuera', ico: '🚫', lbl: 'Tiro fuera' },
  { tipo: 'amarilla', ico: '🟨', lbl: 'Amarilla' },
  { tipo: 'roja', ico: '🟥', lbl: 'Roja' },
  { tipo: 'falta', ico: '⚠️', lbl: 'Falta' },
]
const ICONO_MARCA = { gol: '⚽', 'gol-rival': '⚽', asistencia: '🅰️', 'asistencia-rival': '🅰️', amarilla: '🟨', 'amarilla-rival': '🟨', roja: '🟥', 'roja-rival': '🟥', cambio: '🔄', 'cambio-rival': '🔄', 'tiro-puerta': '🎯', 'tiro-puerta-rival': '🎯', 'tiro-fuera': '🚫', 'tiro-fuera-rival': '🚫', falta: '⚠️', 'falta-rival': '⚠️', offside: '🚩', 'offside-rival': '🚩' }
const META = {
  gol: { label: 'Gol' }, 'gol-rival': { label: 'Gol rival' },
  asistencia: { label: 'Asistencia' }, 'asistencia-rival': { label: 'Asistencia rival' },
  amarilla: { label: 'Amarilla' }, 'amarilla-rival': { label: 'Amarilla rival' },
  roja: { label: 'Roja' }, 'roja-rival': { label: 'Roja rival' },
  tiro: { label: 'Tiro' }, 'tiro-rival': { label: 'Tiro rival' },
  'tiro-puerta': { label: 'Tiro a puerta' }, 'tiro-puerta-rival': { label: 'Tiro a puerta rival' },
  'tiro-fuera': { label: 'Tiro fuera' }, 'tiro-fuera-rival': { label: 'Tiro fuera rival' },
  corner: { label: 'Córner' }, 'corner-rival': { label: 'Córner rival' },
  falta: { label: 'Falta (nuestra)' }, 'falta-rival': { label: 'Falta del rival' },
  'falta-favor': { label: 'Falta a favor' },
  robo: { label: 'Robo' }, perdida: { label: 'Pérdida' },
  offside: { label: 'Fuera de juego' }, 'offside-rival': { label: 'Fuera de juego rival' },
  cambio: { label: 'Cambio' }, 'cambio-rival': { label: 'Cambio rival' },
}
function mmss(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

export default function EnVivo() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const navigate = useNavigate()
  const [titulares, setTitulares] = useState([])
  const [suplentes, setSuplentes] = useState([])
  const [xiInicial, setXiInicial] = useState([]) // 11/7 inicial (snapshot al primer pitido, para minutos jugados)
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
  const [rivalDorsales, setRivalDorsales] = useState(() => RIVAL_DEMO.map(r => r.dorsal))
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
  const [mobileSheet, setMobileSheet] = useState(null) // null | {type:'player',tipo,label} | {type:'rival-player',tipo,label} | {type:'cambio'} | {type:'cambio-rival'}
  const [mSaleId, setMSaleId] = useState('')
  const [mEntraId, setMEntraId] = useState('')
  const [mSaleRival, setMSaleRival] = useState('')
  const [mEntraRival, setMEntraRival] = useState('')
  const [toast, setToast] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const { mostrar: mostrarPWA, instalar, descartar } = usePWAInstall('envivo')
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
          if (s.xiInicial?.length) setXiInicial(s.xiInicial)
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
          rival, club, titulares, suplentes, xiInicial, formacion, tipo, coordsManual,
          equipo_id: eid, ts: Date.now(),
        }))
      } catch (err) { console.error("[EnVivo] localStorage save", err) }
    }, 30000)
    return () => clearInterval(id)
  }, [gf, gc, seg, tiempo, descanso, eventos, marks, notas, stats, rival, club, titulares, suplentes, xiInicial, formacion, tipo, coordsManual, eid])

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
  // Snapshot del 11/7 inicial en el primer pitido (antes de cualquier cambio).
  // Sirve para calcular minutos jugados. Una sola vez por partido.
  useEffect(() => {
    if (corriendo && xiInicial.length === 0 && titulares.length > 0) {
      setXiInicial(titulares.map((t) => ({ id: t.id, nombre: t.nombre, dorsal: t.dorsal })))
    }
  }, [corriendo])
  useEffect(() => () => { try { recRef.current?.stop() } catch {} }, [])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

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

  // Posiciones de cancha — inset de seguridad: aleja cualquier coordenada del
  // borde del campo para que ningún jugador quede pegado o fuera de la línea.
  // El portero usa un inset propio, más ceñido, para caer DENTRO del área
  // pequeña dibujada en el SVG (rect x=2..22 de 160 → 1.25%-13.75% de ancho).
  const inset = (v) => 10 + v * 0.8
  const insetGK = (v) => 5 + v * 0.5 // x=6→8%, x=8→9%: siempre dentro del área (1.25–13.75%)
  const coords = coordsManual || formsDe(tipo)[formacion] || Object.values(formsDe(tipo))[0]
  const puntosLocal = ordenarTitulares(titulares).slice(0, coords.length).map((j, i) => ({
    ...j,
    x: i === 0 ? insetGK(coords[i][0]) : inset(coords[i][0]),
    y: inset(coords[i][1]),
    gk: i === 0, side: 'local',
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
  const puntosRival = rivalDorsales.slice(0, rivalForm.length).map((dorsal, i) => ({
    id: `r-${dorsal}`, dorsal, nombre: 'Rival ' + dorsal, cat: i === 0 ? 'POR' : 'MED',
    x: i === 0 ? 100 - insetGK(rivalForm[i][0]) : inset(100 - rivalForm[i][0]),
    y: inset(rivalForm[i][1]), gk: i === 0, side: 'rival',
  }))

  function bump(s) { setStats((p) => ({ ...p, [s]: (p[s] || 0) + 1 })) }

  function registrar(tipoEv, jug) {
    const ev = { min, tipo: tipoEv, icon: ICONO_MARCA[tipoEv] || '•', label: (META[tipoEv]?.label || tipoEv), jugador: jug ? `#${jug.dorsal} ${jug.nombre}` : null, jugador_id: jug?.id || null }
    if (tipoEv === 'gol') { setGf((g) => g + 1); bump('tiros'); bump('tirosPuerta') }
    if (tipoEv === 'gol-rival') { setGc((g) => g + 1); bump('tirosPuertaRival') }
    if (tipoEv === 'tiro') bump('tiros')
    if (tipoEv === 'tiro-puerta') { bump('tiros'); bump('tirosPuerta') }
    if (tipoEv === 'tiro-fuera') { bump('tiros'); bump('tirosFuera') }
    if (tipoEv === 'tiro-puerta-rival') bump('tirosPuertaRival')
    if (tipoEv === 'tiro-fuera-rival') bump('tirosFueraRival')
    if (tipoEv === 'corner') bump('corners')
    if (tipoEv === 'corner-rival') bump('cornersRival')
    if (tipoEv === 'falta' || tipoEv === 'falta-favor') bump('faltas')
    if (tipoEv === 'falta-rival') bump('faltasRival')
    if (tipoEv === 'amarilla') bump('amarillas')
    if (tipoEv === 'amarilla-rival') bump('amarillasRival')
    if (jug && ICONO_MARCA[tipoEv]) {
      // Si es del rival y jug fue creado sobre la marcha con id=`r-${dorsal}`, usa esa key
      const key = jug.id || (jug.dorsal != null ? `r-${jug.dorsal}` : null)
      if (key) setMarks((m) => ({ ...m, [key]: [...(m[key] || []), ICONO_MARCA[tipoEv]] }))
    }
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
    setEventos((e) => [{ min, tipo: 'cambio', icon: '🔄', label: 'Cambio', jugador: `Sale ${sale.nombre} · Entra ${entra.nombre}`, saleId: sale.id, entraId: entra.id }, ...e])
    setMarks((m) => ({ ...m, [entra.id]: [...(m[entra.id] || []), '🔄'] }))
    setSaleId(''); setEntraId('')
  }

  function cambioRival() {
    if (!saleRival.trim() || !entraRival.trim()) return
    const saleN = parseInt(saleRival, 10)
    const entraN = parseInt(entraRival, 10)
    if (!isNaN(saleN) && !isNaN(entraN)) {
      setRivalDorsales(rd => rd.map(d => d === saleN ? entraN : d))
      setMarks(m => ({ ...m, [`r-${entraN}`]: [...(m[`r-${entraN}`] || []), '🔄'] }))
    }
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
    // 11/7 inicial: snapshot del primer pitido; si no se registró, usa la
    // alineación actual (caso raro: partido sin haber pulsado INICIAR).
    const xi = (xiInicial.length ? xiInicial : titulares).map((t) => ({ id: t.id, nombre: t.nombre, dorsal: t.dorsal }))
    // Cambios con IDs (derivados de los eventos de cambio del equipo local).
    const cambios = eventos
      .filter((e) => e.tipo === 'cambio' && (e.saleId || e.entraId))
      .map((e) => ({ min: Number(e.min) || 0, saleId: e.saleId || null, entraId: e.entraId || null }))
    const duracion = minMostrado > 0 ? minMostrado : (tipo === '7' ? 70 : tipo === '9' ? 80 : 90)
    const alineacion = xi.length
      ? { titulares: xi, suplentes: suplentes.map((t) => ({ id: t.id, nombre: t.nombre, dorsal: t.dorsal })), cambios, duracion }
      : null

    const payload = {
      rival, gf, gc, formacion,
      local_visitante: localVisitante,
      notas_entrenador: notas,
      eventos: eventos.map((e) => ({ min: e.min, tipo: e.tipo, label: e.label, jugador: e.jugador, saleId: e.saleId, entraId: e.entraId })),
      alineacion,
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
    <div className="ev2-wrap">
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
      <div className="ev2-desktop-only">
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
          {/* ManualControls visible en móvil — antes de la cancha */}
          <div className="ev2-rail-mobile" style={{ display: 'none', marginBottom: 12 }}>
            <ManualControls rival={rival} onRegistrar={registrar} />
          </div>
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

        {/* RAIL DERECHO — oculto en móvil (contenido duplicado abajo para móvil) */}
        <div className="ev2-rail-right-desktop">
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
    </div>{/* end ev2-desktop-only */}

    {/* ── LAYOUT UNIFICADO (mide el ancho real disponible, no la ventana) ── */}
    <div className="ev2-container">
    <MobileEnVivo
      club={club} rival={rival} escudo={escudo}
      gf={gf} gc={gc} minMostrado={minMostrado}
      corriendo={corriendo} descanso={descanso} tiempo={tiempo}
      textoperiodo={textoperiodo}
      localVisitante={localVisitante} setLocalVisitante={setLocalVisitante}
      tipo={tipo} formacion={formacion} setFormacion={setFormacion}
      formacionRival={formacionRival} setFormacionRival={setFormacionRival}
      formsDe={formsDe}
      titulares={titulares} suplentes={suplentes}
      setTitulares={setTitulares} setSuplentes={setSuplentes}
      puntosLocal={puntosLocal} puntosRival={puntosRival}
      canchaRef={canchaRef} vista={vista} setVista={setVista}
      escuchando={escuchando} oido={oido}
      eventos={eventos} setEventos={setEventos}
      marks={marks} setMarks={setMarks} setStats={setStats}
      registrar={registrar}
      mobileSheet={mobileSheet} setMobileSheet={setMobileSheet}
      mSaleId={mSaleId} setMSaleId={setMSaleId}
      mEntraId={mEntraId} setMEntraId={setMEntraId}
      mSaleRival={mSaleRival} setMSaleRival={setMSaleRival}
      mEntraRival={mEntraRival} setMEntraRival={setMEntraRival}
      setCorriendo={setCorriendo} iniciarSegundoTiempo={iniciarSegundoTiempo}
      toggleVoz={toggleVoz} finalizar={finalizar}
      durT1={durT1} seg={seg}
      partidoRestaurado={partidoRestaurado}
      ICONO_MARCA={ICONO_MARCA}
      min={min}
      notas={notas} setNotas={setNotas}
      online={online}
      mostrarPWA={mostrarPWA} instalar={instalar} descartar={descartar}
      setGf={setGf} setGc={setGc}
      setRivalDorsales={setRivalDorsales}
    />
    </div>
    </>
  )
}

// ── Mobile layout component ──────────────────────────────────────────────────
function MobileEnVivo({
  club, rival, escudo, gf, gc, minMostrado,
  corriendo, descanso, tiempo, textoperiodo,
  localVisitante, setLocalVisitante,
  tipo, formacion, setFormacion, formacionRival, setFormacionRival, formsDe,
  titulares, suplentes, setTitulares, setSuplentes, puntosLocal, puntosRival, canchaRef, vista, setVista,
  escuchando, oido, eventos, setEventos, marks, setMarks, setStats,
  registrar, mobileSheet, setMobileSheet,
  mSaleId, setMSaleId, mEntraId, setMEntraId,
  mSaleRival, setMSaleRival, mEntraRival, setMEntraRival,
  setCorriendo, iniciarSegundoTiempo, toggleVoz, finalizar,
  durT1, seg, partidoRestaurado, ICONO_MARCA, min,
  notas, setNotas, online,
  mostrarPWA, instalar, descartar,
  setGf, setGc, setRivalDorsales,
}) {
  const ACCIONES = [
    { tipo: 'gol',        tipoRival: 'gol-rival',        ico: '⚽',  lbl: 'Gol',         needsPlayer: true,  needsPlayerRival: true },
    { tipo: 'asistencia', tipoRival: 'asistencia-rival', ico: '🅰️', lbl: 'Asist.',      needsPlayer: true,  needsPlayerRival: true },
    { tipo: 'amarilla',   tipoRival: 'amarilla-rival',   ico: '🟨', lbl: 'Amarilla',    needsPlayer: true,  needsPlayerRival: true },
    { tipo: 'roja',       tipoRival: 'roja-rival',       ico: '🟥', lbl: 'Roja',        needsPlayer: true,  needsPlayerRival: true },
    { tipo: 'falta',      tipoRival: 'falta-rival',      ico: '⚠️', lbl: 'Falta',       needsPlayer: true,  needsPlayerRival: true },
    { tipo: 'tiro-puerta', tipoRival: 'tiro-puerta-rival', ico: '🎯', lbl: 'Tiro puerta', needsPlayer: true, needsPlayerRival: true },
    { tipo: 'tiro-fuera',  tipoRival: 'tiro-fuera-rival',  ico: '🚫', lbl: 'Tiro fuera',  needsPlayer: true, needsPlayerRival: true },
    { tipo: 'offside',    tipoRival: 'offside-rival',    ico: '🚩', lbl: 'F. juego',    needsPlayer: true, needsPlayerRival: true },
    { tipo: 'corner',     tipoRival: 'corner-rival',     ico: '⛳', lbl: 'Córner',      needsPlayer: false, needsPlayerRival: false },
    { tipo: 'cambio',     tipoRival: 'cambio-rival',     ico: '🔄', lbl: 'Cambio',      needsPlayer: 'cambio', needsPlayerRival: 'cambio-rival' },
  ]

  function handleNuestro(a) {
    if (a.needsPlayer === 'cambio') { setMobileSheet({ type: 'cambio' }); return }
    if (a.needsPlayer) { setMobileSheet({ type: 'player', tipo: a.tipo, label: a.lbl, ico: a.ico }); return }
    registrar(a.tipo, null)
  }
  function handleRival(a) {
    if (a.needsPlayerRival === 'cambio-rival') { setMobileSheet({ type: 'cambio-rival' }); return }
    if (a.needsPlayerRival) { setMobileSheet({ type: 'rival-player', tipo: a.tipoRival, label: a.lbl, ico: a.ico }); return }
    registrar(a.tipoRival, null)
  }

  function confirmCambio() {
    const sale = titulares.find(j => j.id === mSaleId)
    const entra = suplentes.find(j => j.id === mEntraId)
    if (!sale || !entra) return
    // Swap real: el que entra ocupa el sitio del que sale en el campo.
    setTitulares(t => t.map(j => (j.id === mSaleId ? entra : j)))
    setSuplentes(s => s.map(j => (j.id === mEntraId ? sale : j)))
    setEventos(e => [{ min, tipo: 'cambio', icon: '🔄', label: 'Cambio', jugador: `Sale ${sale.nombre} · Entra ${entra.nombre}`, saleId: sale.id, entraId: entra.id }, ...e])
    setMarks(m => ({ ...m, [entra.id]: [...(m[entra.id] || []), '🔄'] }))
    setMSaleId(''); setMEntraId('')
    setMobileSheet(null)
  }

  function confirmCambioRival() {
    if (!mSaleRival.trim() || !mEntraRival.trim()) return
    const saleN = parseInt(mSaleRival, 10)
    const entraN = parseInt(mEntraRival, 10)
    if (!isNaN(saleN) && !isNaN(entraN) && setRivalDorsales) {
      setRivalDorsales(rd => rd.map(d => d === saleN ? entraN : d))
      setMarks(m => ({ ...m, [`r-${entraN}`]: [...(m[`r-${entraN}`] || []), '🔄'] }))
    }
    setEventos(e => [{ min, tipo: 'cambio-rival', icon: '🔄', label: `Cambio ${rival}`, jugador: `Sale #${mSaleRival} · Entra #${mEntraRival}` }, ...e])
    setMSaleRival(''); setMEntraRival('')
    setMobileSheet(null)
  }

  function confirmRivalPlayer(dorsal) {
    if (!dorsal?.trim()) return
    const jug = { id: 'r-' + dorsal, dorsal, nombre: `#${dorsal}` }
    registrar(mobileSheet.tipo, jug)
    setMobileSheet(null)
  }

  const [rivalDorsal, setRivalDorsal] = useState('')
  const [notasOpen, setNotasOpen] = useState(false)

  return (
    <div className="ev2-mobile-layout">
      {/* Restaurado banner */}
      {partidoRestaurado && (
        <div style={{ background:'rgba(245,158,11,0.15)', borderBottom:'1px solid rgba(245,158,11,0.3)', color:'#fcd34d', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, fontWeight:700 }}>
          <span>🔄 Partido restaurado</span>
          <button onClick={() => { localStorage.removeItem('kg_envivo'); window.location.reload() }} style={{ fontSize:10, opacity:.7 }}>Descartar</button>
        </div>
      )}

      {!online && (
        <div style={{ background:'rgba(245,158,11,0.12)', borderBottom:'1px solid rgba(245,158,11,0.25)', color:'#fcd34d', padding:'7px 14px', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          <span>📵</span> Sin conexión — los datos se guardan en tu móvil y se sincronizan al recuperar señal
        </div>
      )}

      <div className="ev2-ml-cols">
      <div className="ev2-ml-main">
      {/* TOPBAR */}
      <div style={{ background:'#16161a', borderBottom:'1px solid #27272a', padding:'10px 14px 8px' }}>
        {/* Marcador */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, gap:8 }}>
          <div style={{ textAlign:'center', flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#fafafa', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{club}</div>
            <div onClick={() => setLocalVisitante(v => v==='local'?'visitante':'local')}
              style={{ fontSize:9, color: localVisitante==='local'?'#10b981':'#f59e0b', cursor:'pointer', marginTop:2 }}>
              {localVisitante==='local'?'🏠 Local':'✈️ Visitante'}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
            <div style={{ fontSize:26, fontWeight:900, color:'#fafafa', letterSpacing:2, lineHeight:1 }}>{gf} - {gc}</div>
            <div style={{ fontSize:13, fontWeight:800, color: descanso?'#f59e0b':'#2dd4bf', letterSpacing:1 }}>
              {descanso ? 'DESC' : `${minMostrado}'`}
            </div>
            <div style={{ fontSize:9, color:'#71717a', textTransform:'uppercase', letterSpacing:.5 }}>{textoperiodo()}</div>
          </div>
          <div style={{ textAlign:'center', flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#fafafa', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rival}</div>
            <div style={{ fontSize:9, color:'#71717a', marginTop:2 }}>Visitante</div>
          </div>
        </div>
        {/* Controles */}
        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
          {descanso ? (
            <button onClick={iniciarSegundoTiempo} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:9,border:'1px solid #f59e0b',background:'rgba(245,158,11,.1)',color:'#f59e0b',fontSize:11,fontWeight:800,cursor:'pointer' }}>
              ▶ 2º Tiempo
            </button>
          ) : (
            <button onClick={() => setCorriendo(c => !c)} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:9,border:'1px solid #10b981',background:'rgba(16,185,129,.1)',color:'#10b981',fontSize:11,fontWeight:800,cursor:'pointer' }}>
              {corriendo ? '⏸ Pausa' : '▶ Reanudar'}
            </button>
          )}
          {!descanso && tiempo===1 && seg>=durT1 && (
            <button onClick={() => { setCorriendo(false); /* setDescanso */ }} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:9,border:'1px solid #f59e0b',background:'rgba(245,158,11,.1)',color:'#f59e0b',fontSize:11,fontWeight:800,cursor:'pointer' }}>
              ☕ Descanso
            </button>
          )}
          <button onClick={toggleVoz} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:9,border:`1px solid ${escuchando?'#ef4444':'rgba(239,68,68,.35)'}`,background:escuchando?'rgba(239,68,68,.18)':'rgba(239,68,68,.06)',color:'#fca5a5',fontSize:11,fontWeight:800,cursor:'pointer' }}>
            🎤 {escuchando ? 'Grabando' : 'Voz'}
          </button>
          <button onClick={finalizar} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:9,border:'1px solid rgba(239,68,68,.4)',background:'transparent',color:'#ef4444',fontSize:11,fontWeight:800,cursor:'pointer' }}>
            ⏹ Fin
          </button>
        </div>
      </div>

      {/* FORMACIONES */}
      <div style={{ display:'flex', gap:8, padding:'8px 12px', background:'#121214', borderBottom:'1px solid #27272a' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#2dd4bf', textTransform:'uppercase', letterSpacing:.5, marginBottom:3 }}>{club.split(' ')[0]}</div>
          <select value={formacion} onChange={e => setFormacion(e.target.value)}
            style={{ width:'100%', background:'#1c1c20', border:'1px solid #27272a', borderRadius:8, color:'#fafafa', fontSize:12, fontWeight:700, padding:'5px 8px' }}>
            {Object.keys(formsDe(tipo)).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#ef4444', textTransform:'uppercase', letterSpacing:.5, marginBottom:3 }}>{rival.split(' ')[0]}</div>
          <select value={formacionRival} onChange={e => setFormacionRival(e.target.value)}
            style={{ width:'100%', background:'#1c1c20', border:'1px solid #27272a', borderRadius:8, color:'#fafafa', fontSize:12, fontWeight:700, padding:'5px 8px' }}>
            {Object.keys(formsDe(tipo)).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* VISTA JUGADORES */}
      <div style={{ display:'flex', gap:6, padding:'8px 12px 0', justifyContent:'center' }}>
        {[['camisetas','👕','Camiseta'],['chapas','⬤','Chapa'],['escudo','🛡️','Escudo']].map(([v,ic,l]) => (
          <button key={v} onClick={() => setVista(v)}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:20, border:`1px solid ${vista===v?'#2dd4bf':'#27272a'}`, background: vista===v?'rgba(45,212,191,.12)':'transparent', color: vista===v?'#2dd4bf':'#71717a', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
            <span style={{ fontSize:13 }}>{ic}</span>{l}
          </button>
        ))}
      </div>

      {/* CAMPO */}
      <div style={{ padding:'10px 12px 0' }}>
        <div className="ev2-pitch" style={{ borderRadius:10, position:'relative' }}>
          <svg className="ev2-pitch-lines" viewBox="0 0 160 100" preserveAspectRatio="none">
            <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5"/>
            <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,.25)" strokeWidth="0.5"/>
            <circle cx="80" cy="50" r="13" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5"/>
            <rect x="2" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5"/>
            <rect x="138" y="28" width="20" height="44" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5"/>
          </svg>
          <div className="ev2-pname-banner l">{club.toUpperCase()}</div>
          <div className="ev2-pname-banner r">{rival.toUpperCase()}</div>
          {puntosLocal.map(p => {
            const ms = marks[p.id] || []
            return (
              <div key={p.id} className="ev2-player" style={{ left:`${p.x}%`, top:`${p.y}%`, position:'absolute', transform:'translate(-50%,-50%)' }}>
                <Jersey num={p.dorsal} side={p.side} gk={p.gk} vista={vista} />
                <div className="ev2-pname">{(p.nombre||'').split(' ')[0]}</div>
                {ms.length > 0 && <div className="ev2-pmarks">{ms.map((m, k) => <span key={k} className="ev2-pmark">{m}</span>)}</div>}
              </div>
            )
          })}
          {puntosRival.map(p => {
            const ms = marks[p.id] || []
            return (
              <div key={p.id} className="ev2-player" style={{ left:`${p.x}%`, top:`${p.y}%`, position:'absolute', transform:'translate(-50%,-50%)' }}>
                <Jersey num={p.dorsal} side={p.side} gk={p.gk} vista={vista} />
                {ms.length > 0 && <div className="ev2-pmarks">{ms.map((m, k) => <span key={k} className="ev2-pmark">{m}</span>)}</div>}
              </div>
            )
          })}
        </div>
      </div>
      </div>{/* end ev2-ml-main */}

      <div className="ev2-ml-side">
      {/* PANEL ACCIONES 2 COLUMNAS */}
      <div style={{ margin:'10px 12px 0', border:'1px solid #27272a', borderRadius:10, overflow:'hidden' }}>
        {/* Headers */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'#121214' }}>
          <div style={{ padding:'6px 8px', fontSize:9, fontWeight:800, color:'#2dd4bf', textAlign:'center', textTransform:'uppercase', letterSpacing:.4, borderBottom:'2px solid #2dd4bf' }}>
            {club.length > 14 ? club.split(' ')[0] : club}
          </div>
          <div style={{ padding:'6px 8px', fontSize:9, fontWeight:800, color:'#ef4444', textAlign:'center', textTransform:'uppercase', letterSpacing:.4, borderBottom:'2px solid #ef4444' }}>
            {rival.length > 14 ? rival.split(' ')[0] : rival}
          </div>
        </div>
        {/* Filas de acciones */}
        {ACCIONES.map(a => (
          <div key={a.tipo} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:'1px solid #27272a' }}>
            <button onClick={() => handleNuestro(a)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 12px', background:'transparent', border:'none', borderRight:'1px solid #27272a', color:'#fafafa', cursor:'pointer', fontSize:12, fontWeight:700, textAlign:'left' }}>
              <span style={{ fontSize:15, width:20, textAlign:'center', flexShrink:0 }}>{a.ico}</span>
              {a.lbl}
            </button>
            <button onClick={() => handleRival(a)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 12px', background:'transparent', border:'none', color:'#fafafa', cursor:'pointer', fontSize:12, fontWeight:700, textAlign:'left' }}>
              <span style={{ fontSize:15, width:20, textAlign:'center', flexShrink:0 }}>{a.ico}</span>
              {a.lbl}
            </button>
          </div>
        ))}
      </div>

      {/* VOZ */}
      {escuchando && oido && (
        <div style={{ margin:'8px 12px 0', fontSize:10, color:'#a1a1aa', fontStyle:'italic' }}>🎤 "{oido}"</div>
      )}

      {/* NOTAS DEL ENTRENADOR */}
      <div style={{ margin:'10px 12px 0', border:'1px solid #27272a', borderRadius:10, overflow:'hidden' }}>
        <button onClick={() => setNotasOpen(o => !o)}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'transparent', border:'none', color:'#fafafa', cursor:'pointer' }}>
          <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:.5, color:'#71717a' }}>
            📝 Notas del entrenador
          </span>
          <span style={{ fontSize:10, color:'#71717a' }}>{notasOpen ? '▲' : '▼'}</span>
        </button>
        {notasOpen && (
          <div style={{ padding:'0 12px 12px' }}>
            <textarea
              rows={4}
              placeholder="Observaciones: táctica, rendimiento, instrucciones…"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              style={{ width:'100%', background:'#121214', border:'1px solid #27272a', borderRadius:8, color:'#fafafa', fontSize:12, padding:'8px 10px', resize:'vertical', lineHeight:1.6, fontFamily:'inherit', boxSizing:'border-box' }}
            />
            <div style={{ fontSize:10, color:'#71717a', marginTop:4 }}>Se guardan al finalizar el partido.</div>
          </div>
        )}
      </div>

      {/* EVENTOS */}
      <div style={{ margin:'10px 12px', paddingBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:.5, color:'#71717a', marginBottom:8 }}>
          Eventos del partido
        </div>
        {eventos.length === 0 ? (
          <div style={{ fontSize:11, color:'#71717a' }}>Sin eventos aún.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {eventos.slice(0,10).map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderTop:'1px solid #27272a' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#71717a', width:28, flexShrink:0 }}>{e.min}'</span>
                <span style={{ fontSize:13 }}>{e.icon || '•'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#fafafa' }}>{e.label}</div>
                  {e.jugador && <div style={{ fontSize:10, color:'#71717a' }}>{e.jugador}</div>}
                </div>
                <button onClick={() => {
                  const bajar = (campo) => setStats((s) => ({ ...s, [campo]: Math.max(0, (s[campo] || 0) - 1) }))
                  if (e.tipo === 'gol') { setGf((g) => Math.max(0, g - 1)); bajar('tiros'); bajar('tirosPuerta') }
                  if (e.tipo === 'gol-rival') { setGc((g) => Math.max(0, g - 1)); bajar('tirosPuertaRival') }
                  if (e.tipo === 'tiro') bajar('tiros')
                  if (e.tipo === 'tiro-puerta') { bajar('tiros'); bajar('tirosPuerta') }
                  if (e.tipo === 'tiro-fuera') { bajar('tiros'); bajar('tirosFuera') }
                  if (e.tipo === 'tiro-puerta-rival') bajar('tirosPuertaRival')
                  if (e.tipo === 'tiro-fuera-rival') bajar('tirosFueraRival')
                  if (e.tipo === 'corner') bajar('corners')
                  if (e.tipo === 'corner-rival') bajar('cornersRival')
                  if (e.tipo === 'falta' || e.tipo === 'falta-favor') bajar('faltas')
                  if (e.tipo === 'falta-rival') bajar('faltasRival')
                  if (e.tipo === 'amarilla') bajar('amarillas')
                  if (e.tipo === 'amarilla-rival') bajar('amarillasRival')
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
                }} style={{ background:'none', border:'none', color:'#71717a', fontSize:14, padding:'4px 6px', cursor:'pointer', flexShrink:0, lineHeight:1 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>{/* end ev2-ml-side */}
      </div>{/* end ev2-ml-cols */}

      {/* BOTTOM SHEETS */}
      {mobileSheet && (
        <div onClick={() => setMobileSheet(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#18181b', borderRadius:'14px 14px 0 0', padding:16, borderTop:'1px solid #27272a', maxHeight:'75vh', overflowY:'auto' }}>
            <div style={{ width:36, height:4, background:'#3f3f46', borderRadius:2, margin:'0 auto 14px' }} />

            {/* Sheet: seleccionar jugador propio */}
            {mobileSheet.type === 'player' && (<>
              <div style={{ fontSize:13, fontWeight:800, color:'#fafafa', textAlign:'center', marginBottom:12 }}>
                {mobileSheet.ico} {mobileSheet.label} — ¿quién?
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {titulares.map(j => (
                  <button key={j.id} onClick={() => { registrar(mobileSheet.tipo, j); setMobileSheet(null) }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, background:'transparent', border:'none', color:'#fafafa', cursor:'pointer', textAlign:'left', width:'100%' }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:'rgba(45,212,191,.15)', border:'1px solid #2dd4bf', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#2dd4bf', flexShrink:0 }}>
                      {j.dorsal}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700 }}>{j.nombre}</div>
                      <div style={{ fontSize:10, color:'#71717a' }}>{j.posicion}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>)}

            {/* Sheet: cambio nuestro equipo */}
            {mobileSheet.type === 'cambio' && (<>
              <div style={{ fontSize:13, fontWeight:800, color:'#fafafa', textAlign:'center', marginBottom:14 }}>🔄 Cambio — {club}</div>
              <div style={{ fontSize:10, fontWeight:800, color:'#ef4444', marginBottom:4 }}>SALE</div>
              <select className="field mb-3" value={mSaleId} onChange={e => setMSaleId(e.target.value)} style={{ marginBottom:10 }}>
                <option value="">— elige titular —</option>
                {titulares.map(j => <option key={j.id} value={j.id}>#{j.dorsal} {j.nombre}</option>)}
              </select>
              <div style={{ fontSize:10, fontWeight:800, color:'#2dd4bf', margin:'10px 0 4px' }}>ENTRA</div>
              <select className="field" value={mEntraId} onChange={e => setMEntraId(e.target.value)} style={{ marginBottom:12 }}>
                <option value="">— elige suplente —</option>
                {suplentes.map(j => <option key={j.id} value={j.id}>#{j.dorsal} {j.nombre}</option>)}
              </select>
              <button onClick={confirmCambio} disabled={!mSaleId||!mEntraId} className="btn btn-primary w-full" style={{ marginBottom:8 }}>
                Confirmar cambio
              </button>
            </>)}

            {/* Sheet: jugador rival (gol/amarilla/roja) */}
            {mobileSheet.type === 'rival-player' && (<>
              <div style={{ fontSize:13, fontWeight:800, color:'#fafafa', textAlign:'center', marginBottom:14 }}>
                {mobileSheet.ico} {mobileSheet.label} rival — dorsal
              </div>
              <input className="field" type="number" min={1} max={99} placeholder="Nº dorsal del rival"
                value={rivalDorsal} onChange={e => setRivalDorsal(e.target.value)}
                style={{ marginBottom:12, fontSize:20, fontWeight:800, textAlign:'center' }} />
              <button onClick={() => { confirmRivalPlayer(rivalDorsal); setRivalDorsal('') }}
                disabled={!rivalDorsal?.trim()} className="btn btn-primary w-full" style={{ marginBottom:8 }}>
                Registrar
              </button>
              <button onClick={() => { registrar(mobileSheet.tipo, null); setMobileSheet(null); setRivalDorsal('') }}
                className="btn btn-outline w-full" style={{ fontSize:11 }}>
                Sin dorsal — registrar igualmente
              </button>
            </>)}

            {/* Sheet: cambio rival */}
            {mobileSheet.type === 'cambio-rival' && (<>
              <div style={{ fontSize:13, fontWeight:800, color:'#fafafa', textAlign:'center', marginBottom:14 }}>🔄 Cambio — {rival}</div>
              <div style={{ fontSize:10, fontWeight:800, color:'#ef4444', marginBottom:4 }}>SALE dorsal</div>
              <input className="field" type="number" min={1} max={99} placeholder="Dorsal que sale"
                value={mSaleRival} onChange={e => setMSaleRival(e.target.value)} style={{ marginBottom:10 }} />
              <div style={{ fontSize:10, fontWeight:800, color:'#2dd4bf', margin:'6px 0 4px' }}>ENTRA dorsal</div>
              <input className="field" type="number" min={1} max={99} placeholder="Dorsal que entra"
                value={mEntraRival} onChange={e => setMEntraRival(e.target.value)} style={{ marginBottom:12 }} />
              <button onClick={confirmCambioRival} disabled={!mSaleRival?.trim()||!mEntraRival?.trim()}
                className="btn btn-outline w-full" style={{ borderColor:'rgba(239,68,68,.4)', color:'#f87171', marginBottom:8 }}>
                Registrar cambio rival
              </button>
            </>)}

            <button onClick={() => { setMobileSheet(null); setRivalDorsal('') }}
              style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:12, fontWeight:700, cursor:'pointer', marginTop:4 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mostrarPWA && <PWAInstallBanner onInstalar={instalar} onDescartar={descartar} />}
    </div>
  )
}
