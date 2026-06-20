import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { supabase, supabaseReady } from './lib/supabase'
import Logo from './components/Logo'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Plantilla from './pages/Plantilla'
import Convocatoria from './pages/Convocatoria'
import EnVivo from './pages/EnVivo'
import Informes from './pages/Informes'
import Ajustes from './pages/Ajustes'

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

const NAV = [
  { to: '/inicio', label: 'Inicio', icon: '🏠' },
  { to: '/plantilla', label: 'Plantilla', icon: '👥' },
  { to: '/convocatoria', label: 'Convoc.', icon: '📋' },
  { to: '/envivo', label: 'En Vivo', icon: '🔴' },
  { to: '/informes', label: 'Informes', icon: '📊' },
]

function Shell({ children, onLogout }) {
  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 bg-negro/90 backdrop-blur border-b border-borde">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <NavLink to="/ajustes" className="text-lg" title="Club y ajustes">⚙️</NavLink>
            <button className="text-xs text-muted hover:text-blanco" onClick={onLogout}>Salir</button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-5">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-borde">
        <div className="max-w-3xl mx-auto flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isActive ? 'text-cyan' : 'text-muted'
                }`}>
              <span className="text-xl leading-none">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
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
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </Shell>
  )
}
