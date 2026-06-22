import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getPerfil } from '../lib/perfil'
import { listarJugadores } from '../lib/jugadores'
import '../pizarra.css'

/* ── Formaciones (cancha vertical, portería abajo) ── */
const FORM_11 = {
  '4-3-3':  [[50,90],[16,72],[38,75],[62,75],[84,72],[28,52],[50,48],[72,52],[22,24],[50,20],[78,24]],
  '4-4-2':  [[50,90],[16,72],[38,74],[62,74],[84,72],[16,50],[38,52],[62,52],[84,50],[38,22],[62,22]],
  '4-2-3-1':[[50,90],[16,72],[38,74],[62,74],[84,72],[35,56],[65,56],[20,38],[50,35],[80,38],[50,18]],
  '3-5-2':  [[50,90],[28,74],[50,76],[72,74],[12,52],[32,54],[50,48],[68,54],[88,52],[38,22],[62,22]],
  '5-3-2':  [[50,90],[12,74],[31,75],[50,77],[69,75],[88,74],[28,50],[50,48],[72,50],[38,24],[62,24]],
  '4-4-1-1':[[50,90],[16,72],[38,74],[62,74],[84,72],[16,50],[38,52],[62,52],[84,50],[50,30],[50,16]],
  '3-4-3':  [[50,90],[28,74],[50,76],[72,74],[18,50],[38,52],[62,52],[82,50],[22,22],[50,20],[78,22]],
  '4-1-2-1-2':[[50,90],[16,72],[38,74],[62,74],[84,72],[50,58],[28,44],[72,44],[50,30],[32,16],[68,16]],
}
const FORM_9 = {
  '3-3-2': [[50,90],[22,72],[50,74],[78,72],[22,48],[50,46],[78,48],[38,22],[62,22]],
  '3-2-3': [[50,90],[22,72],[50,74],[78,72],[35,50],[65,50],[22,24],[50,22],[78,24]],
  '2-4-2': [[50,90],[33,73],[67,73],[15,50],[38,50],[62,50],[85,50],[38,22],[62,22]],
  '2-3-3': [[50,90],[33,73],[67,73],[24,50],[50,48],[76,50],[22,24],[50,22],[78,24]],
}
const FORM_7 = {
  '2-3-1': [[50,90],[33,70],[67,70],[22,48],[50,46],[78,48],[50,22]],
  '3-2-1': [[50,90],[25,70],[50,72],[75,70],[35,46],[65,46],[50,22]],
  '2-2-2': [[50,90],[33,72],[67,72],[33,48],[67,48],[33,24],[67,24]],
  '1-3-2': [[50,90],[50,74],[25,50],[50,48],[75,50],[35,24],[65,24]],
  '3-1-2': [[50,90],[25,72],[50,74],[75,72],[50,48],[35,24],[65,24]],
}
const tablaDe = (t) => t === '7' ? FORM_7 : t === '9' ? FORM_9 : FORM_11

const TOOLS  = [
  { id: 'libre',    ico: '✏️', lbl: 'Línea libre' },
  { id: 'flecha',   ico: '➡️', lbl: 'Flecha' },
  { id: 'circulo',  ico: '⭕', lbl: 'Círculo' },
  { id: 'borrador', ico: '🧹', lbl: 'Borrador' },
  { id: 'mover',    ico: '↖️', lbl: 'Mover jugador' },
]

