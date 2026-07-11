import { useEffect, useState, useRef } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase, supabaseReady } from './lib/supabase'
import { EquipoProvider, useEquipo } from './contexts/EquipoContext'
import Logo from './components/Logo'
import Login from './pages/Login'
import Privacidad from './pages/Privacidad'
import Inicio from './pages/Inicio'
import Calendario from './pages/Calendario'
import Plantilla from './pages/Plantilla'
import Convocatoria from './pages/Convocatoria'
import EnVivo from './pages/EnVivo'
import Informes from './pages/Informes'
import Ajustes from './pages/Ajustes'
import Entrenamientos from './pages/Entrenamientos'
import Estadisticas from './pages/Estadisticas'
import Pizarra from './pages/Pizarra'
import Amonestaciones from './pages/Amonestaciones'
import Predicciones from './pages/Predicciones'
import Clima from './pages/Clima'
import Asistente from './pages/Asistente'
import Rivales from './pages/Rivales'
import PlanTemporada from './pages/PlanTemporada'
import Terminos from './pages/Terminos'
import Landing from './pages/Landing'
import AdminLeads from './pages/AdminLeads'
import OnboardingWizard, { useWizard } from './components/OnboardingWizard'

import { createContext, useContext } from 'react'
export const WizardContext = createContext(null)
export function useWizardContext() { return useContext(WizardContext) }

function WizardRoot({ children }) {
  const wizard = useWizard()
  return (
    <WizardContext.Provider value={wizard}>
      {children}
      <OnboardingWizard open={wizard.open} onCerrar={wizard.cerrar} />
    </WizardContext.Provider>
  )
}

function Centro({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 text-center">
      <div className="card p-6 max-w-md">
        <div className="flex justify-center mb-4"><Logo size={34} /></div>
        {children}
      </div>
    </div>
  )
}

function FaltanClaves() {
  return (
    <Centro>
      <h1 className="font-extrabold mb-2">Falta conectar Supabase</h1>
      <p className="text-sm text-muted">
        Rellena <code className="text-cyan">.env</code> con tu URL y clave, y reinicia <code>npm run dev</code>.
      </p>
    </Centro>
  )
}

function Pendiente({ onLogout }) {
  return (
    <Centro>
      <div className="text-4xl mb-3">⏳</div>
      <h1 className="font-extrabold mb-2">Suscripción pendiente</h1>
      <p className="text-sm text-muted mb-4">
        Tu cuenta existe pero aún no está activada. En cuanto confirmemos tu suscripción
        tendrás acceso completo.
      </p>
      <button className="btn btn-outline" onClick={onLogout}>Cerrar sesión</button>
    </Centro>
  )
}

/* SVG icons — mismos que el demo */
const IC = {
  inicio:      <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><polyline points="9,21 9,12 15,12 15,21"/></svg>,
  equipo:      <svg viewBox="0 0 24 24"><path d="M12 2l7 2.5V11c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V4.5z"/></svg>,
  convocatoria:<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>,
  entrenos:    <svg viewBox="0 0 24 24"><polyline points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>,
  stats:       <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  rivales:     <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0112 0v2"/><circle cx="17" cy="7" r="3"/><path d="M21 20v-2a4 4 0 00-3-3.87"/></svg>,
  informes:    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>,
  ajustes:     <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><rect x="9" y="14" width="6" height="7" rx="0.5"/></svg>,
  envivo:      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>,
  pizarra:     <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  disciplina:  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  predicciones:<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>,
  clima:       <svg viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 110-14 7 7 0 016.71 5H17.5a3.5 3.5 0 010 7z"/></svg>,
  asistente:   <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  temporada:   <svg viewBox="0 0 24 24"><path d="M12 2l3 6.5L22 9.3l-5 4.8 1.2 6.9L12 17.7l-6.2 3.3L7 14.1 2 9.3l7-0.8z"/></svg>,
  calendario:  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
}

