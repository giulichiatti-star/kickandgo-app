import { useEffect, useState } from 'react'
import {
  listarJugadores, crearJugador, actualizarJugador, eliminarJugador, posACat,
} from '../lib/jugadores'

const POSICIONES = [
  'Portero', 'Lateral derecho', 'Central', 'Lateral izquierdo',
  'Mediocampista', 'Mediapunta', 'Extremo', 'Delantero centro',
]
const CAT_COLOR = {
  POR: 'bg-dorado/15 text-dorado',
  DEF: 'bg-azul/15 text-azul',
  MED: 'bg-morado/15 text-morado',
  DEL: 'bg-rojo/15 text-rojo',
}
const vacio = { nombre: '', dorsal: '', posicion: 'Mediocampista', pie: 'Derecho', nacimiento: '', foto_url: '' }
const FILTROS = ['Todos', 'POR', 'DEF', 'MED', 'DEL']

export default function Plantilla() {
  const [jugadores, setJugadores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('Todos')

  async function refrescar() {
    setCargando(true)
    try { setJugadores(await listarJugadores()) }
    catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }
  useEffect(() => { refrescar() }, [])

  function abrirNuevo() { setEditId(null); setForm(vacio); setError(''); setModal(true) }
  function abrirEdit(j) {
    setEditId(j.id)
    setForm({ nombre: j.nombre, dorsal: j.dorsal, posicion: j.posicion, pie: j.pie || 'Derecho', nacimiento: j.nacimiento || '', foto_url: j.foto_url || '' })
    setError(''); setModal(true)
  }

  function subirFoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 600 * 1024) { setError('Foto muy grande (máx ~600KB)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, foto_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.dorsal) { setError('Nombre y dorsal son obligatorios'); return }
    const payload = {
      nombre: form.nombre.trim(),
      dorsal: parseInt(form.dorsal) || 0,
      posicion: form.posicion,
      pie: form.pie,
      nacimiento: form.nacimiento || null,
      foto_url: form.foto_url || '',
    }
    try {
      if (editId) await actualizarJugador(editId, payload)
      else await crearJugador({ ...payload, estado: 'activo' })
      setModal(false)
      await refrescar()
    } catch (e) { setError(e.message) }
  }

  async function borrar(j) {
    if (!confirm(`¿Dar de baja a ${j.nombre}?`)) return
    await eliminarJugador(j.id)
    await refrescar()
  }

  function inicial(n) {
    const p = (n || '').trim().split(/\s+/)
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold">Plantilla</h1>
          <p className="text-xs text-muted">{jugadores.length} jugadores</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Jugador</button>
      </div>

      {/* Filtros por posición */}
      {jugadores.length > 0 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition ${
                filtro === f ? 'border-cyan bg-cyan/10 text-cyan' : 'border-borde text-muted'}`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {error && <div className="text-xs text-rojo mb-3">{error}</div>}

      {cargando ? (
        <div className="text-sm text-muted py-10 text-center">Cargando…</div>
      ) : jugadores.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          Aún no hay jugadores. Pulsa <b className="text-cyan">+ Jugador</b> para empezar.
        </div>
      ) : (
        <div className="space-y-2">
          {jugadores.filter((j) => filtro === 'Todos' || posACat(j.posicion) === filtro).map((j) => {
            const cat = posACat(j.posicion)
            return (
              <div key={j.id} className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-borde flex items-center justify-center text-xs font-extrabold text-cyan flex-shrink-0 overflow-hidden">
                  {j.foto_url
                    ? <img src={j.foto_url} className="w-full h-full object-cover" />
                    : inicial(j.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {j.nombre}
                    {j.estado === 'lesionado' && ' 🩺'}
                    {j.estado === 'sancionado' && ' 🚫'}
                  </div>
                  <div className="text-[11px] text-muted">#{j.dorsal} · {j.posicion}</div>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${CAT_COLOR[cat]}`}>{cat}</span>
                <button className="text-muted hover:text-cyan px-1" onClick={() => abrirEdit(j)} title="Editar">✏️</button>
                <button className="text-muted hover:text-rojo px-1" onClick={() => borrar(j)} title="Dar de baja">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-5"
             onClick={() => setModal(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardar}
            className="card w-full sm:max-w-md p-5 rounded-b-none sm:rounded-xl">
            <h2 className="text-base font-extrabold mb-4">
              {editId ? '✏️ Editar jugador' : '👤 Nuevo jugador'}
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-borde grid place-items-center text-xl overflow-hidden flex-shrink-0">
                {form.foto_url ? <img src={form.foto_url} className="w-full h-full object-cover" /> : '👤'}
              </div>
              <label className="btn btn-outline text-xs cursor-pointer">
                📷 Foto
                <input type="file" accept="image/*" className="hidden" onChange={subirFoto} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted">Nombre *</label>
                <input className="field mt-1" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre y apellido" />
              </div>
              <div>
                <label className="text-xs text-muted">Dorsal *</label>
                <input className="field mt-1" type="number" min="1" max="99" value={form.dorsal}
                  onChange={(e) => setForm({ ...form, dorsal: e.target.value })} placeholder="#" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-muted">Posición</label>
              <select className="field mt-1" value={form.posicion}
                onChange={(e) => setForm({ ...form, posicion: e.target.value })}>
                {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-muted">Pie hábil</label>
                <select className="field mt-1" value={form.pie}
                  onChange={(e) => setForm({ ...form, pie: e.target.value })}>
                  <option>Derecho</option><option>Izquierdo</option><option>Ambos</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted">Nacimiento</label>
                <input className="field mt-1" type="date" value={form.nacimiento || ''}
                  onChange={(e) => setForm({ ...form, nacimiento: e.target.value })} />
              </div>
            </div>
            {error && <div className="text-xs text-rojo mt-3">{error}</div>}
            <div className="flex gap-2 mt-5">
              <button type="button" className="btn btn-outline flex-1" onClick={() => setModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary flex-1">
                {editId ? 'Guardar cambios' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