function dibujarBalon(ctx, balon) {
  if (!balon) return
  const R = 12
  const { cx, cy } = balon
  ctx.save()

  // Clip al círculo para que los parches no salgan
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip()

  // Fondo blanco
  ctx.fillStyle = '#f0f0f0'
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()

  // Parches negros — pentágono central + 5 alrededor (clásico balón de fútbol)
  ctx.fillStyle = '#111'
  const patchAngles = [0, 1, 2, 3, 4].map((i) => (Math.PI * 2 * i) / 5 - Math.PI / 2)
  const patchR = R * 0.42

  // Parche central
  ;(function drawPatch(pcx, pcy, size) {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
      const px = pcx + Math.cos(a) * size, py = pcy + Math.sin(a) * size
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.fill()
  })(cx, cy, patchR)

  // 5 parches periféricos
  const outerDist = R * 0.72
  patchAngles.forEach((a) => {
    const px = cx + Math.cos(a) * outerDist
    const py = cy + Math.sin(a) * outerDist
    ;(function drawPatch(pcx, pcy, size) {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const ang = (Math.PI * 2 * i) / 5 + a + Math.PI / 2
        const x2 = pcx + Math.cos(ang) * size, y2 = pcy + Math.sin(ang) * size
        i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2)
      }
      ctx.closePath(); ctx.fill()
    })(px, py, patchR * 0.72)
  })

  ctx.restore()

  // Borde exterior
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2; ctx.stroke()
  // Brillo
  ctx.beginPath(); ctx.arc(cx - R * 0.28, cy - R * 0.3, R * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill()
  ctx.restore()
}
// Posición espejada para el rival (derecha del campo)
function rivalPos(coord) {
  const mx = PW * 0.04, my = PH * 0.05
  const fw = PW - mx * 2, fh = PH - my * 2
  const cx = mx + fw / 2 + (coord[1] / 100) * (fw / 2)
  const cy = my + (coord[0] / 100) * fh
  return { cx, cy }
}
const COLORS = ['#5eead4','#ffffff','#ef4444','#f59e0b','#3b82f6','#a78bfa','#4ade80']
const STROKES = [{ lbl:'Fino', w:1.5 },{ lbl:'Medio', w:3 },{ lbl:'Grueso', w:6 }]

/* ── Canvas helper ── */
const PW = 800, PH = 500 // 16:10

function dibujarCampo(ctx) {
  const W = PW, H = PH, CYAN = '#2dd4bf'
  // Fondo pizarra negro
  ctx.fillStyle = '#0d0d0f'; ctx.fillRect(0, 0, W, H)
  // Líneas cyan — campo HORIZONTAL (nuestra portería izquierda)
  ctx.strokeStyle = CYAN; ctx.lineWidth = 2; ctx.lineCap = 'round'
  const mx = W * 0.04, my = H * 0.05
  const fw = W - mx * 2, fh = H - my * 2
  // Borde exterior
  ctx.strokeRect(mx, my, fw, fh)
  // Línea media vertical
  ctx.beginPath(); ctx.moveTo(W * 0.5, my); ctx.lineTo(W * 0.5, my + fh); ctx.stroke()
  // Círculo central
  const cr = Math.min(W, H) * 0.13
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, cr, 0, Math.PI * 2); ctx.stroke()
  // Punto central
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 3, 0, Math.PI * 2); ctx.fillStyle = CYAN; ctx.fill()
  // Áreas grande + chica + portería — IZQUIERDA
  const agW = fw * 0.14, agH = fh * 0.55
  const acW = fw * 0.06, acH = fh * 0.28
  const gW  = fw * 0.018, gH = fh * 0.16
  ctx.strokeStyle = CYAN
  ctx.strokeRect(mx,             my + (fh - agH) / 2, agW, agH)
  ctx.strokeRect(mx,             my + (fh - acH) / 2, acW, acH)
  ctx.strokeRect(mx - gW,        my + (fh - gH)  / 2, gW, gH)
  ctx.beginPath(); ctx.arc(mx + agW, H * 0.5, cr * 0.7, -Math.PI / 2.4, Math.PI / 2.4); ctx.stroke()
  // DERECHA
  ctx.strokeRect(mx + fw - agW,  my + (fh - agH) / 2, agW, agH)
  ctx.strokeRect(mx + fw - acW,  my + (fh - acH) / 2, acW, acH)
  ctx.strokeRect(mx + fw,        my + (fh - gH)  / 2, gW, gH)
  ctx.beginPath(); ctx.arc(mx + fw - agW, H * 0.5, cr * 0.7, Math.PI - Math.PI / 2.4, Math.PI + Math.PI / 2.4); ctx.stroke()
  // Arcos de esquina
  ;[[mx, my, 0, Math.PI / 2], [mx + fw, my, Math.PI / 2, Math.PI],
    [mx + fw, my + fh, Math.PI, Math.PI * 1.5], [mx, my + fh, Math.PI * 1.5, Math.PI * 2]
  ].forEach(([cx, cy, s, e]) => { ctx.beginPath(); ctx.arc(cx, cy, 10, s, e); ctx.stroke() })
  // Marca central
  ctx.fillStyle = 'rgba(45,212,191,0.65)'
  ctx.font = `bold ${Math.round(cr * 0.68)}px Inter,Arial`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('K', W * 0.5, H * 0.5 - cr * 0.12)
  ctx.font = `bold ${Math.round(cr * 0.17)}px Inter,Arial`
  ctx.fillText('KICK AND GO', W * 0.5, H * 0.5 + cr * 0.45)
}

