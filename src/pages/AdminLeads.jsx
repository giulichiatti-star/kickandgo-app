import { useEffect, useMemo, useState } from 'react'
import { listarLeads, actualizarLead, activarLeads, contactarLeads, linkWhatsapp } from '../lib/leads'
import { listarCuentas, marcarPagado, marcarMora, darDeBaja, reactivar, resetearPassword, proximoVencimiento } from '../lib/cuentas'

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
  const [tab, setTab] = useState('leads')
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">🔐 Panel Admin</h1>
        <p className="text-xs text-muted">Leads, contacto, alta y ciclo de vida de cuentas</p>
      </div>
      <div className="flex gap-2">
        <button className={`btn text-xs ${tab === 'leads' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('leads')}>Leads</button>
        <button className={`btn text-xs ${tab === 'cuentas' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('cuentas')}>Cuentas</button>
      </div>
      {tab === 'leads' ? <TabLeads /> : <TabCuentas />}
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
                {lead.respondio === 'si' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,.12)', color: '#4ade80' }}>Respondió: Sí</span>}
                {lead.respondio === 'no' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,.12)', color: '#f87171' }}>Respondió: No</span>}
              </div>
              <div className="text-xs text-muted mt-1">
                {lead.email} {lead.telefono && `· ${lead.telefono}`} {lead.equipo_nombre && `· ${lead.equipo_nombre}`}
              </div>
              <div className="text-[10px] text-muted mt-1">
                Alta: {new Date(lead.creado).toLocaleDateString('es-ES')}
                {lead.contactado_en && ` · Contactado: ${new Date(lead.contactado_en).toLocaleDateString('es-ES')}`}
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
  const [modalConfirm, confirmar] = useConfirm()

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

  async function accion(fn, ...args) {
    try { await fn(...args); recargar() }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-3">
      {(alertas.porVencer.length > 0 || alertas.enGracia.length > 0) && (
        <div className="card p-4" style={{ border: '1px solid rgba(245,158,11,.3)' }}>
          <div className="font-bold text-sm mb-3" style={{ color: '#fbbf24' }}>⚠️ Alertas de cobro</div>
          <div className="space-y-2">
            {alertas.enGracia.map(({ cuenta: c, dias }) => (
              <div key={c.id} className="flex items-center justify-between flex-wrap gap-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,.08)' }}>
                <div className="text-xs">
                  <b>{c.club_nombre}</b> — vencido hace {dias} día(s) {dias >= DIAS_GRACIA ? '(se suspenderá hoy si no se registra el pago)' : `(se suspende en ${DIAS_GRACIA - dias} día(s))`}
                </div>
                <button className="btn btn-primary text-xs" onClick={() => accion(marcarPagado, c)}>💳 Pagado</button>
              </div>
            ))}
            {alertas.porVencer.map(({ cuenta: c, dias }) => (
              <div key={c.id} className="flex items-center justify-between flex-wrap gap-2 p-2 rounded-lg" style={{ background: 'rgba(245,158,11,.08)' }}>
                <div className="text-xs">
                  <b>{c.club_nombre}</b> — {dias === 0 ? 'vence hoy' : `vence en ${dias} día(s)`} ({c.plan_estado === 'prueba' ? 'fin de prueba' : 'próximo pago'})
                </div>
                <button className="btn btn-primary text-xs" onClick={() => accion(marcarPagado, c)}>💳 Pagado</button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            />
          ))}
        </div>
      )}
      {modalConfirm}
    </div>
  )
}

function CuentaCard({ cuenta, onPagado, onMora, onBaja, onReactivar, onResetPassword }) {
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
          {cuenta.activo ? (
            <button className="btn btn-outline text-xs" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,.3)' }} onClick={onBaja}>🚫 Dar de baja</button>
          ) : (
            <button className="btn btn-outline text-xs" style={{ color: '#4ade80', borderColor: 'rgba(34,197,94,.3)' }} onClick={onReactivar}>✅ Reactivar</button>
          )}
        </div>
      </div>
    </div>
  )
}
