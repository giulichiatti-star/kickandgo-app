import { useEffect, useMemo, useRef, useState } from 'react'
import {
  COLOR_CAT, listarBiblioteca, listarEntrenos, guardarEntreno, borrarEntreno,
  crearEjercicio, actualizarEjercicio, borrarEjercicio,
  listarEjerciciosBase, ejercicioMatcheaQuery,
} from '../lib/entrenamientos'
import EjercicioBaseModal from '../components/EjercicioBaseModal'
import DiagramaEjercicio from '../components/DiagramaEjercicio'
import PizarraTactica from '../components/PizarraTactica'
import { listarPartidos } from '../lib/partidos'
import { getPerfil } from '../lib/perfil'
import { listarJugadores } from '../lib/jugadores'
import { listarLesiones } from '../lib/lesiones'
import { useEquipo } from '../contexts/EquipoContext'
import '../ent2.css'

/* ── Helpers ────────────────────────────────────────────── */
function lunesDe(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  d.setHours(0, 0, 0, 0); return d
}
function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const DIAS   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const DIAS_L = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
function fCorta(isoStr) {
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
function fLarga(isoStr) {
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

/* ── IA ─────────────────────────────────────────────────── */
const FOCOS = {
  fisico:     { obj:'Trabajo físico y resistencia',   cats:['Presión','Partido'] },
  tecnico:    { obj:'Trabajo técnico individual',     cats:['Posesión','Finalización'] },
  tactico:    { obj:'Trabajo táctico colectivo',      cats:['Transiciones','Posesión'] },
  partido:    { obj:'Partido condicionado',           cats:['Posesión','Partido'] },
  prepartido: { obj:'Activación pre-partido',         cats:['Balón parado','Finalización'] },
  defensa:    { obj:'Bloque defensivo y transiciones',cats:['Presión','Transiciones'] },
  ataque:     { obj:'Ataque y definición',            cats:['Finalización','Posesión'] },
}
function construirSesion(foco, bib) {
  const f = FOCOS[foco] || FOCOS.tecnico
  const warm = bib.find((e) => /calentamiento/i.test(e.categoria))
  const cool = bib.find((e) => /estiramiento/i.test(e.nombre))
  const mids = f.cats.map((c) => bib.find((e) => e.categoria === c)).filter(Boolean)
  return { objetivo: f.obj, ejercicios: [warm, ...mids, cool].filter(Boolean) }
}

/* ── Normalizar ejercicio ───────────────────────────────── */
function norm(e) {
  return {
    id:           e.id,
    nombre:       e.nombre || e.n || '',
    categoria:    e.categoria || e.cat || 'General',
    descripcion:  e.descripcion || e.desc || '',
    duracion_min: e.duracion_min || e.min || 15,
    intensidad:   e.intensidad || 'Media',
    zona_muscular:e.zona_muscular || e.zona || '',
    es_base:      e.es_base ?? false,
    imagen_url:   e.imagen_url || null,
    tags_ofensivos: e.tags_ofensivos || [],
    tags_defensivos: e.tags_defensivos || [],
    complejidad:  e.complejidad || '',
    competitividad: e.competitividad || '',
    jugadores:    e.jugadores || [],
  }
}

/* ── Componente principal ───────────────────────────────── */
export default function Entrenamientos() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const [biblioteca, setBiblioteca] = useState([])
  const [entrenos, setEntrenos]     = useState([])
  const [partidos, setPartidos]     = useState([])
  const [jugadores, setJugadores]   = useState([])
  const [lesiones, setLesiones]     = useState([])
  const [perfil, setPerfil]         = useState(null)
  const [cargando, setCargando]     = useState(true)
  const [semana, setSemana]         = useState(0)
  const [dias, setDias]             = useState({})
  const [diaSel, setDiaSel]         = useState(0)
  const [bibCat, setBibCat]         = useState('Todas')
  const [vistaTab, setVistaTab]     = useState('sesiones') // 'sesiones' | 'base'
  const [bibQ, setBibQ]             = useState('')
  const [msg, setMsg]               = useState('')
  const [showBib, setShowBib]       = useState(false)
  const [showGestion, setShowGestion] = useState(false)

  async function refrescar() {
    setCargando(true)
    try {
      const [p, bib, en, ps, js, ls] = await Promise.all([
        getPerfil().catch(() => null),
        listarBiblioteca(),
        listarEntrenos(eid),
        listarPartidos(eid).catch(() => []),
        listarJugadores(eid).catch(() => []),
        listarLesiones().catch(() => []),
      ])
      setPerfil(p)
      setBiblioteca(bib.map(norm))
      setEntrenos(en)
      setPartidos(ps)
      setJugadores(js)
      setLesiones(ls)
    } catch (e) { setMsg(e.message) } finally { setCargando(false) }
  }
  useEffect(() => { refrescar() }, [eid])

  /* Enriquecer ejercicio con descripción de biblioteca si le falta */
  function enriquecer(ej, bib) {
    if (ej.descripcion) return ej
    const found = bib.find((b) => b.nombre === ej.nombre)
    return found ? { ...ej, descripcion: found.descripcion, zona_muscular: found.zona_muscular } : ej
  }

  const lun  = lunesDe(semana)
  const isos = useMemo(() => Array.from({ length: 7 }, (_, i) => iso(addDays(lun, i))), [semana])

  useEffect(() => {
    const map = {}
    isos.forEach((d) => {
      const e = entrenos.find((x) => x.fecha === d)
      map[d] = e
        ? { id: e.id, objetivo: e.objetivo || '', notas: e.notas || '', ejercicios: (e.ejercicios || []).map((x) => enriquecer(norm(x), biblioteca)), asistencia: e.asistencia || {} }
        : { id: null, objetivo: '', notas: '', ejercicios: [], asistencia: {} }
    })
    setDias(map)
  }, [semana, entrenos, biblioteca])

  const upd  = (d, c) => setDias((m) => ({ ...m, [d]: { ...m[d], ...c } }))
  const isoS = isos[diaSel]
  const ses  = dias[isoS] || { ejercicios: [], notas: '' }
  const dur  = (d) => (dias[d]?.ejercicios || []).reduce((a, x) => a + (x.duracion_min || 0), 0)
  const minS = isos.reduce((a, d) => a + dur(d), 0)

  /* IA */
  function focoRec() {
    if (!partidos.length) return 'tecnico'
    const gc = partidos.slice(0, 3).reduce((a, p) => a + (p.gc || 0), 0)
    const gf = partidos.slice(0, 3).reduce((a, p) => a + (p.gf || 0), 0)
    if (gc >= 6) return 'defensa'; if (gf <= 2) return 'ataque'; return 'tactico'
  }
  function iaDia() {
    const s = construirSesion(focoRec(), biblioteca)
    upd(isoS, s); setMsg('✨ Sesión sugerida. Revisa y guarda.')
  }
  function completarSemana() {
    const plan = ['fisico','tecnico','tactico',focoRec(),'prepartido']
    setDias((m) => {
      const c = { ...m }
      isos.slice(0, 5).forEach((d, i) => {
        if (!(c[d]?.ejercicios || []).length) {
          const s = construirSesion(plan[i], biblioteca)
          c[d] = { ...c[d], ...s }
        }
      })
      return c
    })
    setMsg('✨ Semana propuesta. Revisa y pulsa Guardar semana.')
  }
  const recoTexto = useMemo(() => ({
    defensa:'Encajáis goles — semana enfocada en defensa y transiciones.',
    ataque: 'Falta gol — prioriza finalización y definición.',
    tactico:'Buen momento — trabajo táctico y posesión.',
    tecnico:'Base técnica y físico para arrancar.',
  })[focoRec()], [partidos])

  /* Guardar / borrar */
  async function guardarDia() {
    if (!ses.ejercicios.length) { setMsg('Añade al menos un ejercicio.'); return }
    try {
      await guardarEntreno({ id: ses.id, fecha: isoS, objetivo: ses.objetivo, notas: ses.notas, ejercicios: ses.ejercicios, asistencia: ses.asistencia }, eid)
      await refrescar(); setMsg('✅ Guardado.')
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }
  async function guardarSemana() {
    try {
      for (const d of isos) {
        const s = dias[d]
        if (s?.ejercicios.length) await guardarEntreno({ id: s.id, fecha: d, objetivo: s.objetivo, notas: s.notas, ejercicios: s.ejercicios, asistencia: s.asistencia }, eid)
      }
      await refrescar(); setMsg('✅ Semana guardada.')
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }
  async function borrarDia() {
    if (!confirm(`¿Borrar el entreno del ${DIAS_L[diaSel]}?`)) return
    if (ses.id) { await borrarEntreno(ses.id); await refrescar() }
    else upd(isoS, { objetivo: '', notas: '', ejercicios: [] })
    setMsg('🗑 Día vaciado.')
  }

  const addEj   = (e) => upd(isoS, { ejercicios: [...ses.ejercicios, enriquecer(e, biblioteca)] })
  const delEj   = (i) => upd(isoS, { ejercicios: ses.ejercicios.filter((_, k) => k !== i) })
  const updEj   = (i, campo, val) => upd(isoS, { ejercicios: ses.ejercicios.map((x, k) => k === i ? { ...x, [campo]: val } : x) })

  // Añade un ejercicio base a un día específico con overrides personalizados.
  // Preserva imagen_url + tags + complejidad + competitividad para el panel de la sesión.
  const addEjercicioBase = (diaISO, ej, overrides) => {
    const actual = dias[diaISO]?.ejercicios || []
    const nuevo = norm({
      ...ej,
      id: undefined,          // dentro de la sesión no conserva el id de biblioteca
      duracion_min: overrides.duracion_min ?? ej.duracion_min ?? 15,
      intensidad: overrides.intensidad ?? ej.intensidad ?? 'Media',
      jugadores: overrides.jugadores || [],
    })
    upd(diaISO, { ejercicios: [...actual, nuevo] })
    setMsg(`✓ Añadido a ${DIAS_L[isos.indexOf(diaISO)] || 'la sesión'}`)
    setTimeout(() => setMsg(''), 3500)
  }

  /* PDF */
  function imprimirPDF() {
    const club  = perfil?.club_nombre || 'Mi Equipo'
    const fecha = fLarga(isoS)
    const total = dur(isoS)
    const origin = window.location.origin
    const imgSrc = (u) => u ? (u.startsWith('http') ? u : origin + u) : ''
    const tagsHtml = (arr, cls) => (arr || []).map(t => `<span class="tag ${cls}">${t}</span>`).join('')
    const items = ses.ejercicios.map((x, i) => `
      <div class="ej">
        <div class="ej-head">
          <span class="ej-num">${i + 1}</span>
          <div>
            <div class="ej-nombre">${x.nombre}</div>
            <div class="ej-meta">${x.categoria} &nbsp;·&nbsp; ${x.duracion_min} min &nbsp;·&nbsp; Intensidad: ${x.intensidad}${x.zona_muscular ? ' &nbsp;·&nbsp; ' + x.zona_muscular : ''}</div>
          </div>
        </div>
        ${x.imagen_url ? `<div class="ej-img"><img src="${imgSrc(x.imagen_url)}" alt="${x.nombre}"/></div>` : ''}
        ${x.complejidad ? `<div class="ej-block"><div class="ej-block-h">Complejidad</div><div class="ej-block-b">${x.complejidad}</div></div>` : ''}
        ${x.competitividad ? `<div class="ej-block"><div class="ej-block-h">Competitividad</div><div class="ej-block-b">${x.competitividad}</div></div>` : ''}
        ${x.descripcion ? `<div class="ej-desc">${x.descripcion}</div>` : ''}
        ${(x.tags_ofensivos?.length || x.tags_defensivos?.length) ? `<div class="ej-tags">
          ${x.tags_ofensivos?.length ? `<div class="ej-tag-col"><div class="ej-tag-h">Ofensivos</div><div class="ej-tag-b">${tagsHtml(x.tags_ofensivos, 'of')}</div></div>` : ''}
          ${x.tags_defensivos?.length ? `<div class="ej-tag-col"><div class="ej-tag-h">Defensivos</div><div class="ej-tag-b">${tagsHtml(x.tags_defensivos, 'def')}</div></div>` : ''}
        </div>` : ''}
      </div>`).join('')

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Entreno ${fecha}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;padding:28px 32px;max-width:800px;margin:auto}
  h1{font-size:22px;font-weight:800;margin-bottom:4px}
  .sub{font-size:13px;color:#555;margin-bottom:20px}
  .obj{background:#f0fdf4;border-left:4px solid #16a34a;padding:10px 14px;border-radius:6px;font-size:13px;font-weight:600;color:#15803d;margin-bottom:20px}
  .ej{border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:14px;break-inside:avoid;page-break-inside:avoid}
  .ej-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px}
  .ej-num{width:28px;height:28px;border-radius:50%;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
  .ej-nombre{font-size:14px;font-weight:700;line-height:1.2}
  .ej-meta{font-size:11px;color:#6b7280;margin-top:3px}
  .ej-img{margin:0 0 10px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb}
  .ej-img img{width:100%;display:block;max-height:340px;object-fit:contain;background:#0f5132}
  .ej-block{margin:6px 0}
  .ej-block-h{font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}
  .ej-block-b{font-size:12px;color:#374151;line-height:1.55}
  .ej-desc{font-size:12.5px;color:#374151;line-height:1.6;background:#f9fafb;border-radius:6px;padding:8px 10px;margin-top:8px}
  .ej-tags{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
  .ej-tag-h{font-size:10px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
  .ej-tag-b{display:flex;flex-wrap:wrap;gap:4px}
  .tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;border:1px solid}
  .tag.of{color:#065f46;background:#d1fae5;border-color:#a7f3d0}
  .tag.def{color:#991b1b;background:#fee2e2;border-color:#fecaca}
  .notas{border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-top:20px}
  .notas h3{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:8px}
  .notas p{font-size:13px;color:#374151;line-height:1.6;white-space:pre-wrap}
  .footer{margin-top:28px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between}
  .total{display:inline-block;background:#111;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:16px}
  @media print{body{padding:0}}
</style></head><body>
<h1>${club}</h1>
<div class="sub">Entrenamiento del ${fecha}</div>
${ses.objetivo ? `<div class="obj">🎯 Objetivo: ${ses.objetivo}</div>` : ''}
<div class="total">⏱ Duración total: ${total} minutos</div>
${items}
${ses.notas ? `<div class="notas"><h3>Notas del entrenador</h3><p>${ses.notas}</p></div>` : ''}
<div class="footer"><span>${club} · Kick &amp; Go</span><span>${new Date().toLocaleDateString('es-ES')}</span></div>
</body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.focus()
    // Esperar a que carguen todas las imágenes antes de imprimir para que no salga en blanco
    const doPrint = () => { try { w.print() } catch {} }
    const imgs = w.document.images
    if (!imgs.length) return setTimeout(doPrint, 400)
    let pend = imgs.length
    const done = () => { if (--pend <= 0) setTimeout(doPrint, 200) }
    Array.from(imgs).forEach((im) => {
      if (im.complete) done()
      else { im.onload = done; im.onerror = done }
    })
    setTimeout(doPrint, 4000) // fallback si alguna imagen no responde
  }

  /* Biblioteca filtrada */
  const cats    = ['Todas', ...Array.from(new Set(biblioteca.map((e) => e.categoria)))]
  const bibFilt = biblioteca.filter((e) =>
    (bibCat === 'Todas' || e.categoria === bibCat) &&
    (!bibQ || e.nombre.toLowerCase().includes(bibQ.toLowerCase())))

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  return (
    <div>
      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h1 className="text-xl font-extrabold">Entrenamientos</h1>
          <p className="text-[11px] text-muted">{vistaTab === 'sesiones' ? `${fCorta(isos[0])} – ${fCorta(isos[6])} · ${minS} min totales` : vistaTab === 'base' ? 'Biblioteca de ejercicios base' : 'Diseña ejercicios con símbolos y anímalos por pasos'}</p>
        </div>
        {vistaTab === 'sesiones' && (
          <div className="flex items-center gap-1.5">
            <button className="ent2-week-btn" onClick={() => setSemana((s) => s - 1)}>‹</button>
            <button className="ent2-week-btn" onClick={() => setSemana(0)}>Hoy</button>
            <button className="ent2-week-btn" onClick={() => setSemana((s) => s + 1)}>›</button>
          </div>
        )}
      </div>

      {/* ── Tabs vista ── */}
      <div style={{ display:'flex', gap:6, marginBottom:14, padding:4, background:'#141416', border:'1px solid #27272a', borderRadius:10 }}>
        <button onClick={() => setVistaTab('sesiones')}
          style={{ flex:1, padding:'8px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
            background: vistaTab==='sesiones' ? '#27272a' : 'transparent',
            color: vistaTab==='sesiones' ? '#fafafa' : '#71717a' }}>
          📅 Sesiones
        </button>
        <button onClick={() => setVistaTab('base')}
          style={{ flex:1, padding:'8px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
            background: vistaTab==='base' ? '#27272a' : 'transparent',
            color: vistaTab==='base' ? '#fafafa' : '#71717a' }}>
          📚 Ejercicios base
        </button>
        <button onClick={() => setVistaTab('pizarra')}
          style={{ flex:1, padding:'8px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
            background: vistaTab==='pizarra' ? '#27272a' : 'transparent',
            color: vistaTab==='pizarra' ? '#fafafa' : '#71717a' }}>
          ✏️ Pizarra
        </button>
      </div>

      {vistaTab === 'base' && (
        <EjerciciosBaseView
          isos={isos}
          dias={dias}
          diaSel={diaSel}
          jugadores={jugadores}
          onAddEjercicio={addEjercicioBase}
        />
      )}

      {vistaTab === 'pizarra' && <PizarraTactica eid={eid} />}

      {vistaTab === 'sesiones' && <div className="ent2-layout">

      {/* ── Sidebar semana (desktop) ── */}
      <aside className="ent2-week-side hidden lg:flex">
        <div className="ent2-week-side-h">
          <span>Semana actual</span>
          <span style={{ color:'#a1a1aa' }}>{minS}′</span>
        </div>
        {isos.map((d, i) => {
          const ses_i = dias[d] || { ejercicios: [], id: null, objetivo: '' }
          const tiene = ses_i.ejercicios.length > 0
          const minDia = dur(d)
          const activo = diaSel === i
          const badge = ses_i.id ? { cls: 'ok', txt: '✓ Completado' } : tiene ? { cls: 'pend', txt: 'Pendiente' } : { cls: 'empty', txt: '—' }
          return (
            <div key={d} className={`ent2-week-card ${activo ? 'active' : ''}`} onClick={() => setDiaSel(i)}>
              <div className="ent2-week-card-top">
                <span className="ent2-week-card-day">{DIAS_L[i]}</span>
                <span className={`ent2-week-card-badge ${badge.cls}`}>{badge.txt}</span>
              </div>
              <div className="ent2-week-card-sub">{fCorta(d)} · {minDia}′</div>
              <div className="ent2-week-card-list">
                {ses_i.ejercicios.length === 0 ? (
                  <span className="ent2-week-card-empty">Sin ejercicios</span>
                ) : ses_i.ejercicios.slice(0, 4).map((x, k) => {
                  const color = COLOR_CAT[x.categoria] || '#2dd4bf'
                  return (
                    <div key={k} className="ent2-week-card-item">
                      <span className="truncate flex items-center" style={{ minWidth:0 }}>
                        <span className="ent2-week-card-item-dot" style={{ background: color }} />
                        <span className="truncate">{x.nombre}</span>
                      </span>
                      <span className="ent2-week-card-item-min">{x.duracion_min}′</span>
                    </div>
                  )
                })}
                {ses_i.ejercicios.length > 4 && (
                  <span className="ent2-week-card-empty">+{ses_i.ejercicios.length - 4} más</span>
                )}
              </div>
            </div>
          )
        })}
      </aside>

      <div className="min-w-0">

      {/* ── Tabs días (móvil) ── */}
      <div className="ent2-day-tabs mb-4 lg:hidden">
        {isos.map((d, i) => {
          const tiene = (dias[d]?.ejercicios || []).length > 0
          return (
            <button key={d} className={`ent2-day-tab ${diaSel === i ? 'active' : ''}`} onClick={() => setDiaSel(i)}>
              <span className="ent2-dt-dia">{DIAS[i]}</span>
              <span className="ent2-dt-num">{fCorta(d).split(' ')[0]}</span>
              {tiene && <span className="ent2-dt-dot" />}
            </button>
          )
        })}
      </div>

      {msg && <div className="text-xs px-1 mb-3" style={{ color: msg.startsWith('⚠') ? '#ef4444' : '#a1a1aa' }}>{msg}</div>}

      {/* ── Estado del equipo + Alertas ── */}
      <EstadoEquipo jugadores={jugadores} lesiones={lesiones} />

      {/* ── Panel sesión ── */}
      <div className="ent2-panel mb-3">
        {/* Cabecera del día */}
        <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
          <div>
            <div className="text-base font-extrabold">Sesión · {DIAS_L[diaSel]} {fCorta(isoS)}</div>
            <div className="text-[11px] text-muted">{ses.ejercicios.length} ejercicios</div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <button className="ent2-btn-ia" onClick={iaDia}>✨ IA</button>
            {ses.ejercicios.length > 0 && (
              <>
                <button className="btn btn-outline text-[11px] !py-1.5 !px-3" onClick={imprimirPDF}>📄 PDF</button>
                <button className="btn btn-primary text-[11px] !py-1.5 !px-3" onClick={guardarDia}>💾 Guardar</button>
              </>
            )}
            {(ses.ejercicios.length > 0 || ses.id) && (
              <button className="ent2-btn-del" onClick={borrarDia}>🗑</button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="ent2-kpis">
          <div className="ent2-kpi">
            <div className="ent2-kpi-label">⏱ Duración</div>
            <div className="ent2-kpi-val accent">{dur(isoS)}′</div>
          </div>
          <div className="ent2-kpi">
            <div className="ent2-kpi-label">🏋 Ejercicios</div>
            <div className="ent2-kpi-val">{ses.ejercicios.length}</div>
          </div>
          <div className="ent2-kpi">
            <div className="ent2-kpi-label">👥 Plantilla</div>
            <div className="ent2-kpi-val">{jugadores.length}</div>
          </div>
          <div className="ent2-kpi" title={ses.objetivo || 'Sin objetivo'}>
            <div className="ent2-kpi-label">🎯 Objetivo</div>
            <div className="ent2-kpi-val" style={{ fontSize:13, fontWeight:700 }}>{ses.objetivo || '—'}</div>
          </div>
        </div>

        {/* Objetivo (editable) */}
        <input
          className="ent2-obj-input mb-3"
          placeholder="Objetivo del día (ej: Trabajo táctico defensivo)…"
          value={ses.objetivo || ''}
          onChange={(e) => upd(isoS, { objetivo: e.target.value })}
        />

        {/* Timeline de ejercicios */}
        {ses.ejercicios.length === 0 ? (
          <div className="ent2-empty">Sin ejercicios · Pulsa <b className="text-cyan">+ Añadir ejercicio</b> abajo</div>
        ) : (
          <div className="ent2-tl mb-3">
            {ses.ejercicios.map((x, k) => {
              const color = COLOR_CAT[x.categoria] || '#2dd4bf'
              const inten = (x.intensidad || 'Media').toLowerCase()
              const [expandido, ] = [false, null]
              return (
                <details key={k} className="ent2-tl-item" style={{ display:'block' }}>
                  <summary style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', listStyle:'none' }}>
                    <div className="ent2-tl-num">
                      <div className="ent2-tl-num-badge" style={{ background: color }}>{k + 1}</div>
                      <div className="ent2-tl-num-min">{x.duracion_min}′</div>
                    </div>
                    <div className="ent2-tl-thumb">
                      {x.imagen_url ? (
                        <img src={x.imagen_url} alt={x.nombre} />
                      ) : (
                        <div className="ent2-tl-thumb-empty">⚽</div>
                      )}
                    </div>
                    <div className="ent2-tl-body">
                      <div className="ent2-tl-title">{x.nombre}</div>
                      <div className="ent2-tl-meta">
                        <span className="ent2-tl-cat" style={{ background: color + '22', color }}>{x.categoria}</span>
                        <span className="ent2-tl-info">👥 {(x.jugadores || []).length || jugadores.length}</span>
                        <span className={`ent2-tl-intens ${inten}`}>🔥 {x.intensidad}</span>
                      </div>
                    </div>
                    <button className="ent2-tl-menu" onClick={(e) => { e.preventDefault(); e.stopPropagation(); delEj(k) }} title="Quitar">✕</button>
                  </summary>

                  {/* Detalle expandido: campo grande + descripción + duración editable */}
                  <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #27272a' }}>
                    {x.imagen_url && (
                      <div style={{ marginBottom:12, borderRadius:10, overflow:'hidden', border:'1px solid #27272a', background:'#0f0f11' }}>
                        <img src={x.imagen_url} alt={x.nombre} style={{ width:'100%', display:'block', maxHeight:420, objectFit:'contain' }} />
                      </div>
                    )}
                    {(x.tags_ofensivos?.length > 0 || x.tags_defensivos?.length > 0) && (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                        {x.tags_ofensivos?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-muted uppercase tracking-wide mb-1 font-semibold">Ofensivos</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                              {x.tags_ofensivos.map(t => <span key={t} style={{ fontSize:10, fontWeight:600, color:'#6ee7b7', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.3)', padding:'2px 7px', borderRadius:5 }}>{t}</span>)}
                            </div>
                          </div>
                        )}
                        {x.tags_defensivos?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-muted uppercase tracking-wide mb-1 font-semibold">Defensivos</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                              {x.tags_defensivos.map(t => <span key={t} style={{ fontSize:10, fontWeight:600, color:'#fca5a5', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', padding:'2px 7px', borderRadius:5 }}>{t}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-muted uppercase tracking-wide mb-1 font-semibold">Descripción / instrucciones</div>
                    <textarea
                      className="ent2-desc-input"
                      rows={3}
                      placeholder="Describe cómo se ejecuta este ejercicio: materiales, reglas, variantes…"
                      value={x.descripcion || ''}
                      onChange={(e) => updEj(k, 'descripcion', e.target.value)}
                    />
                    <div className="flex items-center gap-3 mt-2">
                      <label className="text-[11px] text-muted">Duración:</label>
                      <input
                        type="number" min={1} max={120}
                        className="ent2-dur-input"
                        value={x.duracion_min || 15}
                        onChange={(e) => updEj(k, 'duracion_min', +e.target.value)}
                      />
                      <span className="text-[11px] text-muted">min</span>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        )}

        {/* Asistencia */}
        {jugadores.length > 0 && (
          <AsistenciaPanel
            jugadores={jugadores}
            lesionesActivas={lesiones.filter((l) => !l.alta)}
            asistencia={ses.asistencia || {}}
            onChange={(a) => upd(isoS, { asistencia: a })}
          />
        )}

        {/* Notas del entrenador */}
        <div className="mb-3">
          <div className="text-[11px] text-muted uppercase tracking-wide mb-1 font-semibold">📝 Notas del entrenador</div>
          <textarea
            className="ent2-notas-input"
            rows={3}
            placeholder="Observaciones generales, jugadores lesionados, aspectos a mejorar, comunicaciones al grupo…"
            value={ses.notas || ''}
            onChange={(e) => upd(isoS, { notas: e.target.value })}
          />
        </div>

        {/* Botón añadir */}
        <button className="ent2-add-ej-btn" onClick={() => setShowBib(!showBib)}>
          {showBib ? '▲ Cerrar biblioteca' : '+ Añadir ejercicio desde biblioteca'}
        </button>
      </div>

      {/* ── Biblioteca ── */}
      {showBib && (
        <div className="ent2-panel mb-3">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <div className="text-sm font-extrabold">Biblioteca de ejercicios</div>
            <div className="flex gap-2 items-center flex-wrap">
              <input className="field !py-1.5 text-xs" style={{ width: 160 }} placeholder="🔍 Buscar…" value={bibQ} onChange={(e) => setBibQ(e.target.value)} />
              <button className="ent2-btn-gestion" onClick={() => setShowGestion(true)}>⚙ Gestionar</button>
            </div>
          </div>
          <div className="text-[11px] text-cyan mb-3">Toca un ejercicio para añadirlo a <b>{DIAS_L[diaSel]}</b></div>
          <div className="ent2-bib-tabs mb-3">
            {cats.map((c) => <button key={c} className={`ent2-bib-tab ${bibCat === c ? 'active' : ''}`} onClick={() => setBibCat(c)}>{c}</button>)}
          </div>
          <div className="space-y-2">
            {bibFilt.map((e, i) => {
              const color = COLOR_CAT[e.categoria] || '#2dd4bf'
              return (
                <div key={e.id || i} className="ent2-bib-row" onClick={() => { addEj(e); setMsg('') }}>
                  <span className="ent2-ejc-num" style={{ background: color, fontSize: 11 }}>+</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="ent2-ejc-cat" style={{ background: color + '22', color }}>{e.categoria}</span>
                      <span className="text-sm font-semibold">{e.nombre}</span>
                    </div>
                    {e.descripcion && <div className="ent2-ejc-desc">{e.descripcion}</div>}
                    <div className="ent2-ejc-meta mt-1">
                      <span>⏱ {e.duracion_min} min</span>
                      <span>🔥 {e.intensidad}</span>
                      {e.zona_muscular && <span>💪 {e.zona_muscular}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── IA semana ── */}
      <div className="ent2-ia mb-4">
        <div className="ent2-ia-h">🧠 Plan semanal IA</div>
        <div className="ent2-ia-reco">{recoTexto}</div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button className="btn btn-outline text-xs" style={{ borderColor:'rgba(139,92,246,.4)', color:'#a78bfa' }} onClick={completarSemana}>✨ Completar semana con IA</button>
          <button className="btn btn-primary text-xs" onClick={guardarSemana}>💾 Guardar semana</button>
        </div>
      </div>

      </div>
      </div>}

      {/* ── Modal gestión biblioteca ── */}
      {showGestion && (
        <GestionBiblioteca
          biblioteca={biblioteca}
          onClose={() => setShowGestion(false)}
          onRefrescar={refrescar}
          crearEjercicio={crearEjercicio}
          actualizarEjercicio={actualizarEjercicio}
          borrarEjercicio={borrarEjercicio}
        />
      )}
    </div>
  )
}

/* ══ Estado del equipo + Alertas de lesionados ═══════════ */
function EstadoEquipo({ jugadores, lesiones }) {
  const lesActivas = lesiones.filter((l) => !l.alta)
  const lesIds = new Set(lesActivas.map((l) => l.jugador_id))
  const disponibles = jugadores.filter((j) => !lesIds.has(j.id))
  const COLOR_GRAV = { leve: '#f59e0b', moderada: '#f97316', grave: '#ef4444' }

  return (
    <div className="mb-3 space-y-2">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="ent2-panel text-center !py-3">
          <div className="text-2xl font-extrabold text-cyan">{jugadores.length}</div>
          <div className="text-[10px] text-muted mt-0.5">Plantilla</div>
        </div>
        <div className="ent2-panel text-center !py-3">
          <div className="text-2xl font-extrabold" style={{ color: '#10b981' }}>{disponibles.length}</div>
          <div className="text-[10px] text-muted mt-0.5">Disponibles</div>
        </div>
        <div className="ent2-panel text-center !py-3">
          <div className="text-2xl font-extrabold" style={{ color: lesActivas.length ? '#ef4444' : '#71717a' }}>{lesActivas.length}</div>
          <div className="text-[10px] text-muted mt-0.5">Lesionados</div>
        </div>
      </div>

      {/* Alertas lesionados */}
      {lesActivas.length > 0 && (
        <div className="ent2-panel !p-3 space-y-2">
          <div className="text-[11px] font-bold text-rojo uppercase tracking-wide mb-1">⚠ Bajas actuales</div>
          {lesActivas.map((l) => {
            const jug = jugadores.find((j) => j.id === l.jugador_id)
            const color = COLOR_GRAV[l.gravedad] || '#f59e0b'
            return (
              <div key={l.id} className="flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                <span className="text-xs font-semibold">{jug?.nombre || 'Jugador'}</span>
                <span className="text-[11px] text-muted">{l.zona || l.tipo}</span>
                <span className="ml-auto text-[10px] font-bold" style={{ color }}>{l.gravedad}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ══ Asistencia al entrenamiento ════════════════════════════ */
function AsistenciaPanel({ jugadores, lesionesActivas, asistencia, onChange }) {
  const lesIds = new Set(lesionesActivas.map((l) => l.jugador_id))
  const presentes = Object.values(asistencia).filter(Boolean).length
  const [open, setOpen] = useState(true)

  function toggle(id) {
    onChange({ ...asistencia, [id]: !asistencia[id] })
  }
  function marcarTodos() {
    const todos = {}
    jugadores.forEach((j) => { if (!lesIds.has(j.id)) todos[j.id] = true })
    onChange(todos)
  }

  return (
    <div className="mb-3">
      <button
        className="flex items-center gap-2 w-full text-left mb-2"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-[11px] text-muted uppercase tracking-wide font-semibold">👥 Asistencia</span>
        <span className="text-[11px] text-cyan font-bold ml-1">{presentes}/{jugadores.length}</span>
        <span className="ml-auto text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="ent2-panel !p-3 space-y-1">
          <div className="flex justify-end mb-2">
            <button className="text-[11px] text-cyan underline" onClick={marcarTodos}>Marcar todos disponibles</button>
          </div>
          {jugadores.map((j) => {
            const lesionado = lesIds.has(j.id)
            const checked = !!asistencia[j.id]
            return (
              <label key={j.id} className={`flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded hover:bg-white/5 ${lesionado ? 'opacity-40' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={lesionado}
                  onChange={() => !lesionado && toggle(j.id)}
                  className="w-4 h-4 accent-cyan-400 flex-shrink-0"
                />
                <span className="text-xs font-medium flex-1">{j.nombre}</span>
                <span className="text-[10px] text-muted">{j.posicion}</span>
                {lesionado && <span className="text-[10px]" style={{ color: '#ef4444' }}>Baja</span>}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ══ Modal gestión de biblioteca ══════════════════════════ */
const EJ_VACIO = { nombre:'', categoria:'General', descripcion:'', duracion_min:15, intensidad:'Media', zona_muscular:'' }
const CATS_DEF = ['Calentamiento','Posesión','Transiciones','Presión','Finalización','Balón parado','Porteros','Partido','General']

function GestionBiblioteca({ biblioteca, onClose, onRefrescar, crearEjercicio, actualizarEjercicio, borrarEjercicio }) {
  const [editando, setEditando] = useState(null)
  const [form, setForm]         = useState(EJ_VACIO)
  const [msg, setMsg]           = useState('')
  const [guardando, setGuardando] = useState(false)

  function abrir(ej) {
    setForm(ej ? { ...ej } : { ...EJ_VACIO })
    setEditando(ej ? ej.id : 'nuevo')
    setMsg('')
  }
  async function guardar() {
    if (!form.nombre.trim()) { setMsg('El nombre es obligatorio.'); return }
    setGuardando(true)
    try {
      if (editando === 'nuevo') await crearEjercicio(form)
      else await actualizarEjercicio(editando, form)
      await onRefrescar(); setEditando(null)
    } catch (e) { setMsg('⚠️ ' + e.message) } finally { setGuardando(false) }
  }
  async function eliminar(id) {
    if (!confirm('¿Eliminar este ejercicio de tu biblioteca?')) return
    try { await borrarEjercicio(id); await onRefrescar() }
    catch (e) { setMsg('⚠️ ' + e.message) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="ent2-gestion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-base font-extrabold">⚙ Gestionar biblioteca</div>
            <div className="text-[11px] text-muted">{biblioteca.length} ejercicios · Los ejercicios base no se pueden borrar</div>
          </div>
          <button className="text-muted hover:text-white text-xl" onClick={onClose}>✕</button>
        </div>
        {msg && <div className="text-xs mb-3 text-rojo">{msg}</div>}

        {editando && (
          <div className="ent2-gestion-form mb-4">
            <div className="text-xs font-bold text-muted uppercase mb-3">{editando === 'nuevo' ? '+ Nuevo ejercicio' : '✏ Editar ejercicio'}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] text-muted">Nombre *</label>
                <input className="field mt-1" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del ejercicio" />
              </div>
              <div>
                <label className="text-[11px] text-muted">Categoría</label>
                <select className="field mt-1" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                  {CATS_DEF.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted">Intensidad</label>
                <select className="field mt-1" value={form.intensidad} onChange={(e) => setForm({ ...form, intensidad: e.target.value })}>
                  <option>Baja</option><option>Media</option><option>Alta</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted">Duración (min)</label>
                <input className="field mt-1" type="number" min={1} value={form.duracion_min} onChange={(e) => setForm({ ...form, duracion_min: +e.target.value })} />
              </div>
              <div>
                <label className="text-[11px] text-muted">Zona muscular</label>
                <input className="field mt-1" value={form.zona_muscular} onChange={(e) => setForm({ ...form, zona_muscular: e.target.value })} placeholder="Ej: Pierna / Core" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-muted">Descripción / instrucciones</label>
                <textarea className="field mt-1" rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Explica el ejercicio: materiales, reglas, series, variantes…" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn btn-outline flex-1 text-xs" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn btn-primary flex-1 text-xs" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : '💾 Guardar'}</button>
            </div>
          </div>
        )}

        <div className="ent2-gestion-list">
          {biblioteca.map((e, i) => {
            const color = COLOR_CAT[e.categoria] || '#a1a1aa'
            return (
              <div key={e.id || i} className="ent2-gestion-row">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="ent2-ejc-cat" style={{ background: color + '22', color }}>{e.categoria}</span>
                    <span className="text-sm font-semibold">{e.nombre}</span>
                  </div>
                  {e.descripcion && <div className="ent2-ejc-desc line-clamp-2">{e.descripcion}</div>}
                  <div className="ent2-ejc-meta mt-1">
                    <span>⏱ {e.duracion_min} min</span>
                    <span>🔥 {e.intensidad}</span>
                    {e.zona_muscular && <span>💪 {e.zona_muscular}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="ent2-btn-edit" onClick={() => abrir(e)}>✏</button>
                  {!e.es_base && <button className="ent2-btn-del2" onClick={() => eliminar(e.id)}>🗑</button>}
                </div>
              </div>
            )
          })}
        </div>
        <button className="btn btn-primary w-full mt-4 text-sm" onClick={() => abrir(null)}>+ Añadir ejercicio</button>
      </div>
    </div>
  )
}

/* ══ Biblioteca de ejercicios base (pestaña) ═══════════════ */
function EjerciciosBaseView({ isos, dias, diaSel, jugadores, onAddEjercicio }) {
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Todas')
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    (async () => {
      try { setEjercicios(await listarEjerciciosBase()) }
      catch (e) { setError(e.message) }
      finally { setCargando(false) }
    })()
  }, [])

  const cats = useMemo(() => ['Todas', ...Array.from(new Set(ejercicios.map((e) => e.categoria).filter(Boolean)))], [ejercicios])
  const filtrados = useMemo(() => {
    return ejercicios.filter((e) =>
      (cat === 'Todas' || e.categoria === cat) &&
      ejercicioMatcheaQuery(e, query)
    )
  }, [ejercicios, cat, query])

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando ejercicios…</div>
  if (error) return <div className="text-sm py-6 text-center" style={{ color:'#ef4444' }}>⚠️ {error}</div>

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, tag o palabra (control, posesión, presión…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex:'1 1 240px', background:'#141416', border:'1px solid #27272a', borderRadius:8, padding:'9px 12px', color:'#fafafa', fontSize:12, outline:'none' }}
        />
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${cat===c?'#2dd4bf':'#27272a'}`, background: cat===c?'rgba(45,212,191,.12)':'transparent', color: cat===c?'#2dd4bf':'#71717a', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="text-sm text-muted py-10 text-center">Sin ejercicios que coincidan con la búsqueda.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
          {filtrados.map((e) => (
            <button key={e.id} onClick={() => setSeleccionado(e)}
              style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:10, padding:0, overflow:'hidden', cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column' }}>
              <div style={{ aspectRatio:'16/10', background:'#0f0f11', overflow:'hidden' }}>
                {e.imagen_url ? (
                  <img src={e.imagen_url} alt={e.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                ) : (
                  <DiagramaEjercicio nombre={e.nombre} categoria={e.categoria} />
                )}
              </div>
              <div style={{ padding:'10px 12px' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#10b981', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>{e.categoria || 'General'}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#fafafa', lineHeight:1.3, marginBottom:6 }}>{e.nombre}</div>
                {(e.tags_ofensivos?.length > 0 || e.tags_defensivos?.length > 0) && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                    {(e.tags_ofensivos || []).slice(0, 2).map((t) => (
                      <span key={t} style={{ fontSize:9, fontWeight:600, color:'#6ee7b7', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', padding:'1px 6px', borderRadius:4 }}>{t}</span>
                    ))}
                    {(e.tags_defensivos || []).slice(0, 2).map((t) => (
                      <span key={t} style={{ fontSize:9, fontWeight:600, color:'#fca5a5', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', padding:'1px 6px', borderRadius:4 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {seleccionado && (
        <EjercicioBaseModal
          ejercicio={seleccionado}
          onClose={() => setSeleccionado(null)}
          isos={isos}
          diaSel={diaSel}
          jugadores={jugadores}
          onAdd={(diaISO, overrides) => {
            onAddEjercicio(diaISO, seleccionado, overrides)
            setSeleccionado(null)
          }}
        />
      )}
    </div>
  )
}