/* ── Jugador en canvas ── */
function jugadorPos(coord) {
  // coord [x%, y%] — campo horizontal: y%=profundidad (90=nuestra portería izq, 20=rival der)
  const mx = PW * 0.04, my = PH * 0.05
  const fw = PW - mx * 2, fh = PH - my * 2
  const cx = mx + (1 - coord[1] / 100) * (fw / 2)
  const cy = my + (coord[0] / 100) * fh
  return { cx, cy }
}

function dibujarJugadores(ctx, puntos) {
  const R = 16
  puntos.forEach((p) => {
    const isGK = p.gk
    ctx.beginPath(); ctx.arc(p.cx, p.cy, R, 0, Math.PI * 2)
    ctx.fillStyle = isGK ? '#2f7fe0' : '#22c3b0'; ctx.fill()
    ctx.beginPath(); ctx.arc(p.cx, p.cy - R * 0.35, R * 0.7, Math.PI, 0)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill()
    ctx.fillStyle = '#0d0d0f'; ctx.font = `bold ${Math.round(R * 0.9)}px Inter,Arial`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(p.dorsal || (p.idx + 1), p.cx, p.cy)
    if (p.nombre) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = `${Math.round(R * 0.55)}px Inter,Arial`
      ctx.fillText(p.nombre.split(' ')[0], p.cx, p.cy + R + 8)
    }
  })
}

