import { useEffect, useMemo, useState } from 'react'
import { listarLeads, actualizarLead, activarLeads, contactarLeads, linkWhatsapp } from '../lib/leads'
import { listarCuentas, marcarPagado, marcarMora, darDeBaja, reactivar, resetearPassword, proximoVencimiento, eliminarCuenta, marcarFundador, listarAvisosPago, confirmarAviso } from '../lib/cuentas'
import { listarUsoApp, nombreRuta } from '../lib/analytics'
import TabResumen from '../components/admin/TabResumen'
import { generarAccesoCliente, listarAccesos } from '../lib/adminAcceso'

const CUPO_FUNDADORES = 50

const DIAS_GRACIA = 2

function ConfirmModal({ mensaje, onCancelar, onConfirmar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancelar}>
      <div className="card p-5" style={{ maxWidth: 420, width: '90%', border: '1px solid rgba(45,212,191,.3)' }} onClick={(e) => e.stopPropagation()}>
        <div className="text-sm mb-4">{mensaje}</div>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-outline text-xs" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-primary text-xs" onClick={onConfirmar}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function useConfirm() {
  const [pedido, setPedido] = useState(null)
  function confirmar(mensaje, accion) {
    setPedido({ mensaje, accion })
  }
  function cerrar() { setPedido(null) }
  const modal = pedido && (
    <ConfirmModal mensaje={pedido.mensaje} onCancelar={cerrar}
      onConfirmar={() => { const a = pedido.accion; cerrar(); a() }} />
  )
  return [modal, confirmar]
}

const ESTADOS_LEAD = {
  nuevo:       { label: 'Nuevo',       bg: 'rgba(59,130,246,.12)',  fg: '#60a5fa' },
  contactado:  { label: 'Contactado',  bg: 'rgba(245,158,11,.12)',  fg: '#fbbf24' },
  activo:      { label: 'Activo',      bg: 'rgba(34,197,94,.12)',   fg: '#4ade80' },
  descartado:  { label: 'Descartado',  bg: 'rgba(239,68,68,.12)',   fg: '#f87171' },
}

const ESTADOS_PLAN = {
  prueba:   { label: 'En prueba',  bg: 'rgba(59,130,246,.12)',  fg: '#60a5fa' },
  vencido:  { label: 'Vencido',    bg: 'rgba(245,158,11,.12)',  fg: '#fbbf24' },
  pagado:   { label: 'Pagado',     bg: 'rgba(34,197,94,.12)',   fg: '#4ade80' },
  mora:     { label: 'En mora',    bg: 'rgba(239,68,68,.12)',   fg: '#f87171' },
  baja:     { label: 'De baja',    bg: 'rgba(113,113,122,.15)', fg: '#a1a1aa' },
}

export default function AdminLeads() {
  const [tab, setTab] = useState('resumen')
  const [avisosPendientes, setAvisosPendientes] = useState(0)

  useEffect(() => {
    listarAvisosPago()
      .then(data => setAvisosPendientes(data.filter(a => a.estado === 'pendiente').length))
      .catch(() => {})
  }, [tab])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">🔐 Panel Admin</h1>
        <p className="text-xs text-muted">Leads, contacto, alta y ciclo de vida de cuentas</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className={`btn text-xs ${tab === 'resumen' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('resumen')}>📊 Resumen</button>
        <button className={`btn text-xs ${tab === 'leads' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('leads')}>Leads</button>
        <button className={`btn text-xs ${tab === 'cuentas' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('cuentas')}>Cuentas</button>
        <button className={`btn text-xs ${tab === 'pagos' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('pagos')} style={{ position: 'relative' }}>
          Avisos de pago
          {avisosPendientes > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avisosPendientes}
            </span>
          )}
        </button>
        <button className={`btn text-xs ${tab === 'uso' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('uso')}>Uso de la app</button>
      </div>
      {tab === 'resumen' && <TabResumen />}
      {tab === 'leads' && <TabLeads />}
      {tab === 'cuentas' && <TabCuentas />}
      {tab === 'pagos' && <TabPagos />}
      {tab === 'uso' && <TabUso />}
    </div>
  )
}

// ───────────────────────── TAB USO DE LA APP ─────────────────────────

function TabUso() {
  const [dias, setDias] = useState(30)
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [accesos, setAccesos] = useState([])

  useEffect(() => {
    setCargando(true); setError('')
    listarUsoApp(dias)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
    listarAccesos().then(setAccesos).catch(() => {})
  }, [dias])

  const kpi = (label, val, color) => (
    <div className="card p-3">
      <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className="text-lg font-extrabold" style={{ color }}>{val}</div>
    </div>
  )

  const fmtMin = (seg) => {
    const m = Math.round(seg / 60)
    if (m < 60) return `${m} min`
    return `${Math.floor(m / 60)}h ${m % 60}m`
  }
  const fmtFecha = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const totalSegundos = data ? data.usuarios.reduce((a, u) => a + u.segundos, 0) : 0
  const maxSeccion = data?.secciones[0]?.segundos || 1

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm font-bold text-muted">Actividad de las cuentas</div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn text-xs ${dias === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDias(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-xs text-red-400 mb-3">⚠️ {error}</div>}
      {cargando ? (
        <div className="text-xs text-muted py-8 text-center">Cargando…</div>
      ) : !data || data.usuarios.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">
          Sin actividad registrada en los últimos {dias} días.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {kpi('Cuentas activas', data.usuarios.length, '#4ade80')}
            {kpi('Tiempo total', fmtMin(totalSegundos), '#60a5fa')}
            {kpi('Eventos registrados', data.totalEventos, '#a1a1aa')}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ranking de usuarios */}
            <div className="card p-4">
              <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🏆 Ranking de uso por cuenta</div>
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#71717a', textAlign: 'left' }}>
                    <th className="pb-2 font-semibold">Club</th>
                    <th className="pb-2 font-semibold text-right">Tiempo</th>
                    <th className="pb-2 font-semibold text-right">Última visita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usuarios.map(u => (
                    <tr key={u.userId} style={{ borderTop: '1px solid #27272a' }}>
                      <td className="py-2">
                        <div className="font-semibold">{u.club}</div>
                        {u.entrenador && <div className="text-muted" style={{ fontSize: 10.5 }}>{u.entrenador}</div>}
                      </td>
                      <td className="py-2 text-right font-bold" style={{ color: '#34d399' }}>{fmtMin(u.segundos)}</td>
                      <td className="py-2 text-right text-muted">{fmtFecha(u.ultimaVisita)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tiempo por sección */}
            <div className="card p-4">
              <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📊 Secciones más usadas</div>
              <div className="space-y-2.5">
                {data.secciones.map(s => (
                  <div key={s.ruta}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{nombreRuta(s.ruta)}</span>
                      <span className="text-muted">{fmtMin(s.segundos)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div style={{ width: `${Math.max(3, (s.segundos / maxSeccion) * 100)}%`, background: '#2dd4bf', height: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {accesos.length > 0 && (
        <div className="card p-4 mt-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🔒 Log de accesos "ver como cliente"</div>
          <div className="text-[10.5px] text-muted mb-3">Solo vos ves este registro — es tu respaldo interno, el cliente nunca es notificado de estos accesos.</div>
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#71717a', textAlign: 'left' }}>
                <th className="pb-2 font-semibold">Cliente</th>
                <th className="pb-2 font-semibold text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map(a => (
                <tr key={a.id} style={{ borderTop: '1px solid #27272a' }}>
                  <td className="py-2">{a.cliente_email}</td>
                  <td className="py-2 text-right text-muted">{new Date(a.creado).toLocaleString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ───────────────────────── TAB LEADS ─────────────────────────

function TabLeads() {
  const [leads, setLeads] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [seleccion, setSeleccion] = useState(new Set())
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [modalConfirm, confirmar] = useConfirm()

  async function recargar() {
    setCargando(true)
    try { setLeads(await listarLeads()) }
    catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }
  useEffect(() => { recargar() }, [])

  const visibles = useMemo(() => {
    if (filtro === 'todos') return leads
    if (filtro === 'respondio_si') return leads.filter(l => l.respondio === 'si')
    if (filtro === 'respondio_no') return leads.filter(l => l.respondio === 'no')
    return leads.filter(l => l.estado === filtro)
  }, [leads, filtro])

  function toggleSel(id) {
    setSeleccion(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function seleccionarNuevos() {
    setSeleccion(new Set(leads.filter(l => l.estado === 'nuevo').map(l => l.id)))
  }
  function limpiarSeleccion() { setSeleccion(new Set()) }

  async function accionMasivaContactar() {
    setProcesando(true); setError(''); setResultado(null)
    try {
      const ids = [...seleccion]
      const res = await contactarLeads(ids)
      setResultado({ tipo: 'contactar', ...res })
      limpiarSeleccion(); recargar()
    } catch (e) { setError(e.message) }
    finally { setProcesando(false) }
  }

  async function accionMasivaWhatsapp() {
    const seleccionados = leads.filter(l => seleccion.has(l.id) && l.telefono)
    seleccionados.forEach((l, i) => {
      setTimeout(() => window.open(linkWhatsapp(l), '_blank'), i * 400)
    })
    // marcar como contactado tras abrir los enlaces
    for (const id of seleccion) {
      await actualizarLead(id, { estado: 'contactado', contactado_en: new Date().toISOString() })
    }
    limpiarSeleccion(); recargar()
  }

  async function accionMasivaContactado() {
    for (const id of seleccion) {
      await actualizarLead(id, { estado: 'contactado', contactado_en: new Date().toISOString() })
    }
    limpiarSeleccion(); recargar()
  }

  function accionMasivaAlta() {
    confirmar(`¿Dar de alta ${seleccion.size} lead(s)? Se generarán contraseñas y se enviarán emails.`, async () => {
      setProcesando(true); setError(''); setResultado(null)
      try {
        const ids = [...seleccion]
        const res = await activarLeads(ids)
        setResultado({ tipo: 'alta', ...res })
        limpiarSeleccion(); recargar()
      } catch (e) { setError(e.message) }
      finally { setProcesando(false) }
    })
  }

  async function setRespondio(id, valor) {
    await actualizarLead(id, { respondio: valor })
    recargar()
  }

  async function guardarNota(id, notas_admin) {
    await actualizarLead(id, { notas_admin })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {['todos', 'nuevo', 'contactado', 'respondio_si', 'respondio_no', 'activo', 'descartado'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`btn text-xs ${filtro === f ? 'btn-primary' : 'btn-outline'}`}>
            {{ todos: 'Todos', nuevo: 'Nuevo', contactado: 'Contactado', respondio_si: 'Respondió sí', respondio_no: 'Respondió no', activo: 'Activo', descartado: 'Descartado' }[f]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <button className="btn btn-outline text-xs" onClick={seleccionarNuevos}>Seleccionar todos los nuevos</button>
        {seleccion.size > 0 && (
          <>
            <span className="text-muted">{seleccion.size} seleccionados</span>
            <button className="btn btn-outline text-xs" onClick={accionMasivaContactar} disabled={procesando}>✉️ Contactar por email</button>
            <button className="btn btn-outline text-xs" onClick={accionMasivaWhatsapp}>💬 Abrir WhatsApp</button>
            <button className="btn btn-outline text-xs" onClick={accionMasivaContactado}>✅ Marcar contactado</button>
            <button className="btn btn-primary text-xs" onClick={accionMasivaAlta} disabled={procesando}>🚀 Dar de alta</button>
            <button className="btn btn-outline text-xs" style={{ color: '#71717a' }} onClick={limpiarSeleccion}>Limpiar</button>
          </>
        )}
      </div>
      <p className="text-[10px] text-muted">El botón de WhatsApp abre una pestaña por cada lead seleccionado con el mensaje ya escrito — el navegador puede pedir permiso para abrir varias pestañas.</p>

      {error && (
        <div className="card p-3 text-xs" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>⚠️ {error}</div>
      )}

      {resultado && (
        <div className="card p-4 text-xs" style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)' }}>
          <div className="font-bold text-[#4ade80] mb-2">
            {resultado.tipo === 'alta' ? '✅ Altas procesadas' : '✅ Emails enviados'}
          </div>
          {resultado.resultados?.map(r => (
            <div key={r.leadId} className="mb-1">
              {r.ok
                ? (resultado.tipo === 'alta'
                  ? <>Cuenta creada — contraseña: <code className="font-mono font-bold">{r.password}</code> {!r.emailEnviado && '(⚠️ email no enviado, cópiala manualmente)'}</>
                  : 'Email enviado correctamente')
                : <span className="text-[#f87171]">Error: {r.error}</span>}
            </div>
          ))}
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
              seleccionado={seleccion.has(l.id)}
              onToggleSel={() => toggleSel(l.id)}
              onRespondio={(v) => setRespondio(l.id, v)}
              onGuardarNota={(n) => guardarNota(l.id, n)}
            />
          ))}
        </div>
      )}
      {modalConfirm}
    </div>
  )
}

function LeadCard({ lead, seleccionado, onToggleSel, onRespondio, onGuardarNota }) {
  const [nota, setNota] = useState(lead.notas_admin || '')
  const est = ESTADOS_LEAD[lead.estado] || ESTADOS_LEAD.nuevo

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <input type="checkbox" className="mt-1" checked={seleccionado} onChange={onToggleSel} />
        <div className="flex-1">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{lead.nombre}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.fg }}>{est.label}</span>
                {lead.email_enviado && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,.12)', color: '#34d399' }}>✉️ Email enviado</span>}
                {lead.respondio === 'si' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,.12)', color: '#4ade80' }}>Respondió: Sí</span>}
                {lead.respondio === 'no' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,.12)', color: '#f87171' }}>Respondió: No</span>}
              </div>
              <div className="text-xs text-muted mt-1">
                {lead.email} {lead.telefono && `· ${lead.telefono}`} {lead.equipo_nombre && `· ${lead.equipo_nombre}`}
              </div>
              <div className="text-[10px] text-muted mt-1">
                Alta: {new Date(lead.creado).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                {lead.activado_en && ` · Activado: ${new Date(lead.activado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`}
                {lead.contactado_en && !lead.activado_en && ` · Contactado: ${new Date(lead.contactado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`}
              </div>
            </div>
            <div className="flex gap-1 flex-wrap items-center">
              <span className="text-[10px] text-muted mr-1">Respondió:</span>
              <button className={`btn text-xs ${lead.respondio === 'si' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onRespondio('si')}>Sí</button>
              <button className={`btn text-xs ${lead.respondio === 'no' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onRespondio('no')}>No</button>
            </div>
          </div>
          <textarea
            className="field text-xs mt-3"
            rows={2}
            placeholder="Notas: seguimiento, dudas, fecha de cobro…"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            onBlur={() => onGuardarNota(nota)}
          />
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── TAB CUENTAS ─────────────────────────

function diasRestantes(fechaISO) {
  if (!fechaISO) return null
  const dias = Math.ceil((new Date(fechaISO) - new Date()) / (1000 * 60 * 60 * 24))
  return dias
}

// Fecha relevante de vencimiento según el estado del plan (prueba o pago)
function fechaVencimientoRelevante(cuenta) {
  if (cuenta.plan_estado === 'prueba') return cuenta.prueba_vence
  if (cuenta.plan_estado === 'pagado' || cuenta.plan_estado === 'mora') return cuenta.pago_vence
  return null
}

function TipoCliente({ cuenta }) {
  const esPrueba = cuenta.plan_estado === 'prueba' || cuenta.plan_estado === 'vencido'
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={esPrueba
        ? { background: 'rgba(139,92,246,.12)', color: '#c4b5fd' }
        : { background: 'rgba(45,212,191,.12)', color: '#2dd4bf' }}>
      {esPrueba ? '🆕 Prueba gratis' : '🔁 Cliente recurrente'}
    </span>
  )
}

function calcularAlertas(cuentas) {
  const porVencer = []
  const enGracia = []
  for (const c of cuentas) {
    if (c.plan_estado === 'baja') continue
    const fecha = fechaVencimientoRelevante(c)
    if (!fecha) continue
    const dias = diasRestantes(fecha)
    if (dias === null) continue
    if (dias >= 0 && dias <= 3) porVencer.push({ cuenta: c, dias })
    else if (dias < 0 && c.activo) enGracia.push({ cuenta: c, dias: -dias })
  }
  porVencer.sort((a, b) => a.dias - b.dias)
  enGracia.sort((a, b) => b.dias - a.dias)
  return { porVencer, enGracia }
}

function TabCuentas() {
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [error, setError] = useState('')
  const [passwordReseteada, setPasswordReseteada] = useState(null)
  const [accesoGenerado, setAccesoGenerado] = useState(null)
  const [generandoAcceso, setGenerandoAcceso] = useState(null)
  const [modalConfirm, confirmar] = useConfirm()

  async function onVerComo(cuenta) {
    setError(''); setGenerandoAcceso(cuenta.id)
    try {
      const res = await generarAccesoCliente(cuenta.id)
      setAccesoGenerado({ club: cuenta.club_nombre, email: res.email, link: res.link })
    } catch (e) { setError(e.message) }
    finally { setGenerandoAcceso(null) }
  }

  async function recargar() {
    setCargando(true)
    try { setCuentas(await listarCuentas()) }
    catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }
  useEffect(() => { recargar() }, [])

  function onResetPassword(cuenta) {
    confirmar(`¿Generar una contraseña nueva para ${cuenta.club_nombre}? La anterior dejará de funcionar.`, async () => {
      try {
        const res = await resetearPassword(cuenta.id)
        setPasswordReseteada({ email: cuenta.email, password: res.password })
      } catch (e) { setError(e.message) }
    })
  }

  const visibles = useMemo(() => {
    if (filtro === 'todos') return cuentas
    if (filtro === 'por_vencer') return cuentas.filter(c => c.plan_estado === 'prueba' && diasRestantes(c.prueba_vence) !== null && diasRestantes(c.prueba_vence) <= 3)
    if (filtro === 'suspendidos') return cuentas.filter(c => !c.activo)
    return cuentas.filter(c => c.plan_estado === filtro)
  }, [cuentas, filtro])

  const alertas = useMemo(() => calcularAlertas(cuentas), [cuentas])
  const fundadoresActuales = useMemo(() => cuentas.filter(c => c.es_fundador).length, [cuentas])

  async function accion(fn, ...args) {
    try { await fn(...args); recargar() }
    catch (e) { setError(e.message) }
  }

  function onEliminar(cuenta) {
    confirmar(`⚠️ ESTO ES IRREVERSIBLE. Se borrará por completo la cuenta de ${cuenta.club_nombre} (${cuenta.email}) y todos sus datos: jugadores, partidos, entrenamientos, convocatorias, tarjetas y lesiones. No se puede deshacer. ¿Confirmas la eliminación?`,
      () => accion(eliminarCuenta, cuenta.id))
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex items-center justify-between flex-wrap gap-2" style={{ border: '1px solid rgba(245,166,35,.3)' }}>
        <div className="font-bold text-sm" style={{ color: '#f5a623' }}>🔥 Fundadores</div>
        <div className="text-sm">
          <b style={{ color: fundadoresActuales >= CUPO_FUNDADORES ? '#f87171' : '#f5a623' }}>{fundadoresActuales}</b>
          <span className="text-muted"> / {CUPO_FUNDADORES} cupo usado</span>
          {fundadoresActuales >= CUPO_FUNDADORES && <span className="text-[10px] font-bold ml-2" style={{ color: '#f87171' }}>CUPO COMPLETO — deja de ofrecer precio fundador</span>}
        </div>
      </div>

      <div className="card p-4" style={{ border: '1px solid rgba(245,158,11,.3)' }}>
        <div className="font-bold text-sm mb-3" style={{ color: '#fbbf24' }}>⚠️ Alertas de cobro</div>
        {alertas.porVencer.length === 0 && alertas.enGracia.length === 0 ? (
          <div className="text-xs text-muted">No hay ninguna cuenta por vencer ni en gracia ahora mismo.</div>
        ) : (
          <div className="space-y-2">
            {alertas.enGracia.map(({ cuenta: c, dias }) => (
              <div key={c.id} className="flex items-center justify-between flex-wrap gap-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,.08)' }}>
                <div className="text-xs flex items-center gap-2 flex-wrap">
                  <TipoCliente cuenta={c} />
                  <span><b>{c.club_nombre}</b> — vencido hace {dias} día(s) {dias >= DIAS_GRACIA ? '(se suspenderá hoy si no se registra el pago)' : `(se suspende en ${DIAS_GRACIA - dias} día(s))`}</span>
                </div>
                <button className="btn btn-primary text-xs" onClick={() => accion(marcarPagado, c)}>💳 Pagado</button>
              </div>
            ))}
            {alertas.porVencer.map(({ cuenta: c, dias }) => (
              <div key={c.id} className="flex items-center justify-between flex-wrap gap-2 p-2 rounded-lg" style={{ background: 'rgba(245,158,11,.08)' }}>
                <div className="text-xs flex items-center gap-2 flex-wrap">
                  <TipoCliente cuenta={c} />
                  <span><b>{c.club_nombre}</b> — {dias === 0 ? 'vence hoy' : `vence en ${dias} día(s)`} ({c.plan_estado === 'prueba' ? 'fin de prueba' : 'próximo pago'})</span>
                </div>
                <button className="btn btn-primary text-xs" onClick={() => accion(marcarPagado, c)}>💳 Pagado</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['todos', 'por_vencer', 'prueba', 'pagado', 'mora', 'baja', 'suspendidos'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`btn text-xs ${filtro === f ? 'btn-primary' : 'btn-outline'}`}>
            {{ todos: 'Todos', por_vencer: 'Por vencer (≤3 días)', prueba: 'En prueba', pagado: 'Pagados', mora: 'En mora', baja: 'De baja', suspendidos: 'Suspendidos' }[f]}
          </button>
        ))}
      </div>

      {error && (
        <div className="card p-3 text-xs" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>⚠️ {error}</div>
      )}

      {passwordReseteada && (
        <div className="card p-4 text-xs" style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)' }}>
          <div className="font-bold text-[#4ade80] mb-1">✅ Contraseña generada</div>
          <div>Para <b>{passwordReseteada.email}</b>: <code className="font-mono font-bold">{passwordReseteada.password}</code></div>
          <div className="text-muted mt-1">Cópiala y envíasela por WhatsApp o email — no se guarda en ningún sitio, solo se muestra ahora.</div>
        </div>
      )}

      {accesoGenerado && (
        <div className="card p-4 text-xs" style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.3)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-[#60a5fa]">🔗 Enlace de acceso generado — {accesoGenerado.club}</div>
            <button className="text-muted hover:text-red-400" onClick={() => setAccesoGenerado(null)}>✕</button>
          </div>
          <div className="mb-2">Para <b>{accesoGenerado.email}</b></div>
          <div className="flex gap-2 items-center">
            <code className="font-mono flex-1 truncate p-2 rounded bg-black/30">{accesoGenerado.link}</code>
            <button className="btn btn-outline text-xs shrink-0" onClick={() => { navigator.clipboard.writeText(accesoGenerado.link); }}>📋 Copiar</button>
          </div>
          <div className="text-muted mt-2">
            ⚠️ Abrilo en una <b>ventana de incógnito</b> (Ctrl+Shift+N / Cmd+Shift+N) — si lo abrís en esta misma ventana, perdés tu sesión de admin. Es de un solo uso y expira a los pocos minutos. El cliente no recibe ningún aviso; queda registrado en el log interno de accesos.
          </div>
        </div>
      )}

      {cargando ? (
        <div className="card p-8 text-center text-sm text-muted">Cargando…</div>
      ) : visibles.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">No hay cuentas en este filtro.</div>
      ) : (
        <div className="space-y-3">
          {visibles.map(c => (
            <CuentaCard key={c.id} cuenta={c}
              onPagado={() => accion(marcarPagado, c)}
              onMora={() => accion(marcarMora, c.id)}
              onBaja={() => confirmar(`¿Dar de baja a ${c.club_nombre}? Perderá el acceso inmediatamente.`, () => accion(darDeBaja, c.id))}
              onReactivar={() => accion(reactivar, c.id)}
              onResetPassword={() => onResetPassword(c)}
              onEliminar={() => onEliminar(c)}
              onToggleFundador={() => accion(marcarFundador, c.id, !c.es_fundador)}
              onVerComo={() => onVerComo(c)}
              generandoAcceso={generandoAcceso === c.id}
            />
          ))}
        </div>
      )}
      {modalConfirm}
    </div>
  )
}

// ───────────────────────── TAB PAGOS ─────────────────────────

const PRECIO_STD = 25
const PRECIO_FUND = 20

function TabPagos() {
  const [avisos, setAvisos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(null)
  const [enviarEmail, setEnviarEmail] = useState({}) // { [avisoId]: boolean }
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busq, setBusq] = useState('')
  const [modalConfirm, confirmar] = useConfirm()

  async function recargar() {
    setCargando(true)
    try {
      const [a, c] = await Promise.all([listarAvisosPago(), listarCuentas()])
      setAvisos(a); setCuentas(c)
    }
    catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }
  useEffect(() => { recargar() }, [])

  // ─── Cálculos KPIs ───
  const stats = useMemo(() => {
    const now = new Date()
    const iniMes = new Date(now.getFullYear(), now.getMonth(), 1)
    const confirmadosMes = avisos.filter(a => a.estado === 'confirmado' && new Date(a.creado_en) >= iniMes)
    // Split por método (mes actual)
    const bizumMes = confirmadosMes.filter(a => a.metodo === 'bizum').length
    const transfMes = confirmadosMes.filter(a => a.metodo === 'transferencia').length
    // Ingresos: cuentas pagando (según es_fundador)
    const pagando = cuentas.filter(c => c.plan_estado === 'pagado')
    const mrr = pagando.reduce((s, c) => s + (c.es_fundador ? PRECIO_FUND : PRECIO_STD), 0)
    // Ingresos del mes: sumar por cuenta asociada al aviso confirmado
    const ingresosMes = confirmadosMes.reduce((s, a) => {
      const c = cuentas.find(x => x.id === a.user_id)
      return s + (c?.es_fundador ? PRECIO_FUND : PRECIO_STD)
    }, 0)
    return {
      ingresosMes,
      mrr,
      pagando: pagando.length,
      prueba: cuentas.filter(c => c.plan_estado === 'prueba').length,
      mora: cuentas.filter(c => c.plan_estado === 'mora').length,
      baja: cuentas.filter(c => c.plan_estado === 'baja').length,
      pendientes: avisos.filter(a => a.estado === 'pendiente').length,
      bizumMes, transfMes,
    }
  }, [avisos, cuentas])

  // ─── Tabla estado con último método usado por cuenta ───
  const cuentasVista = useMemo(() => {
    const ultimoMetodo = {}
    avisos.forEach(a => {
      if (a.estado === 'confirmado' && !ultimoMetodo[a.user_id]) ultimoMetodo[a.user_id] = a.metodo
    })
    const q = busq.trim().toLowerCase()
    return cuentas
      .filter(c => filtroEstado === 'todos' ? true : c.plan_estado === filtroEstado)
      .filter(c => !q || (c.club_nombre||'').toLowerCase().includes(q) || (c.entrenador||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q))
      .map(c => ({ ...c, _metodo: ultimoMetodo[c.id] || null }))
  }, [cuentas, avisos, filtroEstado, busq])

  async function accionConfirmar(aviso) {
    const conEmail = !!enviarEmail[aviso.id]
    confirmar(
      `¿Confirmar pago de ${aviso.profiles?.club_nombre || aviso.user_id} por ${aviso.metodo}? Se marcará la cuenta como pagada automáticamente${conEmail ? ' y se enviará email al cliente' : ''}.`,
      async () => {
        setProcesando(aviso.id)
        try { await confirmarAviso(aviso, { enviarEmail: conEmail }); recargar() }
        catch (e) { setError(e.message) }
        finally { setProcesando(null) }
      }
    )
  }

  const pendientes = avisos.filter(a => a.estado === 'pendiente')
  const confirmados = avisos.filter(a => a.estado === 'confirmado')

  const kpi = (label, val, color) => (
    <div className="card p-3" style={{ minWidth: 0 }}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="text-lg font-extrabold mt-1" style={{ color: color || '#fafafa', letterSpacing: '-0.5px' }}>{val}</div>
    </div>
  )

  return (
    <div className="space-y-4">
      {error && (
        <div className="card p-3 text-xs" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>⚠️ {error}</div>
      )}

      {/* ─── KPIs Resumen ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {kpi('Ingresos mes', `${stats.ingresosMes} €`, '#4ade80')}
        {kpi('MRR estimado', `${stats.mrr} €`, '#34d399')}
        {kpi('Pagando', stats.pagando, '#4ade80')}
        {kpi('En prueba', stats.prueba, '#60a5fa')}
        {kpi('En mora', stats.mora, '#f87171')}
        {kpi('Pendientes', stats.pendientes, '#fbbf24')}
      </div>
      <div className="card p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Métodos usados este mes</div>
        <div className="flex gap-3 flex-wrap text-xs">
          <span className="px-2 py-1 rounded-lg" style={{ background:'rgba(59,130,246,.12)', color:'#93c5fd' }}>📱 Bizum: <b>{stats.bizumMes}</b></span>
          <span className="px-2 py-1 rounded-lg" style={{ background:'rgba(139,92,246,.12)', color:'#c4b5fd' }}>🏦 Transferencia: <b>{stats.transfMes}</b></span>
          <span className="px-2 py-1 rounded-lg" style={{ background:'rgba(113,113,122,.15)', color:'#a1a1aa' }}>De baja: <b>{stats.baja}</b></span>
        </div>
      </div>

      <div className="card p-4" style={{ border: '1px solid rgba(245,158,11,.3)' }}>
        <div className="font-bold text-sm mb-3" style={{ color: '#fbbf24' }}>💳 Avisos pendientes de verificar ({pendientes.length})</div>
        {cargando ? (
          <div className="text-xs text-muted">Cargando…</div>
        ) : pendientes.length === 0 ? (
          <div className="text-xs text-muted">No hay avisos pendientes. Cuando un cliente pulse "Ya pagué" en el email, aparecerá aquí.</div>
        ) : (
          <div className="space-y-2">
            {pendientes.map(a => (
              <div key={a.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
                <div>
                  <div className="text-sm font-bold">{a.profiles?.club_nombre || '—'}</div>
                  <div className="text-xs text-muted">{a.profiles?.entrenador} · {a.profiles?.email}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,.12)', color: '#60a5fa' }}>
                      {a.metodo === 'transferencia' ? '🏦 Transferencia' : '📱 Bizum'}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(a.creado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,.12)', color: '#60a5fa' }}>
                      {a.profiles?.plan_estado}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!enviarEmail[a.id]}
                      onChange={(e) => setEnviarEmail(s => ({ ...s, [a.id]: e.target.checked }))}
                    />
                    Enviar email
                  </label>
                  <button
                    className="btn btn-primary text-xs"
                    disabled={procesando === a.id}
                    onClick={() => accionConfirmar(a)}>
                    {procesando === a.id ? '…' : '✅ Confirmar pago'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmados.length > 0 && (
        <div className="card p-4">
          <div className="font-bold text-sm mb-3 text-muted">Historial confirmados ({confirmados.length})</div>
          <div className="space-y-2">
            {confirmados.slice(0, 20).map(a => (
              <div key={a.id} className="flex items-center justify-between flex-wrap gap-2 p-2 rounded-lg" style={{ background: 'rgba(34,197,94,.05)' }}>
                <div className="text-xs">
                  <span className="font-bold">{a.profiles?.club_nombre || '—'}</span>
                  <span className="text-muted ml-2">{a.metodo === 'transferencia' ? '🏦 Transferencia' : '📱 Bizum'}</span>
                  <span className="text-muted ml-2">{new Date(a.creado_en).toLocaleDateString('es-ES')}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,.12)', color: '#4ade80' }}>Confirmado</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ─── Tabla estado de pagos ─── */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="font-bold text-sm">📊 Estado de pagos ({cuentasVista.length})</div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text" placeholder="Buscar club / entrenador…" value={busq}
              onChange={e => setBusq(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background:'#0f0f11', border:'1px solid #27272a', color:'#fafafa', minWidth: 180 }}
            />
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background:'#0f0f11', border:'1px solid #27272a', color:'#fafafa' }}>
              <option value="todos">Todos</option>
              <option value="pagado">Pagando</option>
              <option value="mora">En mora</option>
              <option value="prueba">En prueba</option>
              <option value="baja">De baja</option>
            </select>
          </div>
        </div>
        {cargando ? (
          <div className="text-xs text-muted">Cargando…</div>
        ) : cuentasVista.length === 0 ? (
          <div className="text-xs text-muted text-center py-4">Sin resultados</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color:'#71717a', textAlign:'left' }}>
                  <th className="py-2 pr-3" style={{ fontWeight: 600 }}>Club</th>
                  <th className="py-2 pr-3" style={{ fontWeight: 600 }}>Estado</th>
                  <th className="py-2 pr-3" style={{ fontWeight: 600 }}>Último pago</th>
                  <th className="py-2 pr-3" style={{ fontWeight: 600 }}>Próx. venc.</th>
                  <th className="py-2 pr-3" style={{ fontWeight: 600 }}>Método</th>
                  <th className="py-2 pr-3" style={{ fontWeight: 600 }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {cuentasVista.map(c => {
                  const est = ESTADOS_PLAN[c.plan_estado] || ESTADOS_PLAN.prueba
                  const precio = c.es_fundador ? PRECIO_FUND : PRECIO_STD
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid #27272a' }}>
                      <td className="py-2 pr-3">
                        <div className="font-bold">{c.club_nombre || '—'} {c.es_fundador && <span style={{ color:'#f5a623' }}>🔥</span>}</div>
                        <div className="text-muted text-[10px]">{c.entrenador}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.fg }}>
                          {est.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-muted">
                        {c.ultimo_pago_en ? new Date(c.ultimo_pago_en).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="py-2 pr-3 text-muted">
                        {c.pago_vence ? new Date(c.pago_vence).toLocaleDateString('es-ES')
                          : c.prueba_vence ? `Prueba: ${new Date(c.prueba_vence).toLocaleDateString('es-ES')}` : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {c._metodo === 'bizum' ? '📱 Bizum' : c._metodo === 'transferencia' ? '🏦 Transferencia' : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 pr-3 font-bold">{precio} €</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalConfirm}
    </div>
  )
}

function CuentaCard({ cuenta, onPagado, onMora, onBaja, onReactivar, onResetPassword, onEliminar, onToggleFundador, onVerComo, generandoAcceso }) {
  const est = ESTADOS_PLAN[cuenta.plan_estado] || ESTADOS_PLAN.prueba
  const diasPrueba = cuenta.plan_estado === 'prueba' ? diasRestantes(cuenta.prueba_vence) : null
  const diasPago = (cuenta.plan_estado === 'pagado' || cuenta.plan_estado === 'mora') ? diasRestantes(cuenta.pago_vence) : null
  const nuevoVence = proximoVencimiento(cuenta)

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{cuenta.club_nombre}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.fg }}>{est.label}</span>
            <TipoCliente cuenta={cuenta} />
            {cuenta.es_fundador && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,.15)', color: '#f5a623' }}>🔥 Fundador</span>}
            {!cuenta.activo && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,.12)', color: '#f87171' }}>Suspendido</span>}
          </div>
          <div className="text-xs text-muted mt-1">{cuenta.entrenador} · {cuenta.email}</div>
          <div className="text-[10px] text-muted mt-1">
            {diasPrueba !== null && (diasPrueba >= 0 ? `Prueba vence en ${diasPrueba} día(s)` : `Prueba vencida hace ${-diasPrueba} día(s)`)}
            {diasPago !== null && (diasPago >= 0 ? `Pago vence en ${diasPago} día(s)` : `Pago vencido hace ${-diasPago} día(s)`)}
            {cuenta.ultimo_pago_en && ` · Último pago: ${new Date(cuenta.ultimo_pago_en).toLocaleDateString('es-ES')}`}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[10px] text-muted">Próximo vencimiento si pagas hoy: {nuevoVence.toLocaleDateString('es-ES')}</span>
          <button className="btn btn-primary text-xs" onClick={onPagado}>💳 Marcar pagado</button>
          <button className="btn btn-outline text-xs" style={{ color: '#fbbf24', borderColor: 'rgba(245,158,11,.3)' }} onClick={onMora}>⚠️ Mora</button>
          <button className="btn btn-outline text-xs" onClick={onResetPassword}>🔑 Nueva contraseña</button>
          <button className="btn btn-outline text-xs" style={{ color: '#60a5fa', borderColor: 'rgba(59,130,246,.3)' }} onClick={onVerComo} disabled={generandoAcceso}>
            {generandoAcceso ? 'Generando…' : '👁️ Ver como cliente'}
          </button>
          <button className="btn btn-outline text-xs" style={cuenta.es_fundador ? { color: '#f5a623', borderColor: 'rgba(245,166,35,.4)' } : {}} onClick={onToggleFundador}>
            {cuenta.es_fundador ? '🔥 Quitar fundador' : '🔥 Marcar fundador'}
          </button>
          {cuenta.activo ? (
            <button className="btn btn-outline text-xs" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,.3)' }} onClick={onBaja}>🚫 Dar de baja</button>
          ) : (
            <button className="btn btn-outline text-xs" style={{ color: '#4ade80', borderColor: 'rgba(34,197,94,.3)' }} onClick={onReactivar}>✅ Reactivar</button>
          )}
          <button className="btn text-xs" style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid rgba(239,68,68,.4)' }} onClick={onEliminar}>🗑️ Eliminar cuenta</button>
        </div>
      </div>
    </div>
  )
}
