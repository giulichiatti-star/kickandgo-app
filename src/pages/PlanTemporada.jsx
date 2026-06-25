import { useEffect, useState } from 'react'
import { useEquipo } from '../contexts/EquipoContext'
import { getTemporada, guardarTemporada } from '../lib/temporada'
import { listarPartidos } from '../lib/partidos'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function Bar({ valor, objetivo, color = '#10b981' }) {
  const pct = objetivo > 0 ? Math.min(100, Math.round((valor / objetivo) * 100)) : 0
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[11px] mb-1" style={{ color: '#71717a' }}>
        <span style={{ color: pct >= 100 ? color : '#fafafa', fontWeight: 700 }}>{valor}</span>
        <span>objetivo: {objetivo}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

function Toast({ msg, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) } }, [msg])
  if (!msg) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-semibold"
      style={{ background: '#18181b', border: '1px solid #27272a', borderLeft: '3px solid #10b981', color: '#fafafa', boxShadow: '0 4px 20px #000a' }}>
      {msg}
    </div>
  )
}

export default function PlanTemporada() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id

  const [temporada, setTemporada] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [toast, setToast] = useState('')

  // form
  const [form, setForm] = useState({
    nombre: '', objetivo_posicion: '', objetivo_victorias_pct: '',
    objetivo_goles_favor: '', objetivo_goles_contra: '', hitos: [],
  })
  const [nuevoHito, setNuevoHito] = useState({ mes: 0, texto: '' })

  useEffect(() => {
    if (!eid) return
    ;(async () => {
      try {
        const [t, ps] = await Promise.all([getTemporada(eid), listarPartidos(eid)])
        setPartidos(ps || [])
        if (t) {
          setTemporada(t)
          setForm({
            nombre: t.nombre || '',
            objetivo_posicion: t.objetivo_posicion ?? '',
            objetivo_victorias_pct: t.objetivo_victorias_pct ?? '',
            objetivo_goles_favor: t.objetivo_goles_favor ?? '',
            objetivo_goles_contra: t.objetivo_goles_contra ?? '',
            hitos: t.hitos || [],
          })
        } else {
          setEditando(true)
        }
      } catch {}
      finally { setCargando(false) }
    })()
  }, [eid])

  // Calcular reales desde partidos
  const real = (() => {
    const jugados = partidos.filter(p => p.estado === 'finalizado')
    const victorias = jugados.filter(p => p.gf > p.gc).length
    const empates = jugados.filter(p => p.gf === p.gc).length
    const derrotas = jugados.filter(p => p.gf < p.gc).length
    const gf = jugados.reduce((s, p) => s + (p.gf || 0), 0)
    const gc = jugados.reduce((s, p) => s + (p.gc || 0), 0)
    const pct = jugados.length > 0 ? Math.round((victorias / jugados.length) * 100) : 0
    return { jugados: jugados.length, victorias, empates, derrotas, gf, gc, pct }
  })()

  async function guardar() {
    try {
      const saved = await guardarTemporada({ ...form, id: temporada?.id }, eid)
      setTemporada(saved)
      setEditando(false)
      setToast('✅ Plan de temporada guardado')
    } catch (e) { setToast('⚠️ ' + e.message) }
  }

  function agregarHito() {
    if (!nuevoHito.texto.trim()) return
    setForm(f => ({ ...f, hitos: [...f.hitos, { ...nuevoHito, completado: false }] }))
    setNuevoHito({ mes: nuevoHito.mes, texto: '' })
  }

  function toggleHito(i) {
    setForm(f => ({ ...f, hitos: f.hitos.map((h, k) => k === i ? { ...h, completado: !h.completado } : h) }))
  }

  function eliminarHito(i) {
    setForm(f => ({ ...f, hitos: f.hitos.filter((_, k) => k !== i) }))
  }

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  const obj = form
  const hayObjetivos = obj.objetivo_posicion || obj.objetivo_victorias_pct || obj.objetivo_goles_favor || obj.objetivo_goles_contra

  return (
    <div>
      <Toast msg={toast} onClose={() => setToast('')} />

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold">Plan de Temporada</h1>
          <p className="text-xs text-muted mt-0.5">{form.nombre || 'Sin nombre de temporada'}</p>
        </div>
        <button className="btn btn-primary text-xs" onClick={() => setEditando(e => !e)}>
          {editando ? '✕ Cancelar' : '✏️ Editar'}
        </button>
      </div>

      {/* PANEL EDICIÓN */}
      {editando && (
        <div className="card p-4 mb-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Configurar temporada</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted">Nombre de la temporada</label>
              <input className="field mt-1" placeholder="Ej: Temporada 2025/26"
                value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted">Posición objetivo</label>
                <input className="field mt-1" type="number" min={1} max={20} placeholder="Ej: 3"
                  value={form.objetivo_posicion} onChange={e => setForm(f => ({ ...f, objetivo_posicion: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted">% victorias objetivo</label>
                <input className="field mt-1" type="number" min={0} max={100} placeholder="Ej: 60"
                  value={form.objetivo_victorias_pct} onChange={e => setForm(f => ({ ...f, objetivo_victorias_pct: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted">Goles a favor objetivo</label>
                <input className="field mt-1" type="number" min={0} placeholder="Ej: 45"
                  value={form.objetivo_goles_favor} onChange={e => setForm(f => ({ ...f, objetivo_goles_favor: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted">Goles en contra máx.</label>
                <input className="field mt-1" type="number" min={0} placeholder="Ej: 25"
                  value={form.objetivo_goles_contra} onChange={e => setForm(f => ({ ...f, objetivo_goles_contra: e.target.value }))} />
              </div>
            </div>

            {/* Hitos */}
            <div>
              <label className="text-xs text-muted block mb-2">Hitos de temporada</label>
              <div className="flex gap-2">
                <select className="field w-28" value={nuevoHito.mes}
                  onChange={e => setNuevoHito(h => ({ ...h, mes: Number(e.target.value) }))}>
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <input className="field flex-1" placeholder="Descripción del hito"
                  value={nuevoHito.texto} onChange={e => setNuevoHito(h => ({ ...h, texto: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && agregarHito()} />
                <button className="btn btn-primary px-3 text-xs" onClick={agregarHito}>+</button>
              </div>
              {form.hitos.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {[...form.hitos].sort((a, b) => a.mes - b.mes).map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: '#131316' }}>
                      <span className="text-muted w-8 shrink-0">{MESES[h.mes]}</span>
                      <span className="flex-1">{h.texto}</span>
                      <button className="text-muted hover:text-rojo text-[11px]" onClick={() => eliminarHito(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-primary w-full" onClick={guardar}>💾 Guardar plan</button>
          </div>
        </div>
      )}

      {/* PROGRESO REAL */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { lbl: 'Partidos', val: real.jugados, color: '#3b82f6' },
          { lbl: 'Victorias', val: real.victorias, color: '#10b981' },
          { lbl: 'Goles favor', val: real.gf, color: '#2dd4bf' },
          { lbl: 'Goles contra', val: real.gc, color: '#ef4444' },
        ].map(({ lbl, val, color }) => (
          <div key={lbl} className="card p-3 text-center">
            <div className="text-2xl font-black" style={{ color }}>{val}</div>
            <div className="text-[10px] text-muted mt-0.5">{lbl}</div>
          </div>
        ))}
      </div>

      {/* OBJETIVOS vs REAL */}
      {hayObjetivos && (
        <div className="card p-4 mb-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Objetivos vs realidad</div>
          <div className="space-y-4">
            {obj.objetivo_victorias_pct && (
              <div>
                <div className="text-xs font-semibold">% Victorias</div>
                <Bar valor={real.pct} objetivo={Number(obj.objetivo_victorias_pct)} color="#10b981" />
              </div>
            )}
            {obj.objetivo_goles_favor && (
              <div>
                <div className="text-xs font-semibold">Goles a favor</div>
                <Bar valor={real.gf} objetivo={Number(obj.objetivo_goles_favor)} color="#2dd4bf" />
              </div>
            )}
            {obj.objetivo_goles_contra && (
              <div>
                <div className="text-xs font-semibold">Goles en contra <span className="text-muted font-normal">(menos es mejor)</span></div>
                <Bar valor={real.gc} objetivo={Number(obj.objetivo_goles_contra)} color="#ef4444" />
              </div>
            )}
            {obj.objetivo_posicion && (
              <div className="flex items-center justify-between py-2 border-t border-borde">
                <span className="text-xs font-semibold">Posición objetivo</span>
                <span className="text-lg font-black" style={{ color: '#f59e0b' }}>#{obj.objetivo_posicion}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HITOS TIMELINE */}
      {form.hitos.length > 0 && (
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Hitos de temporada</div>
          <div className="space-y-2">
            {[...form.hitos].sort((a, b) => a.mes - b.mes).map((h, i) => (
              <button key={i} onClick={() => { toggleHito(i); guardarTemporada({ ...form, hitos: form.hitos.map((x, k) => k === i ? { ...x, completado: !x.completado } : x), id: temporada?.id }, eid).catch(() => {}) }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition hover:bg-white/5"
                style={{ border: `1px solid ${h.completado ? '#10b98133' : '#27272a'}`, background: h.completado ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                <div className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0"
                  style={{ borderColor: h.completado ? '#10b981' : '#3f3f46', background: h.completado ? '#10b981' : 'transparent', color: '#000' }}>
                  {h.completado ? '✓' : ''}
                </div>
                <span className="text-[11px] font-bold w-8 shrink-0" style={{ color: '#71717a' }}>{MESES[h.mes]}</span>
                <span className={`text-sm flex-1 ${h.completado ? 'line-through text-muted' : ''}`}>{h.texto}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-borde flex items-center justify-between text-[11px] text-muted">
            <span>{form.hitos.filter(h => h.completado).length}/{form.hitos.length} hitos completados</span>
            <div className="h-1.5 w-32 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
              <div style={{ width: `${form.hitos.length ? (form.hitos.filter(h=>h.completado).length/form.hitos.length)*100 : 0}%`, height:'100%', background:'#10b981' }} />
            </div>
          </div>
        </div>
      )}

      {!temporada && !editando && (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-3">🏆</div>
          <div className="text-sm font-semibold mb-1">Sin plan de temporada</div>
          <div className="text-xs text-muted mb-4">Define tus objetivos para esta temporada y haz seguimiento del progreso real.</div>
          <button className="btn btn-primary" onClick={() => setEditando(true)}>✚ Crear plan</button>
        </div>
      )}
    </div>
  )
}