const NAV_PRINCIPAL = [
  { to: '/inicio',        label: 'Inicio',            svg: IC.inicio },
  { to: '/calendario',    label: 'Calendario',        svg: IC.calendario },
  { to: '/plantilla',     label: 'Equipo',            svg: IC.equipo },
  { to: '/convocatoria',  label: 'Convocatoria',      svg: IC.convocatoria },
  { to: '/entrenamientos',label: 'Entrenamientos',    svg: IC.entrenos },
  { to: '/estadisticas',  label: 'Estadísticas',      svg: IC.stats },
  { to: '/rivales',       label: 'Rivales',           svg: IC.rivales },
  { to: '/temporada',     label: 'Plan Temporada',    svg: IC.temporada },
  { to: '/informes',      label: 'Informes',          svg: IC.informes },
  { to: '/ajustes',       label: 'Club y ajustes',    svg: IC.ajustes },
]
const NAV_MAS = [
  { to: '/envivo',         label: 'En Vivo',           svg: IC.envivo },
  { to: '/pizarra',        label: 'Pizarra táctica',   svg: IC.pizarra },
  { to: '/amonestaciones', label: 'Disciplina',        svg: IC.disciplina },
  { to: '/predicciones',   label: 'Predicciones',      svg: IC.predicciones },
  { to: '/clima',          label: 'Clima',             svg: IC.clima },
  { to: '/asistente',      label: 'Asistente IA',      svg: IC.asistente },
]
const IC_ADMIN = <svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg>

// Evento global para que los lib files avisen cuando usan caché
export function notificarModoCache() {
  window.dispatchEvent(new CustomEvent('kg:cache-hit'))
}