function dibujarRivales(ctx, puntos) {
  const R = 16
  puntos.forEach((p, i) => {
    ctx.beginPath(); ctx.arc(p.cx, p.cy, R, 0, Math.PI * 2)
    ctx.fillStyle = p.gk ? '#b91c1c' : '#ef4444'; ctx.fill()
    ctx.beginPath(); ctx.arc(p.cx, p.cy - R * 0.35, R * 0.7, Math.PI, 0)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(R * 0.9)}px Inter,Arial`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(i + 1, p.cx, p.cy)
    if (p.nombre) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = `${Math.round(R * 0.55)}px Inter,Arial`
      ctx.fillText(p.nombre.split(' ')[0], p.cx, p.cy + R + 8)
    }
  })
}

export default function Pizarra() {
  const canvasRef      = useRef(null)
  const trazos         = useRef([])
  const drawing        = useRef(false)
  const curTrazo       = useRef(null)
  const location = useLocation()
  const rivalNom = location.state?.rivalNom || null

  const movingIdx      = useRef(null)
  const movingRivalIdx = useRef(null)
  const movingBalon    = useRef(false)
  const [tipo, setTipo]           = useState('11')
  const [form, setForm]           = useState('4-3-3')
  const [rivalForm, setRivalForm] = useState('4-3-3')
  const [mostrarRival, setMostrarRival] = useState(false)
  const [jugadores, setJugadores] = useState([])
  const [puntos, setPuntos]       = useState([])
  const [rivalPuntos, setRivalPuntos] = useState([])
  const [tool, setTool]           = useState('libre')
  const [color, setColor]         = useState('#5eead4')
  const [stroke, setStroke]       = useState(3)
  const [balon, setBalon]         = useState({ cx: PW / 2, cy: PH / 2 })
  const [mostrarBalon, setMostrarBalon] = useState(true)
  const [notas, setNotas]         = useState('')
  const [historial, setHistorial] = useState([])
  const [histSel, setHistSel]     = useState('')
  const [msg, setMsg]             = useState('')

  /* carga */
  useEffect(() => {
    ;(async () => {
      try {
        const p = await getPerfil()
        const t = p?.tipo_equipo || '11'
        setTipo(t)
        setForm(t === '7' ? '2-3-1' : t === '9' ? '3-3-2' : '4-3-3')
        const js = await listarJugadores(t)
        setJugadores(js)
      } catch {}
      const h = JSON.parse(localStorage.getItem('pizarra_hist') || '[]')
      setHistorial(h)
    })()
  }, [])

  /* calcular puntos según formación */
  useEffect(() => {
    const tabla = tablaDe(tipo)
    const pos   = tabla[form] || Object.values(tabla)[0]
    const gks   = jugadores.filter((j) => /portero|arquero/i.test(j.posicion))
    const resto = jugadores.filter((j) => !/portero|arquero/i.test(j.posicion))
    const orden = [...gks.slice(0,1), ...resto]
    const pts = pos.map((coord, i) => {
      const j = orden[i]
      const { cx, cy } = jugadorPos(coord, tipo)
      return { cx, cy, dorsal: j?.dorsal || (i+1), nombre: j?.nombre || '', gk: i===0, idx: i }
    })
    setPuntos(pts)
    trazos.current = []
    redibujar(pts)
  }, [form, tipo, jugadores])

  /* redibujar */
  function redibujar(pts, rpts, bl) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, PW, PH)
    dibujarCampo(ctx)
    dibujarJugadores(ctx, pts || puntos)
    if (mostrarRival) dibujarRivales(ctx, rpts || rivalPuntos)
    if (mostrarBalon) dibujarBalon(ctx, bl || balon)
    trazos.current.forEach((t) => dibujarTrazo(ctx, t))
    if (curTrazo.current) dibujarTrazo(ctx, curTrazo.current)
  }
  function dibujarTrazo(ctx, t) {
    if (!t) return
    ctx.save()
    ctx.strokeStyle = t.color; ctx.fillStyle = t.color; ctx.lineWidth = t.w
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (t.tool === 'libre' && t.pts?.length > 1) {
      ctx.beginPath(); ctx.moveTo(t.pts[0].x, t.pts[0].y)
      t.pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y)); ctx.stroke()
    } else if (t.tool === 'flecha' && t.pts?.length >= 2) {
      const [a, b] = [t.pts[0], t.pts[t.pts.length-1]]
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      // punta de flecha
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const hs = 12 + t.w * 2
      ctx.beginPath()
      ctx.moveTo(b.x, b.y)
      ctx.lineTo(b.x - hs * Math.cos(ang - 0.4), b.y - hs * Math.sin(ang - 0.4))
      ctx.lineTo(b.x - hs * Math.cos(ang + 0.4), b.y - hs * Math.sin(ang + 0.4))
      ctx.closePath(); ctx.fill()
    } else if (t.tool === 'circulo' && t.r != null) {
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  /* coordenadas relativas al canvas */
  function getXY(e) {
    const r = canvasRef.current.getBoundingClientRect()
    const scaleX = PW / r.width, scaleY = PH / r.height
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY }
  }

  /* borrador: elimina trazos cuyo punto más cercano esté dentro del radio */
  function borrarEnPunto(x, y) {
    const R = 18 + stroke * 3
    const antes = trazos.current.length
    trazos.current = trazos.current.filter((t) => {
      if (t.tool === 'circulo') {
        // distancia del centro al punto del borrador
        return Math.hypot(t.x - x, t.y - y) > R + t.r
      }
      const pts = t.pts || []
      return !pts.some((p) => Math.hypot(p.x - x, p.y - y) < R)
    })
    if (trazos.current.length !== antes) redibujar()
  }

  /* eventos de dibujo */
  function onDown(e) {
    e.preventDefault()
    const { x, y } = getXY(e)
    if (tool === 'mover') {
      if (mostrarBalon && Math.hypot(balon.cx - x, balon.cy - y) < 16) {
        movingBalon.current = true; drawing.current = true; return
      }
      const rIdx = mostrarRival ? rivalPuntos.findIndex((p) => Math.hypot(p.cx - x, p.cy - y) < 20) : -1
      if (rIdx >= 0) { movingRivalIdx.current = rIdx; drawing.current = true; return }
      const idx = puntos.findIndex((p) => Math.hypot(p.cx - x, p.cy - y) < 20)
      if (idx >= 0) { movingIdx.current = idx; drawing.current = true }
      return
    }
    if (tool === 'borrador') {
      borrarEnPunto(x, y)
    } else if (tool === 'libre') {
      curTrazo.current = { tool:'libre', color, w:stroke, pts:[{x,y}] }
    } else if (tool === 'flecha') {
      curTrazo.current = { tool:'flecha', color, w:stroke, pts:[{x,y}] }
    } else if (tool === 'circulo') {
      curTrazo.current = { tool:'circulo', color, w:stroke, x, y, r:0 }
    }
    drawing.current = true
  }
  function onMove(e) {
    if (!drawing.current) return
    e.preventDefault()
    const { x, y } = getXY(e)
    if (tool === 'mover' && movingBalon.current) {
      const nb = { cx: x, cy: y }
      setBalon(nb); redibujar(puntos, rivalPuntos, nb); return
    }
    if (tool === 'mover' && movingRivalIdx.current != null) {
      const np = rivalPuntos.map((p, i) => i === movingRivalIdx.current ? { ...p, cx:x, cy:y } : p)
      setRivalPuntos(np); redibujar(puntos, np); return
    }
    if (tool === 'mover' && movingIdx.current != null) {
      const np = puntos.map((p, i) => i === movingIdx.current ? { ...p, cx:x, cy:y } : p)
      setPuntos(np); redibujar(np); return
    }
    if (tool === 'borrador') { borrarEnPunto(x, y); return }
    if (!curTrazo.current) return
    if (tool === 'libre' || tool === 'flecha') {
      curTrazo.current.pts.push({ x, y })
    } else if (tool === 'circulo') {
      curTrazo.current.r = Math.hypot(x - curTrazo.current.x, y - curTrazo.current.y)
    }
    redibujar()
  }
  function onUp(e) {
    if (!drawing.current) return
    drawing.current = false
    if (tool === 'mover') { movingIdx.current = null; movingRivalIdx.current = null; movingBalon.current = false; return }
    if (curTrazo.current) {
      if ((curTrazo.current.pts?.length > 1) || curTrazo.current.r > 2) {
        trazos.current.push({ ...curTrazo.current })
      }
      curTrazo.current = null
    }
    redibujar()
  }

  /* calcular posiciones del rival */
  useEffect(() => {
    const tabla = tablaDe(tipo)
    const pos = tabla[rivalForm] || Object.values(tabla)[0]
    const pts = pos.map((coord, i) => ({ ...rivalPos(coord), gk: i === 0, idx: i }))
    setRivalPuntos(pts)
  }, [rivalForm, tipo])

  useEffect(() => {
    redibujar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos, rivalPuntos, mostrarRival, balon, mostrarBalon])

  /* acciones */
  function limpiar() { trazos.current = []; redibujar() }
  function deshacer() { trazos.current.pop(); redibujar() }

  function getPNG() {
    const canvas = canvasRef.current
    // dibujar notas en el canvas temporalmente
    const ctx = canvas.getContext('2d')
    if (notas.trim()) {
      ctx.save()
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(10, PH - 80, PW - 20, 68)
      ctx.fillStyle = '#fff'; ctx.font = '11px Inter,Arial'
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'
      const lines = notas.split('\n').slice(0, 5)
      lines.forEach((l, i) => ctx.fillText(l, 18, PH - 74 + i * 13))
      ctx.restore()
    }
    const png = canvas.toDataURL('image/png')
    // volver a dibujar sin notas sobreimpresas
    redibujar()
    return png
  }

  function descargarPNG() {
    const png = getPNG()
    const a = document.createElement('a'); a.href = png
    a.download = `pizarra-${new Date().toISOString().slice(0,10)}.png`; a.click()
  }

  function guardarHistorial() {
    const nombre = `${form} · ${new Date().toLocaleDateString('es-ES', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}`
    const entrada = { nombre, fecha: new Date().toISOString(), png: getPNG(), notas }
    const nuevo = [entrada, ...historial].slice(0, 20)
    setHistorial(nuevo)
    localStorage.setItem('pizarra_hist', JSON.stringify(nuevo))
    setMsg('✅ Guardado en historial.')
    setTimeout(() => setMsg(''), 2500)
  }

  function cargarHistorial(idx) {
    if (idx === '') return
    const h = historial[+idx]
    if (!h) return
    // dibuja el PNG guardado sobre el canvas
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d')
    const img = new Image(); img.src = h.png
    img.onload = () => { ctx.clearRect(0,0,PW,PH); ctx.drawImage(img,0,0,PW,PH) }
    setNotas(h.notas || '')
    trazos.current = []
  }

  function descargarPDF() {
    const canvas = canvasRef.current
    const png = getPNG()
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Pizarra Táctica</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;padding:28px 32px;max-width:900px;margin:auto}
h1{font-size:20px;font-weight:800;margin-bottom:4px}
.sub{font-size:12px;color:#555;margin-bottom:16px}
img{width:100%;border-radius:10px;border:1px solid #e5e7eb}
.notas{margin-top:20px;border:1px solid #e5e7eb;border-radius:10px;padding:14px}
.notas h3{font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:8px;letter-spacing:.5px}
.notas p{font-size:13px;line-height:1.7;white-space:pre-wrap;color:#374151}
.footer{margin-top:24px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between}
@media print{body{padding:0}}
</style></head><body>
<h1>Pizarra Táctica</h1>
<div class="sub">Formación: ${form} · ${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
<img src="${png}" alt="Pizarra" />
${notas ? `<div class="notas"><h3>Notas del entrenador</h3><p>${notas}</p></div>` : ''}
<div class="footer"><span>Kick &amp; Go</span><span>${new Date().toLocaleDateString('es-ES')}</span></div>
</body></html>`
    const w = window.open('','_blank')
    w.document.write(html); w.document.close()
    w.focus(); setTimeout(() => w.print(), 500)
  }

  function borrarHistorialItem(idx) {
    const nuevo = historial.filter((_, i) => i !== idx)
    setHistorial(nuevo)
    localStorage.setItem('pizarra_hist', JSON.stringify(nuevo))
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">
            {rivalNom ? <>Preparación partido <span style={{color:'#2dd4bf'}}>vs {rivalNom}</span></> : 'Pizarra Táctica'}
          </h1>
          <p className="text-[11px] text-muted">Canvas interactivo · Arrastra jugadores · Dibuja jugadas</p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button className="piz-btn-sm" onClick={deshacer}>↩ Deshacer</button>
          <button className="piz-btn-sm" onClick={limpiar}>🗑 Limpiar</button>
          <button className="piz-btn-sm" onClick={guardarHistorial}>🗂 Guardar</button>
          <button className="piz-btn-sm" onClick={descargarPDF}>📄 PDF</button>
          <button className="piz-btn-sm piz-btn-primary" onClick={descargarPNG}>💾 PNG</button>
        </div>
      </div>

      {msg && <div className="text-xs text-muted mb-2">{msg}</div>}

      <div className="piz-wrap">
        {/* Canvas */}
        <div className="piz-canvas-wrap">
          <canvas
            ref={canvasRef} width={PW} height={PH}
            className="piz-canvas"
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            style={{ touchAction: 'none', cursor: tool === 'mover' ? 'grab' : tool === 'borrador' ? 'cell' : 'crosshair' }}
          />
        </div>

        {/* Panel herramientas */}
        <div className="piz-tools">
          {/* Formación propia */}
          <div>
            <div className="piz-lbl">Tu formación</div>
            <select className="piz-select" value={form} onChange={(e) => setForm(e.target.value)}>
              {Object.keys(tablaDe(tipo)).map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Balón */}
          <div>
            <div className="piz-lbl">Balón</div>
            <button
              className={`piz-tool-btn w-full mb-1 ${mostrarBalon ? 'active' : ''}`}
              onClick={() => {
                if (!mostrarBalon) setBalon({ cx: PW / 2, cy: PH / 2 })
                setMostrarBalon((v) => !v)
              }}
            >
              ⚽ {mostrarBalon ? 'Ocultar balón' : 'Poner balón'}
            </button>
            {mostrarBalon && (
              <button
                className="piz-tool-btn w-full text-[11px]"
                onClick={() => { setBalon({ cx: PW / 2, cy: PH / 2 }) }}
              >
                ↩ Centrar balón
              </button>
            )}
          </div>

          {/* Rival */}
          <div>
            <div className="piz-lbl">Rival</div>
            <button
              className={`piz-tool-btn w-full mb-1 ${mostrarRival ? 'active' : ''}`}
              style={mostrarRival ? { background: 'rgba(239,68,68,0.2)', borderColor: '#ef4444', color: '#fca5a5' } : {}}
              onClick={() => setMostrarRival((v) => !v)}
            >
              🔴 {mostrarRival ? 'Ocultar rival' : 'Poner rival'}
            </button>
            {mostrarRival && (
              <select className="piz-select" value={rivalForm} onChange={(e) => setRivalForm(e.target.value)}>
                {Object.keys(tablaDe(tipo)).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>

          {/* Herramienta */}
          <div>
            <div className="piz-lbl">Herramienta</div>
            <div className="flex flex-col gap-1">
              {TOOLS.map((t) => (
                <button key={t.id} className={`piz-tool-btn ${tool === t.id ? 'active' : ''}`} onClick={() => setTool(t.id)}>
                  {t.ico} {t.lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <div className="piz-lbl">Color del trazo</div>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} className={`piz-swatch ${color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>

          {/* Grosor */}
          <div>
            <div className="piz-lbl">Grosor</div>
            <div className="flex gap-1">
              {STROKES.map((s) => (
                <button key={s.lbl} className={`piz-stroke-btn ${stroke === s.w ? 'active' : ''}`} onClick={() => setStroke(s.w)}>{s.lbl}</button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <div className="piz-lbl">Notas del entrenador</div>
            <textarea className="piz-notas" rows={4} placeholder="Instrucciones tácticas, observaciones, variantes…" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <div className="card p-4 mt-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📂 Historial de pizarras ({historial.length})</div>
          <div className="space-y-2">
            {historial.map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-borde last:border-0">
                <img src={h.png} alt="" className="w-20 h-12 object-cover rounded-lg border border-borde flex-shrink-0 cursor-pointer" onClick={() => { setHistSel(String(i)); cargarHistorial(i) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{h.nombre}</div>
                  {h.notas && <div className="text-[11px] text-muted truncate mt-0.5">{h.notas}</div>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="piz-btn-sm text-[10px]" onClick={() => cargarHistorial(i)}>Cargar</button>
                  <button className="piz-btn-sm text-[10px]" onClick={() => {
                    const a = document.createElement('a'); a.href = h.png; a.download = `pizarra-${i+1}.png`; a.click()
                  }}>💾</button>
                  <button className="piz-btn-sm text-[10px] hover:!text-rojo" onClick={() => borrarHistorialItem(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
