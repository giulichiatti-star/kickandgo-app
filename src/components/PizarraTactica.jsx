import { useEffect, useRef, useState } from 'react'
import { listarPizarras, crearPizarra, actualizarPizarra, borrarPizarra } from '../lib/pizarras'
import '../pizarra-entrenos.css'

const W = 480, H = 660
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#fafafa']

function blankFrame() { return { items: [], lines: [] } }

const TOOLS = [
  { group: 'General', items: [{ id: 'select', label: 'Seleccionar / editar' }] },
  { group: 'Jugadores', items: [
    { id: 'propio', label: 'Jugador propio', dot: '#10b981' },
    { id: 'rival', label: 'Jugador rival', dot: '#ef4444' },
    { id: 'balon', label: 'Balón' },
  ] },
  { group: 'Material', items: [
    { id: 'cono', label: 'Cono' },
    { id: 'porteria', label: 'Portería / marca' },
    { id: 'obstaculo', label: 'Valla / obstáculo' },
  ] },
  { group: 'Trazos', items: [
    { id: 'flecha', label: 'Carrera / movimiento', dot: '#3b82f6' },
    { id: 'pase', label: 'Pase', dot: '#f59e0b' },
    { id: 'regate', label: 'Regate', dot: '#8b5cf6' },
  ] },
  { group: 'Zonas', items: [
    { id: 'zona', label: 'Zona / área' },
    { id: 'texto', label: 'Texto (doble clic para editar)' },
    { id: 'borrar', label: 'Borrar' },
  ] },
]

const ICONS = {
  select: '<path d="M4 4l7 17 2-7 7-2z"/>',
  propio: '<circle cx="12" cy="12" r="7"/>', rival: '<circle cx="12" cy="12" r="7"/>',
  balon: '<circle cx="12" cy="12" r="7"/><path d="M12 7l3 3-1 4h-4l-1-4z" stroke-width="1.2"/>',
  cono: '<path d="M12 4l5 15H7z"/><path d="M9 14h6" stroke-width="1.3"/>',
  porteria: '<path d="M6 19V6h12v13" /><path d="M6 6v13M18 6v13" stroke-width="1.4"/>',
  obstaculo: '<rect x="4" y="10" width="16" height="4" rx="1"/>',
  flecha: '<path d="M5 19 19 5"/><path d="M9 5h10v10"/>',
  pase: '<path d="M4 12h14" stroke-dasharray="2.5 2.5"/><path d="M13 7l5 5-5 5"/>',
  regate: '<path d="M4 18c3-2 3-4 6-4s3 4 6 4 3-4 4-6" stroke-width="2"/>',
  zona: '<rect x="4" y="6" width="16" height="12" rx="2" stroke-dasharray="3 2.5"/>',
  texto: '<path d="M5 5h14M12 5v14"/>', borrar: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
}
function svgIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
}

