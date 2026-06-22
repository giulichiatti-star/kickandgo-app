import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { supabase, supabaseReady } from './lib/supabase'
import Logo from './components/Logo'
import Login from './pages/Login'
import Privacidad from './pages/Privacidad'
import Inicio from './pages/Inicio'
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
}

const NAV_PRINCIPAL = [
  { to: '/inicio',        label: 'Inicio',            svg: IC.inicio },
  { to: '/plantilla',     label: 'Equipo',            svg: IC.equipo },
  { to: '/convocatoria',  label: 'Convocatoria',      svg: IC.convocatoria },
  { to: '/entrenamientos',label: 'Entrenamientos',    svg: IC.entrenos },
  { to: '/estadisticas',  label: 'Estadísticas',      svg: IC.stats },
  { to: '/rivales',       label: 'Rivales',           svg: IC.rivales },
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

function Shell({ children, onLogout }) {
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
      {/* Sidebar */}
      <aside className={`kg-sidebar ${open ? 'open' : ''}`}>
        <div className="kg-sidebar-head"><Logo /></div>
        <nav className="kg-nav">
          {NAV_PRINCIPAL.map((n) => <Item key={n.to} to={n.to} label={n.label} svg={n.svg} />)}
          <div className="kg-nav-label">Más</div>
          {NAV_MAS.map((n) => <Item key={n.to} to={n.to} label={n.label} svg={n.svg} />)}
        </nav>
        <button onClick={onLogout}
          className="kg-nav-item border-t border-borde !py-3 text-rojo hover:text-rojo">
          <span className="kg-nav-ico">↩</span>Cerrar sesión
        </button>
      </aside>

      {open && <div className="kg-backdrop lg:hidden" onClick={() => setOpen(false)} />}

      {/* Topbar móvil */}
      <header className="lg:hidden sticky top-0 z-40 bg-negro/90 backdrop-blur border-b border-borde">
        <div className="px-4 h-14 flex items-center justify-between">
          <button className="text-2xl leading-none" onClick={() => setOpen(true)}>☰</button>
          <Logo />
          <span className="w-6" />
        </div>
      </header>

      <main className="lg:ml-[224px] px-4 lg:px-6 py-5 max-w-[1280px] mx-auto">{children}</main>
    </div>
  )
}

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [activo, setActivo] = useState(null) // null = sin saber aún
  const [listo, setListo] = useState(false)

  useEffect(() => {
    if (!supabaseReady) { setListo(true); return }
    supabase.auth.getSession().then(({ data }) => { setSesion(data.session); setListo(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Al haber sesión, comprobar si la cuenta está activa (suscripción)
  useEffect(() => {
    if (!sesion) { setActivo(null); return }
    let cancelado = false
    supabase.from('profiles').select('activo').eq('id', sesion.user.id).single()
      .then(({ data }) => { if (!cancelado) setActivo(Boolean(data?.activo)) })
    return () => { cancelado = true }
  }, [sesion])

  const logout = () => supabase.auth.signOut()

  if (!supabaseReady) return <FaltanClaves />
  if (!listo) return <div className="min-h-screen grid place-items-center text-muted">Cargando…</div>
  // Página pública — accesible sin login
  if (window.location.pathname === '/privacidad') return <Privacidad />
  if (!sesion) return <Login />
  if (activo === null) return <div className="min-h-screen grid place-items-center text-muted">Comprobando acceso…</div>
  if (!activo) return <Pendiente onLogout={logout} />

  return (
    <Shell onLogout={logout}>
      <Routes>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/plantilla" element={<Plantilla />} />
        <Route path="/convocatoria" element={<Convocatoria />} />
        <Route path="/envivo" element={<EnVivo />} />
        <Route path="/informes" element={<Informes />} />
        <Route path="/entrenamientos" element={<Entrenamientos />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/rivales" element={<Rivales />} />
        <Route path="/pizarra" element={<Pizarra />} />
        <Route path="/amonestaciones" element={<Amonestaciones />} />
        <Route path="/predicciones" element={<Predicciones />} />
        <Route path="/clima" element={<Clima />} />
        <Route path="/asistente" element={<Asistente />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </Shell>
  )
}
