import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [acepto, setAcepto] = useState(false)
  const [msg, setMsg] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    if (!acepto) { setMsg('⚠️ Debes aceptar la política de privacidad para continuar.'); return }
    setMsg(''); setCargando(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) throw error
    } catch (err) {
      setMsg('⚠️ ' + (err.message || 'No se pudo iniciar sesión'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6"><Logo size={36} /></div>
        <div className="card p-6">
          <h1 className="text-lg font-extrabold mb-1">Iniciar sesión</h1>
          <p className="text-xs text-muted mb-5">Acceso solo para entrenadores con suscripción activa.</p>
          <form onSubmit={entrar} className="space-y-3">
            <div>
              <label className="text-xs text-muted">Email</label>
              <input className="field mt-1" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div>
              <label className="text-xs text-muted">Contraseña</label>
              <input className="field mt-1" type="password" required value={pass}
                onChange={(e) => setPass(e.target.value)} placeholder="••••••" />
            </div>
            {/* Consentimiento GDPR */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)}
                className="mt-0.5 flex-shrink-0 accent-cyan-400 w-4 h-4" />
              <span className="text-[11px] text-muted leading-relaxed">
                He leído y acepto la{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer"
                  className="text-cyan underline hover:text-white">política de privacidad</a>
                {' '}y el tratamiento de mis datos según el RGPD.
              </span>
            </label>
            <button className="btn btn-primary w-full" disabled={cargando || !acepto}>
              {cargando ? '...' : 'Entrar'}
            </button>
          </form>
          {msg && <div className="mt-3 text-xs text-zinc-300">{msg}</div>}
          <p className="mt-4 text-[11px] text-muted text-center">
            ¿Quieres una cuenta? Escríbenos para darte de alta tras activar tu suscripción.
          </p>
        </div>
      </div>
    </div>
  )
}
