import { useEffect, useState } from 'react'
import { listarLeads, actualizarLead, activarLead } from '../lib/leads'

const ESTADOS = {
  nuevo:       { label: 'Nuevo',       bg: 'rgba(59,130,246,.12)',  fg: '#60a5fa' },
  contactado:  { label: 'Contactado',  bg: 'rgba(245,158,11,.12)',  fg: '#fbbf24' },
  activo:      { label: 'Activo',      bg: 'rgba(34,197,94,.12)',   fg: '#4ade80' },
  descartado:  { label: 'Descartado',  bg: 'rgba(239,68,68,.12)',   fg: '#f87171' },
}

export default function AdminLeads() {
  const [leads, setLeads] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [procesando, setProcesando] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  async function recargar() {
    setCargando(true)
    try { setLeads(await listarLeads()) }
    catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  useEffect(() => { recargar() }, [])

  async function marcarContactado(id) {
    await actualizarLead(id, { estado: 'contactado' })
    recargar()
  }

  async function marcarDescartado(id) {
    await actualizarLead(id, { estado: 'descartado' })
    recargar()
  }

  async function guardarNota(id, notas_admin) {
    await actualizarLead(id, { notas_admin })
  }

  async function darDeAlta(id) {
    if (!confirm('¿Crear la cuenta real para este lead? Se generará una contraseña y se enviará por email.')) return
    setProcesando(id); setError(''); setResultado(null)
    try {
      const res = await activarLead(id)
      setResultado({ id, ...res })
      recargar()
    } catch (e) {
      setError(e.message || 'Error al dar de alta')
    } finally {
      setProcesando(null)
    }
  }

  const visibles = filtro === 'todos' ? leads : leads.filter(l => l.estado === filtro)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold">🔐 Panel Admin — Leads</h1>
          <p className="text-xs text-muted">Solicitudes de prueba gratuita desde la landing</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['todos', 'nuevo', 'contactado', 'activo', 'descartado'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`btn text-xs ${filtro === f ? 'btn-primary' : 'btn-outline'}`}>
              {f === 'todos' ? 'Todos' : ESTADOS[f].label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-3 text-xs" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>
          ⚠️ {error}
        </div>
      )}

      {resultado && (
        <div className="card p-4 text-xs" style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)' }}>
          <div className="font-bold text-[#4ade80] mb-1">✅ Cuenta creada</div>
          <div>Contraseña generada: <code className="font-mono font-bold">{resultado.password}</code></div>
          <div className="text-muted mt-1">
            {resultado.emailEnviado ? 'Email de bienvenida enviado correctamente.' : '⚠️ El email no se pudo enviar — copia la contraseña y envíasela manualmente.'}
          </div>
        </div>
      )}

      {cargando ? (
        <div className="card p-8 text-center text-sm text-muted">Cargando…</div>
      ) : visibles.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">No hay leads en este filtro.</div>
      ) : (
        <div className="space-y-3">
          {visibles.map(l => (
            <LeadCard key={l.id}
              lead={l}
              procesando={procesando === l.id}
              onContactado={() => marcarContactado(l.id)}
              onDescartado={() => marcarDescartado(l.id)}
              onGuardarNota={(n) => guardarNota(l.id, n)}
              onAlta={() => darDeAlta(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LeadCard({ lead, procesando, onContactado, onDescartado, onGuardarNota, onAlta }) {
  const [nota, setNota] = useState(lead.notas_admin || '')
  const est = ESTADOS[lead.estado] || ESTADOS.nuevo

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{lead.nombre}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.fg }}>
              {est.label}
            </span>
          </div>
          <div className="text-xs text-muted mt-1">
            {lead.email} {lead.telefono && `· ${lead.telefono}`} {lead.equipo_nombre && `· ${lead.equipo_nombre}`}
          </div>
          <div className="text-[10px] text-muted mt-1">
            Alta: {new Date(lead.creado).toLocaleDateString('es-ES')}
            {lead.activado_en && ` · Activado: ${new Date(lead.activado_en).toLocaleDateString('es-ES')}`}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lead.estado === 'nuevo' && (
            <button className="btn btn-outline text-xs" onClick={onContactado}>Marcar contactado</button>
          )}
          {lead.estado !== 'activo' && lead.estado !== 'descartado' && (
            <button className="btn btn-outline text-xs" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,.3)' }} onClick={onDescartado}>Descartar</button>
          )}
          {lead.estado !== 'activo' && (
            <button className="btn btn-primary text-xs" onClick={onAlta} disabled={procesando}>
              {procesando ? 'Creando…' : 'Dar de alta →'}
            </button>
          )}
        </div>
      </div>
      <textarea
        className="field text-xs mt-3"
        rows={2}
        placeholder="Notas: cuándo cobrar, seguimiento…"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        onBlur={() => onGuardarNota(nota)}
      />
    </div>
  )
}
