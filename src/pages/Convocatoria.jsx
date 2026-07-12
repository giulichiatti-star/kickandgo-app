import { useEffect, useMemo, useRef, useState } from 'react'
import { listarJugadores, posACat } from '../lib/jugadores'
import { guardarConvocatoria, ultimaConvocatoria } from '../lib/convocatorias'
import { nTitulares, nSuplentes, formacionesPara, formacionDefecto, categoriaSlot, rolSugeridoSlot } from '../lib/formaciones'
import { useEquipo } from '../contexts/EquipoContext'
import { listarLesiones } from '../lib/lesiones'
import Jersey from '../components/Jersey'
import PWAInstallBanner from '../components/PWAInstallBanner'
import { usePWAInstall } from '../hooks/usePWAInstall'
import '../ev2.css'

export default function Convocatoria() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [jugadores, setJugadores] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [suplentes, setSuplentes] = useState([])
  const [rival, setRival] = useState('')
  const [fecha, setFecha] = useState('')
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')
  const [tipo, setTipo] = useState('11')
  const [formacion, setFormacion] = useState('4-3-3')
  const [club, setClub] = useState('')
  const [lesActivas, setLesActivas] = useState([])
  const [picker, setPicker] = useState(null) // { slot } | null
  const [draggingSlot, setDraggingSlot] = useState(null)
  const [mostrarPWAConvo, setMostrarPWAConvo] = useState(false)
  const [menuEnviar, setMenuEnviar] = useState(false)
  const { instalar, descartar: descartarBase } = usePWAInstall('convocatoria')

  // Drag state sin re-renders en cada pointermove
  const dragRef = useRef({ slot: null, isDragging: false, startX: 0, startY: 0 })
  const justDraggedRef = useRef(false)

  const MAX_TIT = nTitulares(tipo)
  const MAX_SUP = nSuplentes(tipo)
  const coords = formacionesPara(tipo)[formacion] || Object.values(formacionesPara(tipo))[0]

  useEffect(() => {
    (async () => {
      try {
        const t = equipoActivo?.tipo_equipo || '11'
        setTipo(t)
        setClub(equipoActivo?.nombre || '')
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
          const tits = (ult.titulares || []).map(x => x.id).filter(Boolean)
          const arr = new Array(nSlots).fill(null)
          tits.slice(0, nSlots).forEach((id, i) => { arr[i] = id })
          setAsignaciones(arr)
          setSuplentes((ult.suplentes || []).map(s => s.id).filter(Boolean))
        } else {
          setAsignaciones(new Array(nSlots).fill(null))
        }
      } catch (e) { setMsg(e.message) }
      finally { setCargando(false) }
    })()
  }, [eid])

  function cambiarFormacion(f) {
    setFormacion(f)
    const nuevos = (formacionesPara(tipo)[f] || []).length
    setAsignaciones(a => {
      const arr = new Array(nuevos).fill(null)
      a.forEach((id, i) => { if (id && i < nuevos) arr[i] = id })
      return arr
    })
  }

  const byId = id => jugadores.find(j => j.id === id)
  const idsEnCampo = asignaciones.filter(Boolean)
  const yaConvocado = id => idsEnCampo.includes(id) || suplentes.includes(id)
  const hayPortero = asignaciones[0] != null

  function asignarSlot(slot, jugadorId) {
    setAsignaciones(a => {
      const arr = [...a]
      const prevIdx = arr.findIndex(id => id === jugadorId)
      if (prevIdx !== -1) arr[prevIdx] = null
      arr[slot] = jugadorId
      return arr
    })
    setSuplentes(s => s.filter(id => id !== jugadorId))
    setPicker(null)
  }

  function quitarSlot(slot) {
    setAsignaciones(a => { const arr = [...a]; arr[slot] = null; return arr })
    setPicker(null)
  }

  function swapSlots(src, dst) {
    setAsignaciones(a => {
      const arr = [...a]
      const tmp = arr[dst]
      arr[dst] = arr[src]
      arr[src] = tmp
      return arr
    })
  }

  function agregarSuplente(jugadorId) {
    setAsignaciones(a => a.map(id => id === jugadorId ? null : id))
    setSuplentes(s => s.includes(jugadorId) ? s : [...s, jugadorId])
    setPicker(null)
  }

  function quitarSuplente(id) {
    setSuplentes(s => s.filter(x => x !== id))
  }

  function limpiarTodo() {
    if (!confirm('¿Vaciar la convocatoria (titulares y suplentes)?')) return
    setAsignaciones(new Array(coords.length).fill(null))
    setSuplentes([])
    setMsg('')
  }

  // ── Drag & drop con pointer events (touch + mouse) ──────────────────────
  function onPitchPointerDown(e) {
    const el = e.target.closest('[data-conv-slot]')
    if (!el) return
    const slot = parseInt(el.dataset.convSlot)
    if (!asignaciones[slot]) return // slot vacío → click lo abre
    dragRef.current = { slot, isDragging: false, startX: e.clientX, startY: e.clientY }
    setDraggingSlot(slot)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPitchPointerMove(e) {
    if (dragRef.current.slot === null) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.sqrt(dx * dx + dy * dy) > 12) dragRef.current.isDragging = true
  }

  function onPitchPointerUp(e) {
    const { slot: src, isDragging } = dragRef.current
    dragRef.current = { slot: null, isDragging: false, startX: 0, startY: 0 }
    setDraggingSlot(null)
    if (src === null) return

    if (!isDragging) {
      // Fue un tap: abrir picker
      setPicker({ slot: src })
      return
    }

    // Fue un drag: encontrar slot destino bajo el dedo
    justDraggedRef.current = true
    setTimeout(() => { justDraggedRef.current = false }, 100)
    const els = document.elementsFromPoint(e.clientX, e.clientY)
    const targetEl = els.find(el => el.dataset && el.dataset.convSlot !== undefined)
    if (targetEl) {
      const dst = parseInt(targetEl.dataset.convSlot)
      if (dst !== src) swapSlots(src, dst)
    }
  }

  // Click solo para slots vacíos (los ocupados los maneja pointerup)
  function onSlotClick(i) {
    if (justDraggedRef.current) return
    if (asignaciones[i]) return
    setPicker({ slot: i })
  }
  // ────────────────────────────────────────────────────────────────────────

  // Grupo de posición por el texto real registrado en Plantilla — igual para
  // titulares y suplentes, sin depender del slot táctico (orden pedido:
  // Portero, Defensas, Medio campo, Extremo, Delantero).
  function grupoPosicion(posicion) {
    const p = (posicion || '').toLowerCase()
    if (/portero|arquero|guardameta/.test(p)) return 'Portero'
    if (/lateral|central|defensa|carrilero/.test(p)) return 'Defensas'
    if (/extremo/.test(p)) return 'Extremo'
    if (/medio|pivote|mediapunta|interior|volante|enganche/.test(p)) return 'Medio campo'
    return 'Delantero'
  }
  const ORDEN_GRUPOS = ['Portero', 'Defensas', 'Medio campo', 'Extremo', 'Delantero']

  function agrupar(ids) {
    const jugs = ids.map(byId).filter(Boolean)
    const grupos = {}
    jugs.forEach(j => {
      const g = grupoPosicion(j.posicion)
      if (!grupos[g]) grupos[g] = []
      grupos[g].push(j)
    })
    return ORDEN_GRUPOS.map(g => ({ grupo: g, jugadores: grupos[g] || [] })).filter(x => x.jugadores.length)
  }

  const fechaFmt = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : null

  // Genera el PDF de la convocatoria (ventana de impresión → "Guardar como PDF").
  // modo 'confirmado'  → separa Titulares / Suplentes.
  // modo 'convocados'  → una sola lista agrupada por posición, sin decir quién es titular.
  // textoWhatsapp (opcional) → si se pasa, añade una barra con botón "Ir a WhatsApp"
  // dentro de la propia ventana (clic directo del usuario, así el navegador no lo bloquea).
  function generarPDF(modo, textoWhatsapp) {
    const escudo = equipoActivo?.escudo_url
    const filaJugador = j => {
      const lesion = lesActivas.find(l => l.jugador_id === j.id)
      return `<div class="jug">
        <span class="dorsal">${j.dorsal ?? '-'}</span>
        <span class="nombre">${j.nombre}</span>
        ${lesion ? '<span class="les">🩺 Lesión</span>' : ''}
      </div>`
    }
    const bloqueGrupos = grupos => grupos.map(({ grupo, jugadores }) => `
      <div class="grupo">
        <div class="grupo-h">${grupo}</div>
        ${jugadores.map(filaJugador).join('')}
      </div>`).join('')

    let cuerpo = ''
    if (modo === 'confirmado') {
      cuerpo = `
        <div class="seccion-h tit">⭐ TITULARES (${idsEnCampo.length}/${MAX_TIT})</div>
        ${bloqueGrupos(agrupar(idsEnCampo))}
        ${suplentes.length ? `<div class="seccion-h sup">🔄 SUPLENTES (${suplentes.length}/${MAX_SUP})</div>${bloqueGrupos(agrupar(suplentes))}` : ''}
      `
    } else {
      const todos = [...idsEnCampo, ...suplentes]
      cuerpo = `
        <div class="nota-conf">📋 Convocatoria — la alineación titular se confirma en el campo</div>
        ${bloqueGrupos(agrupar(todos))}
      `
    }

    const barraHtml = textoWhatsapp ? `
  <div class="toolbar">
    <button class="tb-btn tb-pdf" onclick="window.print()">🖨️ Guardar como PDF</button>
    <button class="tb-btn tb-wa" onclick="window.open('https://wa.me/?text=${encodeURIComponent(textoWhatsapp)}','_blank')">📲 Continuar a WhatsApp</button>
  </div>` : ''

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Convocatoria${rival ? ' vs ' + rival : ''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{margin:0}
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#0f0f11;color:#fafafa;padding:36px 40px;max-width:720px;margin:auto;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .toolbar{display:flex;gap:10px;margin-bottom:20px;padding:12px;background:#18181b;border:1px solid #27272a;border-radius:10px}
  .tb-btn{flex:1;padding:11px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
  .tb-pdf{background:#27272a;color:#fafafa}
  .tb-wa{background:#25d366;color:#062018}
  @media print{.toolbar{display:none}}
  .head{display:flex;align-items:center;gap:14px;margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #27272a}
  .escudo{width:54px;height:54px;border-radius:12px;object-fit:cover;background:#18181b;border:1px solid #27272a;flex-shrink:0}
  .escudo-ph{width:54px;height:54px;border-radius:12px;background:#18181b;border:1px solid #27272a;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px}
  .club{font-size:19px;font-weight:800;letter-spacing:-.3px}
  .meta{font-size:12px;color:#a1a1aa;margin-top:2px}
  .vs{font-size:13px;color:#34d399;font-weight:700;margin-top:3px}
  .nota-conf{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#fcd34d;font-size:12px;font-weight:600;
    padding:10px 14px;border-radius:8px;margin-bottom:18px}
  .seccion-h{font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;margin:20px 0 10px}
  .seccion-h.tit{color:#34d399}
  .seccion-h.sup{color:#60a5fa}
  .grupo{margin-bottom:12px;break-inside:avoid}
  .grupo-h{font-size:10.5px;font-weight:800;color:#71717a;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;
    border-bottom:1px solid #27272a;padding-bottom:3px}
  .jug{display:flex;align-items:center;gap:10px;padding:5px 2px;font-size:13.5px}
  .dorsal{width:26px;height:26px;border-radius:7px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);
    color:#34d399;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .nombre{flex:1;font-weight:600}
  .les{font-size:10px;font-weight:700;color:#fca5a5;background:rgba(239,68,68,.12);padding:2px 7px;border-radius:5px}
  .footer{margin-top:30px;padding-top:14px;border-top:1px solid #27272a;display:flex;justify-content:space-between;
    font-size:10.5px;color:#52525b}
  .footer b{color:#34d399}
</style></head><body>
  ${barraHtml}
  <div class="head">
    ${escudo ? `<img class="escudo" src="${escudo}"/>` : '<div class="escudo-ph">🛡️</div>'}
    <div>
      <div class="club">${club || 'Mi Equipo'}</div>
      <div class="meta">Fútbol ${tipo} · Formación ${formacion}</div>
      ${rival ? `<div class="vs">🆚 vs ${rival}${fechaFmt ? ' · ' + fechaFmt : ''}</div>` : ''}
    </div>
  </div>
  ${cuerpo}
  <div class="footer"><span>${club || 'Mi Equipo'}</span><span><b>Kick and Go</b> · ${new Date().toLocaleDateString('es-ES')}</span></div>
</body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.focus()
    // Con flujo de WhatsApp: el usuario controla los clics de la barra (guardar / ir a WhatsApp).
    // Descarga directa (sin WhatsApp): se imprime automáticamente al cargar, como antes.
    if (textoWhatsapp) return
    const doPrint = () => { try { w.print() } catch {} }
    const imgs = w.document.images
    if (!imgs.length) return setTimeout(doPrint, 400)
    let pend = imgs.length
    const done = () => { if (--pend <= 0) setTimeout(doPrint, 200) }
    Array.from(imgs).forEach(im => { if (im.complete) done(); else { im.onload = done; im.onerror = done } })
    setTimeout(doPrint, 3000)
  }

  // WhatsApp no permite adjuntar un archivo automáticamente desde un enlace —
  // solo puede pre-rellenar texto. Abrimos el PDF con una barra que tiene
  // "Guardar como PDF" e "Ir a WhatsApp" — ambos son clics directos del
  // usuario DENTRO de esa ventana, así el navegador no bloquea el segundo popup.
  function enviarPorWhatsapp(modo) {
    const texto = modo === 'confirmado'
      ? `Convocatoria de ${club || 'nuestro equipo'}${rival ? ' vs ' + rival : ''}. Adjunto el PDF con titulares y suplentes.`
      : `Convocatoria de ${club || 'nuestro equipo'}${rival ? ' vs ' + rival : ''}. Adjunto el PDF — la alineación se confirma en el campo.`
    generarPDF(modo, texto)
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
      .map((id, i) => id ? empaqueta(id, categoriaSlot(formacion, i)) : null)
      .filter(Boolean)
    try {
      await guardarConvocatoria({
        rival, fecha, formacion,
        titulares: titularesOrdenados,
        suplentes: suplentes.map(id => empaqueta(id, posACat(byId(id)?.posicion))),
      }, eid)
      setMsg('✅ Convocatoria guardada')
      // Mostrar banner PWA en las 3 primeras convocatorias
      const done = localStorage.getItem('kg_pwa_prompted_convocatoria')
      if (done !== 'done') {
        const count = parseInt(localStorage.getItem('kg_convo_count') || '0', 10) + 1
        localStorage.setItem('kg_convo_count', String(count))
        if (count <= 3) setMostrarPWAConvo(true)
        if (count >= 3) localStorage.setItem('kg_pwa_prompted_convocatoria', 'done')
      }
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  const disponibles = jugadores.filter(j => !yaConvocado(j.id))

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Convocatoria</h1>
          <p className="text-xs text-muted mt-0.5">
            {idsEnCampo.length + suplentes.length} / {MAX_TIT + MAX_SUP} · Fútbol {tipo}
          </p>
        </div>
        <div className="flex gap-1.5" style={{ position: 'relative' }}>
          <button className="btn btn-outline text-xs px-2.5 py-1.5" onClick={limpiarTodo} title="Limpiar">🧹</button>
          <button className="btn btn-outline text-xs px-2.5 py-1.5" onClick={() => generarPDF('convocados')}
            title="Descargar PDF (solo convocados)">📄</button>
          <button className="btn btn-outline text-xs px-2.5 py-1.5" onClick={() => setMenuEnviar(m => !m)}
            style={{ borderColor: '#25d366', color: '#25d366' }} title="Enviar por WhatsApp">📲</button>
          <button className="btn btn-primary text-sm px-4 py-1.5" onClick={guardar}>✓ Guardar</button>

          {menuEnviar && (
            <div onClick={() => setMenuEnviar(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 90 }}>
              <div onClick={e => e.stopPropagation()} className="card p-2"
                style={{
                  position: 'absolute', top: 42, right: 0, width: 240, zIndex: 91,
                  border: '1px solid rgba(37,211,102,.3)',
                }}>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wide px-2 pt-1 pb-2">
                  Elige cómo enviar
                </div>
                <button className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 text-xs"
                  onClick={() => { setMenuEnviar(false); enviarPorWhatsapp('confirmado') }}>
                  <div className="font-bold mb-0.5">⭐ Confirmar titulares</div>
                  <div className="text-muted" style={{ fontSize: 10.5 }}>PDF con titulares y suplentes separados</div>
                </button>
                <button className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 text-xs"
                  onClick={() => { setMenuEnviar(false); enviarPorWhatsapp('convocados') }}>
                  <div className="font-bold mb-0.5">📋 Solo convocatoria</div>
                  <div className="text-muted" style={{ fontSize: 10.5 }}>PDF único, sin decir quién es titular — se confirma en el campo</div>
                </button>
                <div className="text-[10px] text-muted px-2 pt-2 pb-1" style={{ lineHeight: 1.4 }}>
                  Se abre el PDF para guardarlo y luego WhatsApp para que lo adjuntes — WhatsApp no permite enviarlo automático desde la web.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wide">Rival</label>
          <input className="field mt-1" value={rival} onChange={e => setRival(e.target.value)} placeholder="Rival" />
        </div>
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wide">Fecha</label>
          <input className="field mt-1" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wide">Formación</label>
          <select className="field mt-1" value={formacion} onChange={e => cambiarFormacion(e.target.value)}>
            {Object.keys(formacionesPara(tipo)).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-muted mb-1">
          <span>{idsEnCampo.length}/{MAX_TIT} titulares · {suplentes.length}/{MAX_SUP} suplentes</span>
          <span>{idsEnCampo.length + suplentes.length}/{MAX_TIT + MAX_SUP}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden flex bg-white/5">
          <div style={{ width: `${(idsEnCampo.length / (MAX_TIT + MAX_SUP)) * 100}%`, background: '#2dd4bf', transition: 'width .2s' }} />
          <div style={{ width: `${(suplentes.length / (MAX_TIT + MAX_SUP)) * 100}%`, background: '#3b82f6', transition: 'width .2s' }} />
        </div>
      </div>

      {msg && <div className="text-xs mb-3 text-zinc-300">{msg}</div>}

      {jugadores.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No hay jugadores en la plantilla. Añádelos primero en <b className="text-cyan">Plantilla</b>.
        </div>
      ) : (
        <>
          {/* ── PIZARRA ── */}
          <div className="card p-3 mb-4">
            <div className="text-[11px] text-muted mb-2">
              {draggingSlot !== null
                ? '🔄 Arrastra a otra posición para intercambiar…'
                : '⚽ Titulares — toca para asignar · arrastra para mover'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                className="ev2-pitch"
                style={{
                  borderRadius: 10, position: 'relative',
                  width: '100%', maxWidth: 340, aspectRatio: '3/4',
                  // pan-y (no 'none'): permite deslizar verticalmente para hacer scroll
                  // de la página al tocar el campo. Solo las fichas ocupadas (abajo)
                  // bloquean el gesto nativo, porque ahí sí se puede arrastrar.
                  touchAction: 'pan-y', userSelect: 'none',
                }}
                onPointerDown={onPitchPointerDown}
                onPointerMove={onPitchPointerMove}
                onPointerUp={onPitchPointerUp}
              >
                <svg className="ev2-pitch-lines" viewBox="0 0 100 133" preserveAspectRatio="none">
                  <rect x="2" y="2" width="96" height="129" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                  <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                  <circle cx="50" cy="66.5" r="13" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.5" />
                  <rect x="24" y="107" width="52" height="24" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
                  <rect x="24" y="2" width="52" height="24" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="0.5" />
                </svg>
                {coords.map(([x, y], i) => {
                  const jid = asignaciones[i]
                  const j = jid ? byId(jid) : null
                  const lesion = j ? lesActivas.find(l => l.jugador_id === j.id) : null
                  const isDragging = draggingSlot === i
                  const isDropTarget = draggingSlot !== null && draggingSlot !== i && !!j
                  return (
                    <div
                      key={i}
                      data-conv-slot={i}
                      onClick={() => onSlotClick(i)}
                      className="ev2-player"
                      style={{
                        left: `${x}%`, top: `${y}%`,
                        position: 'absolute', transform: 'translate(-50%,-50%)',
                        outline: isDragging
                          ? '2px solid #f59e0b'
                          : isDropTarget ? '2px dashed rgba(245,158,11,.6)' : 'none',
                        borderRadius: '50%',
                        opacity: isDragging ? 0.55 : 1,
                        cursor: j ? 'grab' : 'pointer',
                        transition: 'opacity .15s, outline .1s',
                        // Solo la ficha con jugador bloquea el scroll nativo (ahí se arrastra);
                        // los slots vacíos dejan pasar el gesto para poder hacer scroll.
                        touchAction: j ? 'none' : 'pan-y',
                      }}
                    >
                      {j ? (
                        <>
                          <Jersey num={j.dorsal} side="local" gk={i === 0} vista="camisetas" />
                          <div className="ev2-pname">{j.nombre.split(' ')[0]}</div>
                        </>
                      ) : (
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          border: '2px dashed rgba(255,255,255,.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, color: 'rgba(255,255,255,.5)',
                        }}>+</div>
                      )}
                      {!j && <div className="ev2-pname" style={{ fontSize: 9 }}>{rolSugeridoSlot(tipo, formacion, i)}</div>}
                      {lesion && <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 11 }}>🩺</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── SUPLENTES + PLANTEL DISPONIBLE ── */}
          <div className="card p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-extrabold" style={{ color: '#3b82f6' }}>🔄 Suplentes</span>
              <span className="text-xs text-muted">{suplentes.length}/{MAX_SUP}</span>
            </div>

            {/* Suplentes ya seleccionados */}
            {suplentes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {suplentes.map(id => {
                  const j = byId(id); if (!j) return null
                  return (
                    <div key={id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.3)' }}>
                      <span>#{j.dorsal} {j.nombre.split(' ')[0]}</span>
                      <button onClick={() => quitarSuplente(id)}
                        className="text-muted hover:text-red-400 leading-none ml-0.5"
                        title="Quitar suplente">✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Lista del plantel disponible */}
            {suplentes.length >= MAX_SUP ? (
              <div className="text-xs text-muted text-center py-2">
                Suplentes al completo ({MAX_SUP}/{MAX_SUP})
              </div>
            ) : disponibles.length === 0 ? (
              <div className="text-xs text-muted text-center py-2">
                Todos los jugadores están en el campo
              </div>
            ) : (
              <>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">
                  Plantel disponible — toca para convocar
                </div>
                <div className="space-y-1">
                  {disponibles.map(j => {
                    const lesion = lesActivas.find(l => l.jugador_id === j.id)
                    const cat = posACat(j.posicion)
                    return (
                      <button key={j.id} onClick={() => agregarSuplente(j.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg border border-borde hover:bg-white/5 text-left transition-colors">
                        <span className="text-xs font-bold text-muted w-6 shrink-0">#{j.dorsal}</span>
                        <span className="flex-1 text-sm truncate">{j.nombre}</span>
                        {lesion && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>🩺</span>
                        )}
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/5">{cat}</span>
                        <span className="text-green-400 text-sm font-bold leading-none">+</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal para asignar jugador a un slot del campo */}
      {picker && (
        <SlotPicker
          slot={picker.slot}
          jugadores={jugadores}
          yaConvocado={yaConvocado}
          lesActivas={lesActivas}
          slotOcupado={asignaciones[picker.slot]}
          rolSlot={rolSugeridoSlot(tipo, formacion, picker.slot)}
          catSlot={categoriaSlot(formacion, picker.slot)}
          onElegir={id => asignarSlot(picker.slot, id)}
          onQuitar={asignaciones[picker.slot] ? () => quitarSlot(picker.slot) : null}
          onCerrar={() => setPicker(null)}
        />
      )}

      {mostrarPWAConvo && (
        <PWAInstallBanner
          onInstalar={async () => { await instalar(); setMostrarPWAConvo(false) }}
          onDescartar={() => { descartarBase(); setMostrarPWAConvo(false) }}
        />
      )}
    </div>
  )
}

function SlotPicker({ slot, jugadores, yaConvocado, lesActivas, slotOcupado, rolSlot, catSlot, onElegir, onQuitar, onCerrar }) {
  const [busqueda, setBusqueda] = useState('')

  const sugeridos = useMemo(() =>
    jugadores.filter(j => !yaConvocado(j.id) && posACat(j.posicion) === catSlot),
    [jugadores, catSlot]
  )

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return []
    const q = busqueda.trim().toLowerCase()
    return jugadores.filter(j => j.nombre.toLowerCase().includes(q) || String(j.dorsal).includes(q))
  }, [jugadores, busqueda])

  function Fila({ j }) {
    const lesion = lesActivas.find(l => l.jugador_id === j.id)
    const cat = posACat(j.posicion)
    return (
      <button onClick={() => onElegir(j.id)}
        className="w-full flex items-center gap-3 p-2 rounded-lg border border-borde hover:bg-white/5 text-left">
        <span className="text-xs font-bold text-muted w-6 shrink-0">#{j.dorsal}</span>
        <span className="flex-1 text-sm truncate">{j.nombre}</span>
        {lesion && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>🩺 LES</span>
        )}
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/5">{cat}</span>
      </button>
    )
  }

  return (
    <div onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card p-5"
        style={{ maxWidth: 440, width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(45,212,191,.3)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold">Posición: {rolSlot}</div>
          <button onClick={onCerrar} className="text-muted text-lg leading-none">✕</button>
        </div>

        {slotOcupado && onQuitar && (
          <button className="btn btn-outline text-xs w-full mb-3"
            style={{ color: '#f87171', borderColor: 'rgba(239,68,68,.3)' }}
            onClick={onQuitar}>
            ✕ Quitar jugador de esta posición
          </button>
        )}

        <input className="field mb-3" placeholder="Buscar por nombre o dorsal…"
          value={busqueda} onChange={e => setBusqueda(e.target.value)} autoFocus />

        {busqueda.trim() ? (
          <div className="space-y-1.5">
            {resultados.length === 0
              ? <div className="text-xs text-muted text-center py-4">Sin resultados</div>
              : resultados.map(j => <Fila key={j.id} j={j} />)
            }
          </div>
        ) : (
          <>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">
              Sugeridos para esta posición
            </div>
            <div className="space-y-1.5">
              {sugeridos.length === 0
                ? <div className="text-xs text-muted text-center py-4">No hay disponibles de esta posición — usa el buscador.</div>
                : sugeridos.map(j => <Fila key={j.id} j={j} />)
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}
