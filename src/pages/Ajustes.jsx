import { useEffect, useState } from 'react'
import { getPerfil, updatePerfil } from '../lib/perfil'

export default function Ajustes() {
  const [form, setForm] = useState({
    entrenador: '', club_nombre: '', descripcion: '', tipo_equipo: '11', escudo_url: '',
  })
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const p = await getPerfil()
        setForm({
          entrenador: p.entrenador || '',
          club_nombre: p.club_nombre || '',
          descripcion: p.descripcion || '',
          tipo_equipo: p.tipo_equipo || '11',
          escudo_url: p.escudo_url || '',
        })
        setEmail(p.email || '')
      } catch (e) { setMsg('⚠️ ' + e.message) }
      finally { setCargando(false) }
    })()
  }, [])

  function subirEscudo(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 600 * 1024) { setMsg('⚠️ Imagen muy grande (máx ~600KB)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, escudo_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function guardar() {
    setMsg('')
    try {
      await updatePerfil(form)
      setMsg('✅ Guardado')
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Club y ajustes</h1>

      {/* Escudo */}
      <div className="card p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-white/5 border border-borde grid place-items-center text-3xl overflow-hidden flex-shrink-0">
          {form.escudo_url ? <img src={form.escudo_url} className="w-full h-full object-cover" /> : '🛡️'}
        </div>
        <div>
          <label className="btn btn-outline text-xs cursor-pointer">
            📷 Subir escudo
            <input type="file" accept="image/*" className="hidden" onChange={subirEscudo} />
          </label>
          <div className="text-[10px] text-muted mt-1">Se muestra en el inicio · máx ~600KB</div>
        </div>
      </div>

      {/* Datos */}
      <div className="card p-4 space-y-3">
        <Campo label="Tu nombre (entrenador)" value={form.entrenador}
          onChange={(v) => setForm({ ...form, entrenador: v })} placeholder="Ej: Borja" />
        <Campo label="Nombre del club" value={form.club_nombre}
          onChange={(v) => setForm({ ...form, club_nombre: v })} placeholder="Ej: Llavaneres CF" />
        <Campo label="Descripción / categoría" value={form.descripcion}
          onChange={(v) => setForm({ ...form, descripcion: v })} placeholder="Ej: Llavaneres 3ª" />
      </div>

      {/* Tipo de equipo */}
      <div className="card p-4">
        <div className="text-xs text-muted mb-2">Tipo de equipo</div>
        <div className="flex gap-2">
          {['11', '7'].map((t) => (
            <button key={t} onClick={() => setForm({ ...form, tipo_equipo: t })}
              className={`flex-1 py-3 rounded-lg border text-sm font-bold transition ${
                form.tipo_equipo === t ? 'border-cyan bg-cyan/10 text-cyan' : 'border-borde text-muted'}`}>
              Fútbol {t}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-muted mt-2">
          Define jugadores en campo, pizarra y formaciones. Conviene fijarlo al empezar.
        </div>
      </div>

      <div className="text-xs text-muted">Cuenta: {email}</div>
      {msg && <div className="text-xs text-zinc-300">{msg}</div>}
      <button className="btn btn-primary w-full" onClick={guardar}>💾 Guardar</button>
    </div>
  )
}

function Campo({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