export default function PizarraTactica({ eid }) {
  const canvasRef = useRef(null)
  const railRef = useRef(null)
  const propsRef = useRef(null)
  const hintRef = useRef(null)
  const framesStripRef = useRef(null)
  const nameInputRef = useRef(null)
  const zoomValRef = useRef(null)
  const undoBtnRef = useRef(null)
  const redoBtnRef = useRef(null)
  const snapToggleRef = useRef(null)
  const playBtnRef = useRef(null)

  const engineRef = useRef({})
  const [guardando, setGuardando] = useState(false)
  const [guardadas, setGuardadas] = useState([])
  const [actualId, setActualId] = useState(null)
  const [cargandoLista, setCargandoLista] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      try { setGuardadas(await listarPizarras(eid)) }
      catch (e) { setMsg(e.message) }
      finally { setCargandoLista(false) }
    })()
  }, [eid])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let scale = 1, snap = false
    const GRID = 20

    const appRoot = canvas.closest('.pz-app') || document.documentElement
    function cssVar(n) { return getComputedStyle(appRoot).getPropertyValue(n).trim() }
    function sn(v) { return snap ? Math.round(v / GRID) * GRID : v }

    let current = 'select', currentColor = '#10b981', currentLineStyle = 'solid'
    let pendingStart = null, selected = null
    let jerseyCounter = 1, rivalCounter = 1
    let frames = [blankFrame()], frameIdx = 0, history = [], future = []
    let drag = null
    let dblclickCandidate = null, dblclickTime = 0

    function selectTool(id) {
      current = id
      railRef.current.querySelectorAll('.tool').forEach(b => b.classList.toggle('on', b.dataset.id === id))
      pendingStart = null
      if (id !== 'select') selected = null
      const hint = hintRef.current
      const showHint = ['flecha', 'pase', 'regate'].includes(id)
      if (showHint) { hint.textContent = 'Toca el punto de origen y luego el destino'; hint.classList.add('show') }
      else if (id === 'select') { hint.textContent = 'Toca un objeto para editarlo · arrastra para moverlo · Supr para borrar'; hint.classList.add('show') }
      else hint.classList.remove('show')
      renderProps()
    }

    function snapshot() { history.push(JSON.stringify(frames)); if (history.length > 50) history.shift(); future = []; updateUndoRedo() }
    function undo() { if (!history.length) return; future.push(JSON.stringify(frames)); frames = JSON.parse(history.pop()); if (frameIdx >= frames.length) frameIdx = frames.length - 1; selected = null; render(); renderFrames(); renderProps(); updateUndoRedo() }
    function redo() { if (!future.length) return; history.push(JSON.stringify(frames)); frames = JSON.parse(future.pop()); selected = null; render(); renderFrames(); renderProps(); updateUndoRedo() }
    function updateUndoRedo() { undoBtnRef.current.disabled = !history.length; redoBtnRef.current.disabled = !future.length }

    function pitchGrad(c) {
      const g = c.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, cssVar('--pz-cesped-1')); g.addColorStop(1, cssVar('--pz-cesped-2'))
      return g
    }
    function drawPitchOn(c, w, h) {
      c.clearRect(0, 0, w, h)
      c.save(); c.scale(w / W, h / H)
      c.fillStyle = pitchGrad(c); c.fillRect(0, 0, W, H)
      for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,.018)' : 'rgba(0,0,0,.02)'; c.fillRect(0, i * H / 10, W, H / 10) }
      c.strokeStyle = cssVar('--pz-linea'); c.lineWidth = 1.4
      c.strokeRect(10, 10, W - 20, H - 20)
      c.beginPath(); c.moveTo(10, H / 2); c.lineTo(W - 10, H / 2); c.stroke()
      c.beginPath(); c.arc(W / 2, H / 2, 58, 0, 7); c.stroke()
      c.beginPath(); c.arc(W / 2, H / 2, 2.5, 0, 7); c.fill()
      c.strokeRect(W / 2 - 110, H - 116, 220, 106); c.strokeRect(W / 2 - 110, 10, 220, 106)
      c.strokeRect(W / 2 - 46, H - 46, 92, 36); c.strokeRect(W / 2 - 46, 10, 92, 36)
      c.restore()
    }
    function drawPitch() { drawPitchOn(ctx, W, H) }

    function drawPlayer(p, isSel) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, 7)
      ctx.fillStyle = p.kind === 'rival' ? '#ef4444' : '#10b981'; ctx.fill()
      if (isSel) { ctx.lineWidth = 2.5; ctx.strokeStyle = '#fafafa'; ctx.stroke() }
      ctx.fillStyle = p.kind === 'rival' ? '#450a0a' : '#04140d'
      ctx.font = '800 12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(p.num, p.x, p.y + 0.5)
      if (p.name) { ctx.font = '700 8.5px Inter'; ctx.fillStyle = cssVar('--pz-texto'); ctx.fillText(p.name, p.x, p.y + 24) }
    }
    function drawBall(p, isSel) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.fillStyle = '#f5f5f0'; ctx.fill()
      ctx.strokeStyle = isSel ? '#fafafa' : '#8a8a80'; ctx.lineWidth = isSel ? 2 : 1; ctx.stroke()
    }
    function drawCono(p, isSel) {
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 13); ctx.lineTo(p.x + 9, p.y + 8); ctx.lineTo(p.x - 9, p.y + 8); ctx.closePath()
      ctx.fillStyle = '#f59e0b'; ctx.fill()
      if (isSel) { ctx.lineWidth = 2; ctx.strokeStyle = '#fafafa'; ctx.stroke() }
    }
    function drawPorteria(p, isSel) { ctx.strokeStyle = isSel ? '#fafafa' : '#94a3b8'; ctx.lineWidth = isSel ? 3 : 2.2; ctx.strokeRect(p.x - 15, p.y - 9, 30, 18) }
    function drawObstaculo(p, isSel) {
      ctx.fillStyle = '#8b5cf6'; ctx.fillRect(p.x - 16, p.y - 4, 32, 8)
      ctx.fillStyle = '#fafafa'; for (let i = -14; i < 16; i += 8) ctx.fillRect(p.x + i, p.y - 4, 4, 8)
      if (isSel) { ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 1.5; ctx.strokeRect(p.x - 17, p.y - 6, 34, 12) }
    }
    function drawZona(p, isSel) {
      ctx.setLineDash([5, 4]); ctx.strokeStyle = isSel ? '#fafafa' : '#8b5cf6'; ctx.lineWidth = 1.6
      ctx.strokeRect(p.x - (p.w || 34), p.y - (p.h || 34), (p.w || 34) * 2, (p.h || 34) * 2)
      ctx.fillStyle = 'rgba(139,92,246,.08)'; ctx.fillRect(p.x - (p.w || 34), p.y - (p.h || 34), (p.w || 34) * 2, (p.h || 34) * 2)
      ctx.setLineDash([])
      if (isSel) { ctx.fillStyle = '#fafafa'; ctx.fillRect(p.x + (p.w || 34) - 4, p.y + (p.h || 34) - 4, 8, 8) }
    }
    function drawTexto(p, isSel) {
      ctx.font = '700 12px Inter'; ctx.fillStyle = isSel ? '#34d399' : cssVar('--pz-texto'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(p.text || 'Texto', p.x, p.y)
    }
    function drawItem(p, isSel) {
      if (p.kind === 'propio' || p.kind === 'rival') drawPlayer(p, isSel)
      else if (p.kind === 'balon') drawBall(p, isSel)
      else if (p.kind === 'cono') drawCono(p, isSel)
      else if (p.kind === 'porteria') drawPorteria(p, isSel)
      else if (p.kind === 'obstaculo') drawObstaculo(p, isSel)
      else if (p.kind === 'zona') drawZona(p, isSel)
      else if (p.kind === 'texto') drawTexto(p, isSel)
    }

    function drawLine(l, prog, isSel) {
      prog = prog === undefined ? 1 : prog
      const x2 = l.x1 + (l.x2 - l.x1) * prog, y2 = l.y1 + (l.y2 - l.y1) * prog
      ctx.save()
      ctx.strokeStyle = l.color; ctx.lineWidth = isSel ? 3.4 : 2.4
      if (l.style === 'dashed') ctx.setLineDash([6, 5])
      if (l.kind === 'regate') {
        ctx.beginPath()
        const dx = l.x2 - l.x1, dy = l.y2 - l.y1, len = Math.hypot(dx, dy) || 1, steps = Math.max(2, Math.floor(len / 14))
        ctx.moveTo(l.x1, l.y1)
        for (let i = 1; i <= steps; i++) {
          const t = i / steps; if (t > prog) break
          const px = l.x1 + dx * t, py = l.y1 + dy * t, nx = -dy / len, ny = dx / len, amp = (i % 2 === 0 ? 1 : -1) * 7
          ctx.lineTo(px + nx * amp, py + ny * amp)
        }
        ctx.stroke()
      } else { ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(x2, y2); ctx.stroke() }
      if (prog > 0.05) {
        const ang = Math.atan2(y2 - l.y1, x2 - l.x1); ctx.setLineDash([])
        ctx.beginPath(); ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - 10 * Math.cos(ang - 0.4), y2 - 10 * Math.sin(ang - 0.4))
        ctx.lineTo(x2 - 10 * Math.cos(ang + 0.4), y2 - 10 * Math.sin(ang + 0.4))
        ctx.closePath(); ctx.fillStyle = l.color; ctx.fill()
      }
      if (isSel) {
        ctx.fillStyle = '#fafafa'
        ctx.beginPath(); ctx.arc(l.x1, l.y1, 4, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.arc(l.x2, l.y2, 4, 0, 7); ctx.fill()
      }
      ctx.restore()
    }

    function render() {
      drawPitch()
      const f = frames[frameIdx]
      f.lines.forEach(l => drawLine(l, 1, selected && selected.obj === l))
      f.items.forEach(p => drawItem(p, selected && selected.obj === p))
    }

    function toCanvasXY(e) {
      const r = canvas.getBoundingClientRect()
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }
    }

    function hitItem(x, y) {
      const f = frames[frameIdx]
      for (let i = f.items.length - 1; i >= 0; i--) {
        const p = f.items[i]
        const rad = p.kind === 'propio' || p.kind === 'rival' ? 16 : p.kind === 'zona' ? Math.max(p.w || 34, p.h || 34) : 14
        if (Math.hypot(p.x - x, p.y - y) < rad) return p
      }
      return null
    }
    function hitLineEndpoint(x, y) {
      const f = frames[frameIdx]
      for (let i = f.lines.length - 1; i >= 0; i--) {
        const l = f.lines[i]
        if (Math.hypot(l.x1 - x, l.y1 - y) < 9) return { line: l, end: 'x1y1' }
        if (Math.hypot(l.x2 - x, l.y2 - y) < 9) return { line: l, end: 'x2y2' }
      }
      return null
    }
    function distToSeg(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy
      const t = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0
      const cx = x1 + t * dx, cy = y1 + t * dy
      return Math.hypot(px - cx, py - cy)
    }
    function hitLine(x, y) {
      const f = frames[frameIdx]
      for (let i = f.lines.length - 1; i >= 0; i--) {
        if (distToSeg(x, y, f.lines[i].x1, f.lines[i].y1, f.lines[i].x2, f.lines[i].y2) < 8) return f.lines[i]
      }
      return null
    }
    function zoneHandle(x, y) {
      const f = frames[frameIdx]
      for (let i = f.items.length - 1; i >= 0; i--) {
        const p = f.items[i]; if (p.kind !== 'zona') continue
        if (Math.hypot(p.x + (p.w || 34) - x, p.y + (p.h || 34) - y) < 10) return p
      }
      return null
    }

    function onPointerDown(e) {
      const pt = toCanvasXY(e)
      if (current === 'borrar') {
        const hit = hitItem(pt.x, pt.y) || hitLine(pt.x, pt.y)
        if (hit) { snapshot(); const f = frames[frameIdx]; f.items = f.items.filter(p => p !== hit); f.lines = f.lines.filter(l => l !== hit); render() }
        return
      }
      if (current === 'flecha' || current === 'pase' || current === 'regate') {
        if (!pendingStart) { pendingStart = { x: sn(pt.x), y: sn(pt.y) } }
        else {
          snapshot()
          frames[frameIdx].lines.push({ kind: current, color: currentColor, style: currentLineStyle, x1: pendingStart.x, y1: pendingStart.y, x2: sn(pt.x), y2: sn(pt.y) })
          pendingStart = null; render()
        }
        return
      }
      if (current === 'select') {
        const zh = zoneHandle(pt.x, pt.y)
        if (zh) { selected = { obj: zh, type: 'zona' }; drag = { mode: 'resize', obj: zh }; snapshot(); renderProps(); render(); return }
        const ep = hitLineEndpoint(pt.x, pt.y)
        if (ep) { selected = { obj: ep.line, type: 'linea' }; drag = { mode: 'endpoint', end: ep.end, line: ep.line }; snapshot(); renderProps(); render(); return }
        const it = hitItem(pt.x, pt.y)
        if (it) {
          if (dblclickCandidate === it && Date.now() - dblclickTime < 380 && it.kind === 'texto') {
            const nv = prompt('Editar texto:', it.text || ''); if (nv !== null) { snapshot(); it.text = nv; render() }
            dblclickCandidate = null; return
          }
          dblclickCandidate = it; dblclickTime = Date.now()
          selected = { obj: it, type: it.kind }; drag = { mode: 'move', obj: it }; snapshot(); renderProps(); render(); return
        }
        const ln = hitLine(pt.x, pt.y)
        if (ln) { selected = { obj: ln, type: 'linea' }; drag = null; renderProps(); render(); return }
        selected = null; drag = null; renderProps(); render(); return
      }

      snapshot()
      const item = { id: 'i' + Date.now() + Math.random(), kind: current, x: sn(pt.x), y: sn(pt.y) }
      if (current === 'propio') { item.num = jerseyCounter++; if (jerseyCounter > 11) jerseyCounter = 1; item.name = '' }
      if (current === 'rival') { item.num = rivalCounter++; if (rivalCounter > 11) rivalCounter = 1; item.name = '' }
      if (current === 'texto') item.text = prompt('Texto:', 'Nota') || 'Texto'
      if (current === 'zona') { item.w = 34; item.h = 34 }
      frames[frameIdx].items.push(item)
      selected = { obj: item, type: item.kind }; drag = { mode: 'move', obj: item }
      render(); renderProps()
    }

    function onPointerMove(e) {
      if (!drag) return
      const pt = toCanvasXY(e)
      if (drag.mode === 'move') { drag.obj.x = sn(Math.max(14, Math.min(W - 14, pt.x))); drag.obj.y = sn(Math.max(14, Math.min(H - 14, pt.y))) }
      else if (drag.mode === 'endpoint') {
        if (drag.end === 'x1y1') { drag.line.x1 = sn(pt.x); drag.line.y1 = sn(pt.y) } else { drag.line.x2 = sn(pt.x); drag.line.y2 = sn(pt.y) }
      } else if (drag.mode === 'resize') {
        drag.obj.w = Math.max(14, sn(Math.abs(pt.x - drag.obj.x))); drag.obj.h = Math.max(14, sn(Math.abs(pt.y - drag.obj.y)))
      }
      render()
    }
    function onPointerUp() { drag = null }

    function onKeyDown(e) {
      if (!document.body.contains(canvas)) return
      const tag = document.activeElement && document.activeElement.tagName
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && tag !== 'INPUT') {
        snapshot()
        const f = frames[frameIdx]
        f.items = f.items.filter(p => p !== selected.obj)
        f.lines = f.lines.filter(l => l !== selected.obj)
        selected = null; render(); renderProps()
        e.preventDefault()
      }
      if (e.key === 'Escape') { pendingStart = null; selected = null; render(); renderProps(); hintRef.current.classList.remove('show') }
      if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) { undo(); e.preventDefault() }
      if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { redo(); e.preventDefault() }
    }

    function renderProps() {
      const body = propsRef.current
      if (current !== 'select' || !selected) {
        body.innerHTML = `<div class="pz-empty-props">${current === 'select' ? 'Selecciona un objeto del campo para ver y editar sus propiedades (número, nombre, color, tamaño).' : 'Elige un color para la próxima figura que coloques.'}</div>`
        if (current !== 'select') {
          const sw = document.createElement('div'); sw.className = 'pz-swatches'; sw.style.marginTop = '8px'
          COLORS.forEach(c => {
            const s = document.createElement('div'); s.className = 'pz-swatch' + (c === currentColor ? ' on' : ''); s.style.background = c
            s.onclick = () => { currentColor = c; renderProps() }
            sw.appendChild(s)
          })
          body.appendChild(sw)
          if (['flecha', 'pase', 'regate'].includes(current)) {
            const row = document.createElement('div'); row.className = 'pz-prop-row'
            row.innerHTML = '<span class="pz-lbl">Trazo</span>'
            const seg = document.createElement('div'); seg.className = 'pz-seg'
            ;['solid', 'dashed'].forEach(v => {
              const b = document.createElement('button'); b.textContent = v === 'solid' ? 'continuo' : 'punteado'
              b.className = currentLineStyle === v ? 'on' : ''
              b.onclick = () => { currentLineStyle = v; renderProps() }
              seg.appendChild(b)
            })
            row.appendChild(seg); body.appendChild(row)
          }
        }
        return
      }
      const o = selected.obj
      let html = ''
      if (o.kind === 'propio' || o.kind === 'rival') {
        html = `<div class="pz-prop-row"><span class="pz-lbl">Dorsal</span><input class="pz-mini-input" id="pz2-num" type="number" value="${o.num}" min="1" max="99"></div>` +
          `<div class="pz-prop-row"><span class="pz-lbl">Nombre</span><input class="pz-mini-input" id="pz2-name" style="width:110px;text-align:left" value="${o.name || ''}" placeholder="opcional"></div>`
      } else if (selected.type === 'zona') {
        html = '<div class="pz-empty-props">Arrastra el punto inferior derecho para redimensionar.</div>'
      } else if (selected.type === 'texto') {
        html = '<div class="pz-empty-props">Doble clic sobre el texto en el campo para editarlo.</div>'
      } else if (selected.type === 'linea') {
        const sw = '<div class="pz-swatches">' + COLORS.map(c => `<div class="pz-swatch ${o.color === c ? 'on' : ''}" data-c="${c}" style="background:${c}"></div>`).join('') + '</div>'
        html = sw + `<div class="pz-prop-row"><span class="pz-lbl">Trazo</span><div class="pz-seg" id="pz2-lnstyle">${['solid', 'dashed'].map(v => `<button data-v="${v}" class="${o.style === v ? 'on' : ''}">${v === 'solid' ? 'continuo' : 'punteado'}</button>`).join('')}</div></div>`
      } else { html = '<div class="pz-empty-props">Objeto sin propiedades editables.</div>' }

      body.innerHTML = html + '<button class="pz-del-obj" id="pz2-delobj">Eliminar del campo</button>'
      const pNum = body.querySelector('#pz2-num')
      if (pNum) pNum.oninput = function () { o.num = parseInt(this.value) || 0; render() }
      const pName = body.querySelector('#pz2-name')
      if (pName) pName.oninput = function () { o.name = this.value; render() }
      if (selected.type === 'linea') {
        body.querySelectorAll('.pz-swatch').forEach(s => { s.onclick = () => { o.color = s.dataset.c; render(); renderProps() } })
        const lnSeg = body.querySelector('#pz2-lnstyle')
        if (lnSeg) lnSeg.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; o.style = b.dataset.v; render(); renderProps() }
      }
      body.querySelector('#pz2-delobj').onclick = () => {
        snapshot(); const f = frames[frameIdx]
        f.items = f.items.filter(p => p !== o); f.lines = f.lines.filter(l => l !== o)
        selected = null; render(); renderProps()
      }
    }

    function renderFrames() {
      const wrap = framesStripRef.current
      wrap.innerHTML = ''
      frames.forEach((f, i) => {
        const d = document.createElement('div'); d.className = 'pz-frame' + (i === frameIdx ? ' on' : '')
        const mc = document.createElement('canvas'); mc.width = 104; mc.height = 76
        const mctx = mc.getContext('2d')
        drawPitchOn(mctx, 104, 76)
        mctx.save(); mctx.scale(104 / W, 76 / H)
        f.lines.forEach(l => { mctx.beginPath(); mctx.strokeStyle = l.color; mctx.lineWidth = 3; mctx.moveTo(l.x1, l.y1); mctx.lineTo(l.x2, l.y2); mctx.stroke() })
        f.items.forEach(p => {
          mctx.beginPath(); mctx.arc(p.x, p.y, 12, 0, 7)
          mctx.fillStyle = p.kind === 'rival' ? '#ef4444' : p.kind === 'propio' ? '#10b981' : p.kind === 'balon' ? '#f5f5f0' : p.kind === 'cono' ? '#f59e0b' : '#8b5cf6'
          mctx.fill()
        })
        mctx.restore()
        d.appendChild(mc)
        const fn = document.createElement('span'); fn.className = 'pz-fn'; fn.textContent = 'F' + (i + 1); d.appendChild(fn)
        if (frames.length > 1) { const fx = document.createElement('span'); fx.className = 'pz-fx'; fx.textContent = '×'; d.appendChild(fx) }
        d.onclick = (e) => {
          if (e.target.classList.contains('pz-fx')) {
            if (frames.length > 1) { snapshot(); frames.splice(i, 1); if (frameIdx >= frames.length) frameIdx = frames.length - 1; selected = null; render(); renderFrames(); renderProps() }
            return
          }
          frameIdx = i; selected = null; render(); renderFrames(); renderProps()
        }
        wrap.appendChild(d)
      })
    }

    let speed = 1
    function play() {
      selected = null
      if (frames.length < 2) {
        const f = frames[frameIdx]; let t0 = null
        function step(ts) {
          if (!t0) t0 = ts
          const prog = Math.min(1, (ts - t0) / (900 / speed))
          drawPitch()
          f.items.forEach(p => drawItem(p, false))
          f.lines.forEach(l => drawLine(l, prog, false))
          if (prog < 1) requestAnimationFrame(step); else render()
        }
        requestAnimationFrame(step)
        return
      }
      let idx = 0
      function playFrame() {
        frameIdx = idx; render(); renderFrames()
        idx++
        if (idx < frames.length) setTimeout(playFrame, 700 / speed)
      }
      playFrame()
    }

    // Rail de herramientas
    railRef.current.innerHTML = ''
    TOOLS.forEach(g => {
      const wrap = document.createElement('div'); wrap.className = 'pz-rail-group'
      const lbl = document.createElement('div'); lbl.className = 'pz-rail-label'; lbl.textContent = g.group.slice(0, 4)
      wrap.appendChild(lbl)
      g.items.forEach(t => {
        const b = document.createElement('button'); b.className = 'pz-tool'; b.dataset.id = t.id; b.title = t.label
        b.innerHTML = svgIcon(t.id) + (t.dot ? `<span class="pz-dot" style="background:${t.dot}"></span>` : '')
        b.onclick = () => selectTool(t.id)
        wrap.appendChild(b)
      })
      railRef.current.appendChild(wrap)
    })

    // API expuesta a React (guardar/cargar desde la lista lateral)
    engineRef.current.getState = () => ({ frames })
    engineRef.current.loadFrames = (newFrames) => {
      frames = newFrames && newFrames.length ? JSON.parse(JSON.stringify(newFrames)) : [blankFrame()]
      frameIdx = 0; selected = null; history = []; future = []
      updateUndoRedo(); render(); renderFrames(); renderProps()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)
    document.addEventListener('keydown', onKeyDown)

    undoBtnRef.current.onclick = undo
    redoBtnRef.current.onclick = redo
    playBtnRef.current.onclick = play
    document.getElementById('pz2-clear').onclick = () => { snapshot(); frames[frameIdx] = blankFrame(); selected = null; render(); renderProps() }
    document.getElementById('pz2-zoomin').onclick = () => setZoom(scale + 0.1)
    document.getElementById('pz2-zoomout').onclick = () => setZoom(scale - 0.1)
    function setZoom(s) {
      scale = Math.max(0.6, Math.min(1.6, s))
      canvas.style.width = (420 * scale) + 'px'; canvas.style.height = (578 * scale) + 'px'
      zoomValRef.current.textContent = Math.round(scale * 100) + '%'
    }
    snapToggleRef.current.onclick = function () { snap = !snap; this.classList.toggle('on', snap) }
    document.getElementById('pz2-addframe').onclick = () => {
      snapshot()
      const copy = JSON.parse(JSON.stringify(frames[frameIdx]))
      frames.splice(frameIdx + 1, 0, copy); frameIdx++
      render(); renderFrames()
    }
    document.getElementById('pz2-speed').onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return
      speed = parseFloat(b.dataset.v)
      Array.from(e.currentTarget.children).forEach(c => c.classList.remove('on'))
      b.classList.add('on')
    }
    document.getElementById('pz2-exportjson').onclick = () => {
      const data = { nombre: nameInputRef.current.value, frames }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = (nameInputRef.current.value || 'ejercicio').replace(/\s+/g, '_') + '.json'
      a.click()
    }
    document.getElementById('pz2-exportpng').onclick = () => {
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png')
      a.download = (nameInputRef.current.value || 'ejercicio').replace(/\s+/g, '_') + '_frame' + (frameIdx + 1) + '.png'
      a.click()
    }

    // Ejemplo inicial de demostración
    frames[0].items = [
      { id: 'p1', kind: 'propio', x: 240, y: 470, num: 1, name: '' },
      { id: 'p2', kind: 'propio', x: 90, y: 470, num: 7, name: '' },
      { id: 'p3', kind: 'propio', x: 390, y: 470, num: 9, name: '' },
      { id: 'p4', kind: 'rival', x: 190, y: 300, num: 2, name: '' },
      { id: 'p5', kind: 'rival', x: 310, y: 300, num: 5, name: '' },
      { id: 'b1', kind: 'balon', x: 240, y: 470 },
    ]
    jerseyCounter = 8; rivalCounter = 3
    frames[0].lines = [
      { kind: 'flecha', color: '#3b82f6', style: 'solid', x1: 90, y1: 470, x2: 170, y2: 360 },
      { kind: 'pase', color: '#f59e0b', style: 'dashed', x1: 240, y1: 470, x2: 390, y2: 470 },
    ]

    selectTool('select')
    render(); renderFrames(); renderProps(); updateUndoRedo()

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function guardar() {
    setGuardando(true); setMsg('')
    try {
      const { frames } = engineRef.current.getState()
      const nombre = nameInputRef.current.value || 'Nuevo ejercicio'
      if (actualId) {
        const act = await actualizarPizarra(actualId, nombre, frames)
        setGuardadas(gs => gs.map(g => g.id === actualId ? act : g))
      } else {
        const nueva = await crearPizarra(nombre, frames, eid)
        setGuardadas(gs => [nueva, ...gs])
        setActualId(nueva.id)
      }
      setMsg('✅ Guardado')
      setTimeout(() => setMsg(''), 1800)
    } catch (e) { setMsg('⚠️ ' + e.message) }
    finally { setGuardando(false) }
  }

  function nuevo() {
    setActualId(null)
    nameInputRef.current.value = 'Nuevo ejercicio'
    engineRef.current.loadFrames([blankFrame()])
  }

  function cargar(p) {
    setActualId(p.id)
    nameInputRef.current.value = p.nombre
    engineRef.current.loadFrames(p.frames)
  }

  async function eliminar(p, e) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    try {
      await borrarPizarra(p.id)
      setGuardadas(gs => gs.filter(g => g.id !== p.id))
      if (actualId === p.id) nuevo()
    } catch (e2) { setMsg('⚠️ ' + e2.message) }
  }

  return (
    <div className="pz-app">
      <div className="pz-topbar">
        <div className="pz-tb-left">
          <div className="pz-tb-logo">K</div>
          <div className="pz-tb-titles">
            <input ref={nameInputRef} className="pz-tb-title-input" defaultValue="Rondo de posesión 4v2" />
            <div className="pz-tb-sub">Entrenamientos · Pizarra{msg ? ` · ${msg}` : ''}</div>
          </div>
        </div>
        <div className="pz-tb-right">
          <button ref={undoBtnRef} className="pz-ibtn" title="Deshacer (Ctrl+Z)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg></button>
          <button ref={redoBtnRef} className="pz-ibtn" title="Rehacer (Ctrl+Shift+Z)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg></button>
          <div className="pz-divider-v" />
          <button id="pz2-clear" className="pz-ibtn" title="Vaciar frame"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" /></svg></button>
          <div className="pz-divider-v" />
          <button id="pz2-exportjson" className="pz-btn-ghost" title="Descargar JSON del ejercicio">JSON</button>
          <button id="pz2-exportpng" className="pz-btn-ghost" title="Descargar PNG del frame actual">PNG</button>
          <button className="pz-btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : '✓ Guardar'}
          </button>
        </div>
      </div>

      <div className="pz-body-wrap">
        <div className="pz-rail" ref={railRef} />
        <div className="pz-canvas-wrap">
          <div className="pz-hint" ref={hintRef} />
          <canvas ref={canvasRef} width={W} height={H} />
          <div className="pz-zoom-hud">
            <button id="pz2-zoomout">−</button><span ref={zoomValRef}>100%</span><button id="pz2-zoomin">+</button>
          </div>
          <div className="pz-snap-hud">
            <span>Imán a cuadrícula</span>
            <div className="pz-toggle" ref={snapToggleRef}><div className="pz-kn" /></div>
          </div>
        </div>
        <div className="pz-side">
          <div className="pz-side-sec">
            <div className="pz-side-h">Propiedades</div>
            <div ref={propsRef} />
          </div>
          <div className="pz-side-sec" style={{ flex: 1 }}>
            <div className="pz-side-h">Ejercicios guardados<span>{cargandoLista ? '…' : guardadas.length}</span></div>
            {guardadas.map(p => (
              <div key={p.id} className={'pz-drill' + (actualId === p.id ? ' on' : '')} onClick={() => cargar(p)}>
                <div className="pz-drill-thumb" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pz-drill-name">{p.nombre}</div>
                  <div className="pz-drill-meta">{(p.frames || []).length} frame{(p.frames || []).length === 1 ? '' : 's'}</div>
                </div>
                <button className="pz-drill-del" onClick={(e) => eliminar(p, e)} title="Eliminar">✕</button>
              </div>
            ))}
            <button className="pz-add-drill" onClick={nuevo}>+ Nuevo ejercicio</button>
          </div>
        </div>
      </div>

      <div className="pz-timeline">
        <button ref={playBtnRef} className="pz-tl-play" title="Reproducir secuencia"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></button>
        <div className="pz-frames" ref={framesStripRef} />
        <button id="pz2-addframe" className="pz-frame-add" title="Duplicar frame actual"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg></button>
        <div className="pz-tl-speed">
          <span>Velocidad</span>
          <div className="pz-seg" id="pz2-speed"><button data-v="0.6">×0.6</button><button data-v="1" className="on">×1</button><button data-v="1.8">×1.8</button></div>
        </div>
      </div>
    </div>
  )
}
