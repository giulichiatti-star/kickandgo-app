import { useEffect, useMemo, useState } from 'react'
import {
  cargarDatosGlobales, construirInforme, TEMPORADAS, CATEGORIAS, DIVISIONES,
} from '../lib/informeGlobal'

/* ── Helpers de formato ─────────────────────────────────── */
const nf = (n) => (n ?? 0).toLocaleString('es-ES')
function hoyLargo() {
  return new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* ── Podio reutilizable ─────────────────────────────────── */
function Award({ ico, titulo, metrica, filas, hero }) {
  const posCol = ['linear-gradient(135deg,#fde047,#f59e0b)', '#3f3f46', '#4a2f1a']
  const posTxt = ['#3a2a00', '#e4e4e7', '#fdba74']
  return (
    <div style={{
      gridColumn: hero ? 'span 2' : 'span 1',
      background: hero ? 'linear-gradient(160deg,rgba(245,158,11,.07),#18181b)' : '#18181b',
      border: `1px solid ${hero ? 'rgba(245,158,11,.4)' : '#27272a'}`, borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #27272a' }}>
        <span style={{ fontSize: 20 }}>{ico}</span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 900 }}>{titulo}</div>
          <div style={{ fontSize: 9.5, color: '#71717a', fontWeight: 600 }}>{metrica}</div>
        </div>
      </div>
      <div style={{ padding: '4px 15px' }}>
        {filas.length === 0 ? (
          <div style={{ fontSize: 11, color: '#52525b', padding: '14px 0' }}>Sin datos suficientes para este premio.</div>
        ) : filas.map((f, i) => (
          <div key={f.key || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < filas.length - 1 ? '1px solid #1f1f23' : 'none' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0, background: posCol[i] || '#27272a', color: posTxt[i] || '#a1a1aa' }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nombre}</div>
              <div style={{ fontSize: 9.5, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.sub}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#34d399' }}>{f.val}</div>
              {f.valSub && <div style={{ fontSize: 8.5, color: '#52525b', fontWeight: 600 }}>{f.valSub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Página ─────────────────────────────────────────────── */
export default function AdminGlobal() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [temporada, setTemporada] = useState('todas')
  const [categoria, setCategoria] = useState('todas')
  const [division, setDivision] = useState('todas')
  const [equipoId, setEquipoId] = useState('todos')
  const [menuPdf, setMenuPdf] = useState(false)

  useEffect(() => {
    (async () => {
      try { setDatos(await cargarDatosGlobales()) }
      catch (e) { setError(e.message) }
      finally { setCargando(false) }
    })()
  }, [])

  const temporadas = useMemo(() => (datos ? TEMPORADAS(datos) : []), [datos])
  const categorias = useMemo(() => (datos ? CATEGORIAS(datos) : []), [datos])
  const divisiones = useMemo(() => (datos ? DIVISIONES(datos) : []), [datos])
  const equiposOpts = useMemo(() => {
    if (!datos) return []
    return datos.equipos
      .filter((e) => categoria === 'todas' || (e.categoria || '').trim() === categoria)
      .filter((e) => division === 'todas' || (e.division || '').trim() === division)
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
  }, [datos, categoria, division])

  const inf = useMemo(
    () => (datos ? construirInforme(datos, { temporada, categoria, division, equipoId }) : null),
    [datos, temporada, categoria, division, equipoId]
  )

  if (cargando) return <div className="text-sm text-muted py-16 text-center">Cargando datos globales…</div>
  if (error) return (
    <div className="card p-6 text-center">
      <div className="text-sm mb-2" style={{ color: '#f87171' }}>⚠️ {error}</div>
      <div className="text-[11px] text-muted">Si dice “permission denied”, ejecuta la migración <b>migracion_informe_global.sql</b> en Supabase.</div>
    </div>
  )
  if (!inf) return null

  const { kpis, premios, tabla, notas } = inf

  /* ── Mapear premios a filas de podio ── */
  const filasDT = premios.mejorDT.map((t) => ({ key: t.id, nombre: t.coach, sub: `${t.nombre} · ${t.categoria} · ${t.ppp} pts/pj · ${t.entrenos} entrenos${t.asistencia != null ? ` · ${t.asistencia}% asist` : ''}`, val: t.dtIndice, valSub: 'índice' }))
  const filasDel = premios.mejorDelantero.map((j) => ({ key: j.id, nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.ga, valSub: `${j.goles}G·${j.asist}A` }))
  const filasMed = premios.mejorMedio.map((j) => ({ key: j.id, nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.valMedia ?? '—', valSub: `${j.asist}A` }))
  const filasDef = premios.mejorDefensa.map((j) => ({ key: j.id, nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.cleanSheets, valSub: j.valMedia != null ? `val ${j.valMedia}` : 'porterías 0' }))
  const filasPor = premios.mejorPortero.map((j) => ({ key: j.id, nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.cleanSheets, valSub: j.gcPorPJ != null ? `${j.gcPorPJ} GC/PJ` : 'porterías 0' }))
  const filasAsi = premios.maxAsistente.map((j) => ({ key: j.id, nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.asist, valSub: 'asist' }))
  const filasFair = premios.fairPlay.map((t) => ({ key: t.id, nombre: `${t.nombre} · ${t.categoria}`, sub: `${t.cards} tarjetas en ${t.pj} PJ`, val: t.cardsPorPJ, valSub: 'tarj/pj' }))
  const filasRev = premios.revelacion.map((j) => ({ key: j.id, nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.valMedia ?? '—', valSub: `${j.valMuestras} PJ` }))
  const filasReg = premios.masRegular.map((j) => ({ key: j.id, nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.pj, valSub: 'partidos' }))

  const filtroTxt = [
    temporada === 'todas' ? 'Todas las temporadas' : `Temporada ${temporada}`,
    categoria === 'todas' ? 'Todas las categorías' : categoria,
    division === 'todas' ? 'Todas las divisiones' : division,
    equipoId === 'todos' ? 'Todos los equipos' : (datos.equipos.find((e) => e.id === equipoId)?.nombre || ''),
  ].join(' · ')

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-1 gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">Panel Admin · Informe Global</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)', padding: '3px 10px', borderRadius: 20, marginTop: 8 }}>
            🔒 Solo admin
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-primary text-xs" onClick={() => setMenuPdf((v) => !v)}>⬇ Descargar PDF ▾</button>
          {menuPdf && (
            <div style={{ position: 'absolute', right: 0, top: 40, zIndex: 20, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 6, width: 240, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
              <button className="w-full text-left" style={{ fontSize: 12, padding: '9px 11px', borderRadius: 7, fontWeight: 600 }} onClick={() => { setMenuPdf(false); imprimirPDF('resumen', inf, filtroTxt) }}>📄 Resumen ejecutivo<div style={{ fontSize: 10, color: '#71717a' }}>KPIs + podios de premios</div></button>
              <button className="w-full text-left" style={{ fontSize: 12, padding: '9px 11px', borderRadius: 7, fontWeight: 600 }} onClick={() => { setMenuPdf(false); imprimirPDF('completo', inf, filtroTxt) }}>📚 Informe completo<div style={{ fontSize: 10, color: '#71717a' }}>Todo: premios, tabla y notas</div></button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center my-4">
        <Filtro label="📅 Temporada" value={temporada} onChange={setTemporada} options={[['todas', 'Todas'], ...temporadas.map((t) => [t, t])]} />
        <Filtro label="🏷️ Categoría" value={categoria} onChange={(v) => { setCategoria(v); setEquipoId('todos') }} options={[['todas', 'Todas'], ...categorias.map((c) => [c, c])]} />
        <Filtro label="🏆 División" value={division} onChange={(v) => { setDivision(v); setEquipoId('todos') }} options={[['todas', 'Todas'], ...divisiones.map((d) => [d, d])]} />
        <Filtro label="🛡️ Equipo" value={equipoId} onChange={setEquipoId} options={[['todos', 'Todos'], ...equiposOpts.map((e) => [e.id, e.nombre])]} />
        <span className="text-[11px] text-muted ml-1">Datos a {hoyLargo()}</span>
      </div>

      {categorias.length === 0 && (
        <div className="mb-4" style={{ fontSize: 11.5, color: '#fbbf24', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 10, padding: '10px 14px' }}>
          💡 Ningún equipo tiene <b>categoría</b> asignada todavía. Pídeles que la marquen en el selector de equipo (arriba a la izquierda) para poder filtrar y premiar por categoría.
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 8 }} className="kpis-grid">
        <Kpi lbl="Clubs" num={nf(kpis.clubs)} sub="cuentas" />
        <Kpi lbl="Equipos" num={nf(kpis.equipos)} sub={`${kpis.categorias} categorías`} />
        <Kpi lbl="Jugadores" num={nf(kpis.jugadores)} sub="fichados" />
        <Kpi lbl="Partidos" num={nf(kpis.partidos)} sub={kpis.registro} />
        <Kpi lbl="Goles" num={nf(kpis.goles)} sub={`${kpis.golesPorPartido} / partido`} />
        <Kpi lbl="Entrenos" num={nf(kpis.entrenos)} sub={`${nf(kpis.minutos)} min`} />
      </div>

      {/* Premios */}
      <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.2, color: '#a1a1aa', margin: '26px 0 14px' }}>🏆 Candidatos a premios de la temporada</div>
      <div className="ag-awards">
        <Award hero ico="🏆" titulo="Mejor DT · Índice compuesto" metrica="resultados + entrenos + asistencia + evolución" filas={filasDT} />
        <Award ico="⚽" titulo="Mejor Delantero" metrica="goles + asistencias" filas={filasDel} />
        <Award ico="🎯" titulo="Mejor Mediocampista" metrica="valoración + asistencias" filas={filasMed} />
      </div>
      <div className="ag-awards" style={{ marginTop: 14 }}>
        <Award ico="🛡️" titulo="Mejor Defensa" metrica="porterías a cero · valoración" filas={filasDef} />
        <Award ico="🧤" titulo="Mejor Portero" metrica="porterías a cero · GC/PJ" filas={filasPor} />
        <Award ico="🅰️" titulo="Máximo Asistente" metrica="asistencias de gol" filas={filasAsi} />
        <Award ico="🤝" titulo="Fair Play (equipo)" metrica="menos tarjetas / partido" filas={filasFair} />
      </div>
      <div className="ag-awards" style={{ marginTop: 14 }}>
        <Award ico="🌟" titulo="Jugador Revelación" metrica="mejor valoración media (≥3 PJ)" filas={filasRev} />
        <Award ico="📈" titulo="Más Regular" metrica="más partidos jugados" filas={filasReg} />
        <div style={{ gridColumn: 'span 2', background: 'linear-gradient(160deg,rgba(16,185,129,.06),#18181b)', border: '1px solid #27272a', borderRadius: 14, padding: '13px 15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🧠</span>
            <div><div style={{ fontSize: 12.5, fontWeight: 900 }}>Temas recurrentes en las notas</div><div style={{ fontSize: 9.5, color: '#71717a', fontWeight: 600 }}>todos los clubes · análisis local sin coste</div></div>
          </div>
          <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, marginBottom: 10 }}>{notas.resumen}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {notas.tendencias.map((t) => (
              <span key={t.id} style={{ fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 5, background: `${t.color}1f`, color: t.color }}>{t.emoji} {t.label} · {t.n}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla por equipo */}
      <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.2, color: '#a1a1aa', margin: '26px 0 14px' }}>📊 Detalle por equipo y categoría</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#18181b', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden', minWidth: 760 }}>
          <thead>
            <tr>
              {['Club / Equipo', 'Categoría', 'División', 'PJ', 'V-E-D', 'GF', 'GC', 'Dif', 'Entrenos', 'Asist.', 'Índice DT', 'Máx goleador'].map((h) => (
                <th key={h} style={{ fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .6, color: '#71717a', textAlign: 'left', padding: '11px 14px', borderBottom: '1px solid #27272a', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabla.length === 0 && <tr><td colSpan={12} style={{ padding: 20, textAlign: 'center', color: '#52525b', fontSize: 12 }}>Sin equipos para este filtro.</td></tr>}
            {tabla.map((t) => (
              <tr key={t.id}>
                <td style={tdS}><b>{t.nombre}</b><div style={{ fontSize: 10, color: '#71717a' }}>{t.coach}</div></td>
                <td style={tdS}><span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: 'rgba(59,130,246,.14)', color: '#60a5fa' }}>{t.categoria}</span></td>
                <td style={{ ...tdS, color: '#a1a1aa', fontSize: 11 }}>{t.division}</td>
                <td style={tdS}>{t.pj}</td>
                <td style={tdS}><span style={{ color: '#34d399', fontWeight: 800 }}>{t.v}</span>-{t.e}-<span style={{ color: '#f87171', fontWeight: 800 }}>{t.d}</span></td>
                <td style={tdS}>{t.gf}</td>
                <td style={tdS}>{t.gc}</td>
                <td style={{ ...tdS, color: t.dif >= 0 ? '#34d399' : '#f87171', fontWeight: 800 }}>{t.dif >= 0 ? '+' : ''}{t.dif}</td>
                <td style={tdS}>{t.entrenos}</td>
                <td style={tdS}>{t.asistencia != null ? `${t.asistencia}%` : '—'}</td>
                <td style={{ ...tdS, fontWeight: 900, color: '#fbbf24' }}>{t.dtIndice}</td>
                <td style={tdS}>{t.maxGoleador ? `${t.maxGoleador.nombre} (${t.maxGoleador.goles})` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .ag-awards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        @media(max-width:1100px){.ag-awards{grid-template-columns:repeat(2,1fr)}.ag-awards>div[style*="span 2"]{grid-column:span 2}}
        @media(max-width:680px){.ag-awards{grid-template-columns:1fr}.ag-awards>div{grid-column:span 1 !important}.kpis-grid{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>
    </div>
  )
}

const tdS = { fontSize: 12, padding: '10px 14px', borderBottom: '1px solid #1f1f23', whiteSpace: 'nowrap' }

function Kpi({ lbl, num, sub }) {
  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6, color: '#71717a', marginBottom: 8 }}>{lbl}</div>
      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 10.5, color: '#52525b', marginTop: 5 }}>{sub}</div>
    </div>
  )
}

function Filtro({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600 }}>
      <span style={{ color: '#a1a1aa' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#34d399', fontWeight: 800, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
        {options.map(([v, l]) => <option key={v} value={v} style={{ background: '#18181b', color: '#fafafa' }}>{l}</option>)}
      </select>
    </label>
  )
}

/* ── PDF (window.print) ─────────────────────────────────── */
function podioHTML(titulo, ico, filas) {
  const rows = filas.slice(0, 3).map((f, i) => `
    <tr>
      <td class="pos">${['🥇', '🥈', '🥉'][i]}</td>
      <td><b>${esc(f.nombre)}</b><div class="sub">${esc(f.sub)}</div></td>
      <td class="val">${esc(String(f.val))}${f.valSub ? `<span class="vs"> ${esc(f.valSub)}</span>` : ''}</td>
    </tr>`).join('')
  return `<div class="award"><h3>${ico} ${esc(titulo)}</h3>${filas.length ? `<table class="podio">${rows}</table>` : '<p class="empty">Sin datos suficientes.</p>'}</div>`
}
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

function imprimirPDF(modo, inf, filtroTxt) {
  const { kpis, premios, tabla, notas } = inf
  const map = {
    del: premios.mejorDelantero.map((j) => ({ nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.ga, valSub: `${j.goles}G·${j.asist}A` })),
    med: premios.mejorMedio.map((j) => ({ nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.valMedia ?? '—', valSub: `${j.asist}A` })),
    def: premios.mejorDefensa.map((j) => ({ nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.cleanSheets, valSub: j.valMedia != null ? `val ${j.valMedia}` : '' })),
    por: premios.mejorPortero.map((j) => ({ nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.cleanSheets, valSub: j.gcPorPJ != null ? `${j.gcPorPJ} GC/PJ` : '' })),
    asi: premios.maxAsistente.map((j) => ({ nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.asist, valSub: 'asist' })),
    fair: premios.fairPlay.map((t) => ({ nombre: `${t.nombre} · ${t.categoria}`, sub: `${t.cards} tarj · ${t.pj} PJ`, val: t.cardsPorPJ, valSub: 'tarj/pj' })),
    rev: premios.revelacion.map((j) => ({ nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.valMedia ?? '—', valSub: `${j.valMuestras} PJ` })),
    reg: premios.masRegular.map((j) => ({ nombre: j.nombre, sub: `${j.equipoNombre} · ${j.categoria}`, val: j.pj, valSub: 'PJ' })),
    dt: premios.mejorDT.map((t) => ({ nombre: t.coach, sub: `${t.nombre} · ${t.categoria} · ${t.ppp} pts/pj`, val: t.dtIndice, valSub: 'índice' })),
  }

  const podios = [
    podioHTML('Mejor DT', '🏆', map.dt),
    podioHTML('Mejor Delantero', '⚽', map.del),
    podioHTML('Mejor Mediocampista', '🎯', map.med),
    podioHTML('Mejor Defensa', '🛡️', map.def),
    podioHTML('Mejor Portero', '🧤', map.por),
    podioHTML('Máximo Asistente', '🅰️', map.asi),
    podioHTML('Fair Play', '🤝', map.fair),
    podioHTML('Jugador Revelación', '🌟', map.rev),
    podioHTML('Más Regular', '📈', map.reg),
  ].join('')

  const tablaHTML = modo === 'completo' ? `
    <h2>Detalle por equipo y categoría</h2>
    <table class="grid">
      <thead><tr><th>Club / Equipo</th><th>Cat.</th><th>División</th><th>PJ</th><th>V-E-D</th><th>GF</th><th>GC</th><th>Dif</th><th>Entren.</th><th>Asist.</th><th>Índice DT</th><th>Máx goleador</th></tr></thead>
      <tbody>${tabla.map((t) => `<tr><td><b>${esc(t.nombre)}</b><br><span class="sub">${esc(t.coach)}</span></td><td>${esc(t.categoria)}</td><td>${esc(t.division)}</td><td>${t.pj}</td><td>${t.registro}</td><td>${t.gf}</td><td>${t.gc}</td><td>${t.dif >= 0 ? '+' : ''}${t.dif}</td><td>${t.entrenos}</td><td>${t.asistencia != null ? t.asistencia + '%' : '—'}</td><td><b>${t.dtIndice}</b></td><td>${t.maxGoleador ? esc(t.maxGoleador.nombre) + ' (' + t.maxGoleador.goles + ')' : '—'}</td></tr>`).join('')}</tbody>
    </table>
    ${notas.tendencias.length ? `<h2>Temas recurrentes en las notas</h2><p class="notatxt">${esc(notas.resumen)}</p><p>${notas.tendencias.map((t) => `<span class="tag">${t.emoji} ${esc(t.label)} · ${t.n}</span>`).join(' ')}</p>` : ''}
  ` : ''

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe Global — Kick and Go</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;padding:26px 30px;max-width:1000px;margin:auto}
h1{font-size:22px;font-weight:800}
.meta{font-size:12px;color:#555;margin:3px 0 16px}
.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:20px}
.kpi{border:1px solid #e5e7eb;border-radius:8px;padding:9px 10px}
.kpi .l{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#6b7280}
.kpi .n{font-size:19px;font-weight:900;margin-top:2px}
.kpi .s{font-size:8.5px;color:#9ca3af;margin-top:1px}
h2{font-size:13px;font-weight:800;margin:18px 0 10px;border-bottom:1px solid #e5e7eb;padding-bottom:5px}
.awards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.award{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;break-inside:avoid}
.award h3{font-size:11.5px;font-weight:800;margin-bottom:6px}
.podio{width:100%;border-collapse:collapse}
.podio td{padding:4px 0;font-size:11px;vertical-align:top;border-top:1px solid #f3f4f6}
.podio tr:first-child td{border-top:none}
.podio .pos{width:18px}
.podio .sub{font-size:9px;color:#6b7280}
.podio .val{text-align:right;font-weight:800;color:#059669;white-space:nowrap}
.podio .vs{font-size:8.5px;color:#9ca3af;font-weight:600}
.empty{font-size:10px;color:#9ca3af}
.grid{width:100%;border-collapse:collapse}
.grid th{font-size:8.5px;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;text-align:left;padding:6px 7px;border-bottom:1px solid #e5e7eb}
.grid td{font-size:10.5px;padding:6px 7px;border-bottom:1px solid #f3f4f6}
.grid .sub{font-size:8.5px;color:#9ca3af}
.tag{display:inline-block;font-size:10px;font-weight:700;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;border-radius:5px;padding:2px 7px;margin:2px 3px 0 0}
.notatxt{font-size:11.5px;color:#374151;line-height:1.5;margin-bottom:6px}
.footer{margin-top:26px;font-size:9.5px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between}
@media print{body{padding:0}}
</style></head><body>
<h1>Informe Global · Kick and Go</h1>
<div class="meta">${esc(filtroTxt)} — ${modo === 'completo' ? 'Informe completo' : 'Resumen ejecutivo'} · Generado el ${hoyLargo()}</div>
<div class="kpis">
  <div class="kpi"><div class="l">Clubs</div><div class="n">${nf(kpis.clubs)}</div><div class="s">cuentas</div></div>
  <div class="kpi"><div class="l">Equipos</div><div class="n">${nf(kpis.equipos)}</div><div class="s">${kpis.categorias} categorías</div></div>
  <div class="kpi"><div class="l">Jugadores</div><div class="n">${nf(kpis.jugadores)}</div><div class="s">fichados</div></div>
  <div class="kpi"><div class="l">Partidos</div><div class="n">${nf(kpis.partidos)}</div><div class="s">${esc(kpis.registro)}</div></div>
  <div class="kpi"><div class="l">Goles</div><div class="n">${nf(kpis.goles)}</div><div class="s">${kpis.golesPorPartido}/pj</div></div>
  <div class="kpi"><div class="l">Entrenos</div><div class="n">${nf(kpis.entrenos)}</div><div class="s">${nf(kpis.minutos)} min</div></div>
</div>
<h2>Candidatos a premios</h2>
<div class="awards">${podios}</div>
${tablaHTML}
<div class="footer"><span>Kick and Go · Panel Admin</span><span>${hoyLargo()}</span></div>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { try { w.print() } catch { /* usuario cerró */ } }, 400)
}