function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  const [mostrarOk, setMostrarOk] = useState(false)
  const [modoCache, setModoCache] = useState(false)

  useEffect(() => {
    const off = () => { setOnline(false); setModoCache(false) }
    const on  = () => { setOnline(true); setModoCache(false); setMostrarOk(true); setTimeout(() => setMostrarOk(false), 3000) }
    const cache = () => setModoCache(true)
    window.addEventListener('offline', off)
    window.addEventListener('online',  on)
    window.addEventListener('kg:cache-hit', cache)
    return () => {
      window.removeEventListener('offline', off)
      window.removeEventListener('online',  on)
      window.removeEventListener('kg:cache-hit', cache)
    }
  }, [])

  if (online && !mostrarOk && !modoCache) return null

  const cfg = !online
    ? { bg: 'rgba(239,68,68,0.95)', border: 'rgba(252,165,165,0.4)', msg: '⚠️ Sin conexión — los cambios no se guardarán hasta recuperar internet' }
    : modoCache
    ? { bg: 'rgba(245,158,11,0.95)', border: 'rgba(252,211,77,0.4)', msg: '🕐 Modo offline — mostrando datos de la última sesión' }
    : { bg: 'rgba(16,185,129,0.95)', border: 'rgba(52,211,153,0.4)', msg: '✓ Conexión restaurada — los datos se están sincronizando' }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-center gap-2 py-2 text-[12px] font-bold"
      style={{ background: cfg.bg, color: '#fff', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${cfg.border}`, transition: 'background .3s', paddingTop: 'max(8px, env(safe-area-inset-top))' }}
    >
      {cfg.msg}
      {modoCache && (
        <button onClick={() => setModoCache(false)} className="ml-2 opacity-70 hover:opacity-100 text-[11px]">✕</button>
      )}
    </div>
  )
}

function TeamSwitcher() {
  const { equipos, equipoActivo, setEquipoActivo, crearEquipo } = useEquipo()
  const [open, setOpen] = useState(false)
  const [creando, setCreando] = useState(false)
  const [form, setForm] = useState({ nombre: '', tipo_equipo: '11' })

  async function handleCrear(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    try {
      await crearEquipo({ nombre: form.nombre.trim(), tipo_equipo: form.tipo_equipo })
      setCreando(false)
      setForm({ nombre: '', tipo_equipo: '11' })
      setOpen(false)
    } catch (err) { console.error('[crearEquipo]', err) }
  }

  return (
    <div style={{ borderBottom: '1px solid #27272a' }}>
      {/* Equipo activo — siempre visible */}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(45,212,191,0.06)',
        border: 'none', borderRadius: 0, padding: '10px 12px', cursor: 'pointer', transition: 'all .15s',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#253045', border: '1px solid #27272a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, overflow: 'hidden' }}>
          {equipoActivo?.escudo_url ? <img src={equipoActivo.escudo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛡️'}
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {equipoActivo?.nombre || 'Sin equipo'}
          </div>
          <div style={{ fontSize: 10, color: '#2dd4bf', fontWeight: 600 }}>Fútbol {equipoActivo?.tipo_equipo || '11'}</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Acordeón inline — sin z-index, no tapa el nav */}
      {open && (
        <div style={{ background: '#0f0f11', borderTop: '1px solid #27272a' }}>
          {equipos.map((eq) => (
            <button key={eq.id} onClick={() => { setEquipoActivo(eq); setOpen(false) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
              background: eq.id === equipoActivo?.id ? 'rgba(45,212,191,0.08)' : 'transparent',
              border: 'none', borderBottom: '1px solid #1a1a1d', cursor: 'pointer',
            }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: '#253045', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, overflow: 'hidden' }}>
                {eq.escudo_url ? <img src={eq.escudo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛡️'}
              </div>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: eq.id === equipoActivo?.id ? '#2dd4bf' : '#d4d4d8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.nombre}</div>
              </div>
              {eq.id === equipoActivo?.id && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}
          {!creando ? (
            <button onClick={() => setCreando(true)} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Nuevo equipo
            </button>
          ) : (
            <form onSubmit={handleCrear} style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <input
                autoFocus placeholder="Nombre del equipo"
                value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '6px 9px', color: '#fafafa', fontSize: 12, outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                {['11', '7'].map((t) => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, tipo_equipo: t })} style={{
                    flex: 1, padding: '5px', borderRadius: 7, border: '1px solid', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    borderColor: form.tipo_equipo === t ? '#2dd4bf' : '#27272a',
                    background: form.tipo_equipo === t ? 'rgba(45,212,191,0.12)' : 'transparent',
                    color: form.tipo_equipo === t ? '#2dd4bf' : '#71717a',
                  }}>F{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setCreando(false)} style={{ flex: 1, padding: '6px', borderRadius: 7, border: '1px solid #27272a', background: 'transparent', color: '#71717a', fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '6px', borderRadius: 7, border: 'none', background: '#2dd4bf', color: '#0f0f11', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Crear</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function Shell({ children, onLogout, esAdmin }) {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ir = (to) => { setOpen(false); nav(to) }

  const Item = ({ to, label, svg }) => (
    <NavLink to={to} onClick={() => setOpen(false)}
      className={({ isActive }) => `kg-nav-item ${isActive ? 'active' : ''}`}>
      <span className="kg-nav-ico">{svg}</span>{label}
    </NavLink>
  )

  return (
    <div className="min-h-screen">
      <OfflineBanner />
      {/* Sidebar */}
      <aside className={`kg-sidebar ${open ? 'open' : ''}`}>
        <div className="kg-sidebar-head"><Logo /></div>
        <TeamSwitcher />
        <nav className="kg-nav">
          {NAV_PRINCIPAL.map((n) => <Item key={n.to} to={n.to} label={n.label} svg={n.svg} />)}
          <div className="kg-nav-label">Más</div>
          {NAV_MAS.map((n) => <Item key={n.to} to={n.to} label={n.label} svg={n.svg} />)}
          {esAdmin && <Item to="/admin" label="Admin" svg={IC_ADMIN} />}
        </nav>
        <button onClick={onLogout}
          className="kg-nav-item border-t border-borde !py-3 text-rojo hover:text-rojo">
          <span className="kg-nav-ico">↩</span>Cerrar sesión
        </button>
      </aside>

      {open && <div className="kg-backdrop lg:hidden" onClick={() => setOpen(false)} />}

      {/* Topbar móvil */}
      <header className="lg:hidden sticky top-0 z-40 bg-negro/90 backdrop-blur border-b border-borde" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <button className="text-2xl leading-none" onClick={() => setOpen(true)}>☰</button>
          <Logo />
          <span className="w-6" />
        </div>
      </header>

      <main className="lg:ml-[224px] px-4 lg:px-6 py-5 max-w-[1280px] mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>{children}</main>

      {/* WhatsApp FAB — soporte */}
      <a
        href="https://wa.me/34628584985?text=Hola,%20soy%20cliente%20de%20Kick%20and%20Go%20y%20necesito%20ayuda"
        target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp"
        style={{
          position: 'fixed', right: 20, bottom: `calc(20px + env(safe-area-inset-bottom))`,
          width: 56, height: 56, borderRadius: '50%', background: '#25D366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,.4)', zIndex: 40, textDecoration: 'none',
        }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      <footer className="lg:ml-[224px] px-4 lg:px-6 py-3 border-t border-borde flex gap-4 text-[11px] text-muted">
        <a href="/privacidad" className="hover:text-blanco2 transition-colors">Política de privacidad</a>
        <a href="/terminos" className="hover:text-blanco2 transition-colors">Términos y condiciones</a>
      </footer>
    </div>
  )
}

export default function App() {
  const { pathname, search } = useLocation()
  const [sesion, setSesion] = useState(null)
  const [activo, setActivo] = useState(null) // null = sin saber aún
  const [esAdmin, setEsAdmin] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    if (!supabaseReady) { setListo(true); return }
    supabase.auth.getSession().then(({ data }) => { setSesion(data.session); setListo(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Al haber sesión, comprobar si la cuenta está activa (suscripción) y si es admin
  useEffect(() => {
    if (!sesion) { setActivo(null); setEsAdmin(false); return }
    let cancelado = false
    supabase.from('profiles').select('activo, is_admin').eq('id', sesion.user.id).single()
      .then(({ data }) => {
        if (cancelado) return
        setActivo(Boolean(data?.activo))
        setEsAdmin(Boolean(data?.is_admin))
      })
    return () => { cancelado = true }
  }, [sesion])

  const logout = () => supabase.auth.signOut()

  if (!supabaseReady) return <FaltanClaves />
  if (!listo) return <div className="min-h-screen grid place-items-center text-muted">Cargando…</div>
  // Páginas públicas — accesibles sin login
  if (pathname === '/privacidad') return <Privacidad />
  if (pathname === '/terminos') return <Terminos />

  const params = new URLSearchParams(search)
  const queryLogin = params.get('login') === '1'
  const esPWA = params.get('pwa') === '1' || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

  // Ruta /login siempre muestra el login (o redirige si ya hay sesión)
  if (pathname === '/login') return sesion ? <Navigate to="/inicio" replace /> : <Login />

  // Sin sesión en raíz: mostrar Landing solo si no es PWA
  if (pathname === '/' && !sesion && !queryLogin && !esPWA) return <Landing />
  if (!sesion) return <Login />
  if (activo === null) return <div className="min-h-screen grid place-items-center text-muted">Comprobando acceso…</div>
  if (!activo) return <Pendiente onLogout={logout} />

  return (
    <EquipoProvider>
    <WizardRoot>
    <Shell onLogout={logout} esAdmin={esAdmin}>
      <Routes>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/plantilla" element={<Plantilla />} />
        <Route path="/convocatoria" element={<Convocatoria />} />
        <Route path="/envivo" element={<EnVivo />} />
        <Route path="/informes" element={<Informes />} />
        <Route path="/entrenamientos" element={<Entrenamientos />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/rivales" element={<Rivales />} />
        <Route path="/temporada" element={<PlanTemporada />} />
        <Route path="/pizarra" element={<Pizarra />} />
        <Route path="/amonestaciones" element={<Amonestaciones />} />
        <Route path="/predicciones" element={<Predicciones />} />
        <Route path="/clima" element={<Clima />} />
        <Route path="/asistente" element={<Asistente />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="/admin" element={esAdmin ? <AdminLeads /> : <Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </Shell>
    </WizardRoot>
    </EquipoProvider>
  )
}
