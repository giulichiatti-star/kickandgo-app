import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../landing.css'
import { supabase } from '../lib/supabase'
import PartnersStrip from '../components/PartnersStrip'

const ICONS = {
  plantilla: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ia: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 7.5 4 8.3l4 3.9-.9 5.5L12 15l4.9 2.7-.9-5.5 4-3.9-5.5-.8z"/><path d="M12 15v7"/><path d="M8 20h8"/></svg>,
  analisis: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  pizarra: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  envivo: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  temporada: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
}

const FEATURES = [
  { ic: ICONS.plantilla, bg: 'rgba(45,212,191,.1)', title: 'Gestión de plantilla', text: 'Perfil completo de cada jugador: físico, posición, rendimiento, historial de lesiones y disponibilidad de un vistazo.' },
  { ic: ICONS.ia, bg: 'rgba(139,92,246,.1)', title: 'IA Coach', text: 'Tu asistente táctico personal. Analiza el partido en tiempo real y te sugiere cambios, estrategias y alineaciones.' },
  { ic: ICONS.analisis, bg: 'rgba(245,166,35,.1)', title: 'Análisis de partidos', text: 'Estadísticas detalladas de cada encuentro. Entiende qué funcionó, qué falló y cómo mejorar para el siguiente.' },
  { ic: ICONS.pizarra, bg: 'rgba(59,130,246,.1)', title: 'Pizarra táctica', text: 'Diseña jugadas, ensaya formaciones y comparte tus sistemas con el equipo directamente desde la app.' },
  { ic: ICONS.envivo, bg: 'rgba(239,68,68,.1)', title: 'En Vivo', text: 'Sigue el partido en directo. Registra goles, tarjetas, sustituciones y eventos clave mientras juegas.' },
  { ic: ICONS.temporada, bg: 'rgba(16,185,129,.1)', title: 'Plan de temporada', text: 'Organiza toda la temporada: calendario de partidos, sesiones de entrenamiento, objetivos y convocatorias.' },
]

const TICKER_ITEMS = [
  'Gestión de plantilla', 'IA Coach en tiempo real', 'Análisis de partidos', 'Pizarra táctica',
  'Control de lesiones', 'Plan de temporada', 'En vivo desde el campo', 'Comandos de voz', 'Convocatorias por WhatsApp',
]

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.map((t, i) => (
          <div key={i} className="ticker-item"><span>●</span> {t}</div>
        ))}
      </div>
    </div>
  )
}

function LeadForm({ onClose }) {
  const [form, setForm] = useState({ nombre: '', email: '', emailConfirm: '', telefono: '', equipo_nombre: '' })
  const [estado, setEstado] = useState('idle') // idle | enviando | ok | error
  const [error, setError] = useState('')

  async function enviar(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim()) { setError('Nombre y email son obligatorios'); return }
    if (!form.telefono.trim()) { setError('El teléfono es obligatorio'); return }
    if (form.email.trim() !== form.emailConfirm.trim()) { setError('Los emails no coinciden, revísalos'); return }
    setEstado('enviando'); setError('')
    try {
      const { error } = await supabase.functions.invoke('nuevo-lead', {
        body: { nombre: form.nombre, email: form.email, telefono: form.telefono, equipo_nombre: form.equipo_nombre }
      })
      if (error) throw error
      setEstado('ok')
    } catch (err) {
      setError(err.message || 'No se pudo enviar, inténtalo de nuevo')
      setEstado('error')
    }
  }

  if (estado === 'ok') {
    return (
      <div className="lead-success">
        <div className="modal-emoji">🎉</div>
        <div className="modal-title">¡Listo!</div>
        <p className="modal-sub" style={{ textAlign: 'center' }}>
          Te hemos enviado tus accesos a <strong>{form.email}</strong>.
          Revisa tu bandeja de entrada y empieza tu prueba gratuita de 15 días.
        </p>
        <button className="btn-pricing" onClick={onClose}>Cerrar</button>
      </div>
    )
  }

  return (
    <>
      <div className="modal-emoji">⚽</div>
      <div className="modal-title">¡Empieza tu prueba!</div>
      <p className="modal-sub">
        Déjanos tus datos y te activamos el acceso en minutos.<br />
        <strong>15 días gratis, sin tarjeta de crédito.</strong>
      </p>
      <form className="lead-form" onSubmit={enviar}>
        <input placeholder="Tu nombre" value={form.nombre}
          onChange={e => setForm({ ...form, nombre: e.target.value })} required />
        <input type="email" placeholder="Tu email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input type="email" placeholder="Confirma tu email" value={form.emailConfirm}
          onChange={e => setForm({ ...form, emailConfirm: e.target.value })} required />
        <input type="tel" placeholder="Teléfono" value={form.telefono}
          onChange={e => setForm({ ...form, telefono: e.target.value })} required />
        <input placeholder="Nombre de tu equipo (opcional)" value={form.equipo_nombre}
          onChange={e => setForm({ ...form, equipo_nombre: e.target.value })} />
        {error && <div className="lead-error">⚠️ {error}</div>}
        <button className="btn-lead-submit" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando…' : 'Quiero mi prueba gratis →'}
        </button>
      </form>
      <div className="modal-note">Te respondemos en menos de 24h · Soporte en español</div>
    </>
  )
}

const PLANES = {
  fundador: { mensual: '19,99', anual: '199' },
  estandar: { mensual: '24,99', anual: '249' },
}

export default function Landing() {
  const [modalOpen, setModalOpen] = useState(false)
  const [ciclo, setCiclo] = useState('mensual')
  const navigate = useNavigate()

  return (
    <div className="kg-landing">
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="5" height="24" rx="1.5" fill="#2dd4bf" />
              <path d="M11 16 L24 4 L31 4 L17 16 Z" fill="#2dd4bf" />
              <path d="M11 16 L17 16 L31 28 L24 28 Z" fill="#f59e0b" />
            </svg>
          </div>
          <span className="nav-wordmark">KICK<em>AND</em>GO</span>
        </div>
        <ul className="nav-links">
          <li><a href="#funciones">Funciones</a></li>
          <li><a href="#precios">Precios</a></li>
          <li><a href="/formacion">Formación</a></li>
        </ul>
        <div className="nav-right">
          <button className="btn-login" onClick={() => navigate('/login')}>Iniciar sesión</button>
          <button className="btn-cta-nav" onClick={() => setModalOpen(true)}>Empezar gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              <span>IA para entrenadores de fútbol</span>
            </div>
            <h1>ENTRENA<br />MEJOR.<br /><em>DECIDE</em><br />MÁS RÁPIDO.</h1>
            <p className="hero-sub">
              Plantilla, tácticas, análisis y un asistente IA que piensa contigo durante el partido.
              Todo en una sola app por <strong>€20 al mes</strong>.
            </p>
            <div className="hero-btns">
              <button className="btn-hero" onClick={() => setModalOpen(true)}>Empieza gratis 15 días →</button>
              <button className="btn-ghost" onClick={() => document.getElementById('funciones')?.scrollIntoView({ behavior: 'smooth' })}>▶ Ver funciones</button>
            </div>
            <div className="hero-login-link">
              <button onClick={() => navigate('/login')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, font:'inherit', color:'inherit' }}>¿Ya tienes cuenta? <strong style={{color:'#2dd4bf'}}>Iniciar sesión →</strong></button>
            </div>
            <div className="hero-proof">
              <div className="avatars">
                <div className="av" style={{ background: 'linear-gradient(135deg,#2dd4bf,#0e7490)', zIndex: 3 }}>⚽</div>
                <div className="av" style={{ background: 'linear-gradient(135deg,#f5c542,#d97706)', zIndex: 2 }}>🏋️</div>
                <div className="av" style={{ background: 'linear-gradient(135deg,#818cf8,#6d28d9)', zIndex: 1 }}>🎯</div>
              </div>
              <div>
                <div className="proof-text">Prueba <strong>gratis 15 días</strong>, sin tarjeta</div>
                <div className="proof-stars">⭐⭐⭐⭐⭐ 4.9/5</div>
              </div>
            </div>
          </div>

          <div className="hero-mockup">
            <div className="mockup-window">
              <div className="mockup-titlebar">
                <div className="mockup-dots"><div className="dot-r" /><div className="dot-y" /><div className="dot-g" /></div>
                <div className="mockup-urlbar">app.kickandgo.es</div>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="sb-logo">
                    <div className="sb-logo-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 2c0 0 3.5 4.5 3.5 10s-3.5 10-3.5 10-3.5-4.5-3.5-10 3.5-10 3.5-10z" /><line x1="2" y1="12" x2="22" y2="12" /></svg>
                    </div>
                    <span className="sb-logo-text">KICK<em>AND</em>GO</span>
                  </div>
                  <div className="sb-team">
                    <div className="sb-team-avatar">🏟</div>
                    <div><div className="sb-team-name">FC Llevant</div><div className="sb-team-cat">Fútbol 7</div></div>
                  </div>
                  <div className="sb-item active"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>Inicio</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>Equipo</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>Convocatoria</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>Entrenamientos</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>Estadísticas</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" /></svg>Rivales</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>Plan Temporada</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>Informes</div>
                  <div className="sb-section">MÁS</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>En Vivo</div>
                  <div className="sb-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>Pizarra táctica</div>
                </div>
                <div className="mockup-main">
                  <div className="mc-header">
                    <div><div className="mc-greeting">Hola, Xavi 👋</div><div className="mc-subtitle">Copa del Mediterráneo</div></div>
                    <div className="mc-avatar">👤</div>
                  </div>
                  <div className="mc-match">
                    <div className="mc-match-label">PRÓXIMO PARTIDO</div>
                    <div className="mc-match-date">sábado, 27 de junio</div>
                    <div className="mc-match-teams">FC Llevant<br /><em>vs</em> <span className="opp">UD Tramontana</span></div>
                  </div>
                  <div className="mc-grid">
                    <div className="mc-stat"><div className="mc-stat-val" style={{ color: '#2dd4bf' }}>20</div><div className="mc-stat-lbl">Ataque</div></div>
                    <div className="mc-stat"><div className="mc-stat-val" style={{ color: '#94a3b8' }}>0</div><div className="mc-stat-lbl">Defensa</div></div>
                    <div className="mc-stat"><div className="mc-stat-val" style={{ color: '#f5a623' }}>8</div><div className="mc-stat-lbl">Global</div></div>
                  </div>
                  <div className="mc-ai">
                    <div className="mc-ai-icon">🧠</div>
                    <div><div className="mc-ai-label">SUGERENCIA IA</div><div className="mc-ai-text">Aprovecha tu fortaleza — presiona alto desde el inicio para desequilibrar al rival.</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Ticker />

      {/* 3 FUERTES */}
      <section style={{ background: '#111117', padding: '96px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="eyebrow">Lo que nos diferencia</div>
            <h2>Tres razones por las que<br />los entrenadores nos eligen</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="kg-3fuertes">
            <div style={{ background: '#1a1a20', border: '1px solid rgba(139,92,246,.25)', borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#8b5cf6,transparent)' }} />
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(139,92,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>{ICONS.ia}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Novedad</div>
              <h3 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, color: '#f0f0f0', marginBottom: 14, lineHeight: 1.1 }}>Análisis IA<br />de tus partidos</h3>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>Después de cada partido la IA analiza lo que pasó: qué funcionó, qué falló y qué trabajar esta semana. <strong style={{ color: '#c4b5fd' }}>Sin horas de vídeo, sin papeles.</strong></p>
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#c4b5fd', fontWeight: 600 }}><span>✦</span> Sugerencias tácticas automáticas</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#c4b5fd', fontWeight: 600, marginTop: 8 }}><span>✦</span> Informe post-partido en segundos</div>
              </div>
            </div>

            <div style={{ background: '#1a1a20', border: '1px solid rgba(45,212,191,.3)', borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 60px rgba(45,212,191,.04)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#2dd4bf,transparent)' }} />
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(45,212,191,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2dd4bf', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Novedad</div>
              <h3 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, color: '#f0f0f0', marginBottom: 14, lineHeight: 1.1 }}>Comando de voz<br />en partido en vivo</h3>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>Di en voz alta "gol", "tarjeta roja" o "cambio" y la app lo registra sola. <strong style={{ color: '#5eead4' }}>Las manos libres para entrenar,</strong> no para teclear.</p>
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5eead4', fontWeight: 600 }}><span>✦</span> Goles, tarjetas y cambios por voz</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5eead4', fontWeight: 600, marginTop: 8 }}><span>✦</span> Crónica automática del partido</div>
              </div>
            </div>

            <div style={{ background: '#1a1a20', border: '1px solid rgba(37,211,102,.25)', borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#25d366,transparent)' }} />
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(37,211,102,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="13" y2="14" /></svg>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Novedad</div>
              <h3 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, color: '#f0f0f0', marginBottom: 14, lineHeight: 1.1 }}>Convocatorias<br />por WhatsApp</h3>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>Olvida los grupos de WhatsApp caóticos. Envía la convocatoria desde la app y <strong style={{ color: '#4ade80' }}>recibe confirmaciones individuales</strong>, sin mensajes perdidos.</p>
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4ade80', fontWeight: 600 }}><span>✦</span> Confirmación de asistencia directa</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4ade80', fontWeight: 600, marginTop: 8 }}><span>✦</span> Sin grupos, sin confusión</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      {/* ALIANZAS */}
      <section className="kg-alianzas-sec">
        <PartnersStrip />
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <a href="/formacion" className="kg-alianzas-link">Conoce nuestras alianzas de formación →</a>
        </div>
      </section>

      <section className="section" id="funciones">
        <div className="section-inner">
          <div className="features-header">
            <div className="eyebrow">Funciones</div>
            <h2>Todo lo que necesitas<br />en un campo</h2>
            <p className="section-sub">Diseñada por y para entrenadores de fútbol base y semipro. Sin complicaciones.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div className="feat-card" key={f.title}>
                <div className="feat-icon" style={{ background: f.bg }}>{f.ic}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <div className="stats-section">
        <div className="stats-inner">
          <div className="stat-item">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(45,212,191,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <div className="stat-lbl" style={{ fontSize: 15, color: '#f0f0f0', fontWeight: 600 }}>Ahorra tiempo</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Todo en un solo lugar,<br />sin saltar entre apps</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(139,92,246,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /></svg>
            </div>
            <div className="stat-lbl" style={{ fontSize: 15, color: '#f0f0f0', fontWeight: 600 }}>Información exacta</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Datos del equipo siempre<br />actualizados y accesibles</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,166,35,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" /></svg>
            </div>
            <div className="stat-lbl" style={{ fontSize: 15, color: '#f0f0f0', fontWeight: 600 }}>Sé el más preparado</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>El entrenador con más datos<br />siempre gana más partidos</div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <section className="pricing-section" id="precios">
        <div className="eyebrow">Precio</div>
        <h2>Simple y sin sorpresas</h2>
        <p className="section-sub" style={{ margin: '14px auto 32px' }}>Todo incluido, sin límites de jugadores ni costes ocultos.</p>

        <div style={{ display: 'inline-flex', background: '#1a1a20', border: '1px solid rgba(255,255,255,.08)', borderRadius: 100, padding: 4, marginBottom: 40, gap: 4 }}>
          <button onClick={() => setCiclo('mensual')} style={{
            padding: '9px 22px', borderRadius: 100, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
            background: ciclo === 'mensual' ? '#2dd4bf' : 'transparent',
            color: ciclo === 'mensual' ? '#042c28' : '#94a3b8',
          }}>Mensual</button>
          <button onClick={() => setCiclo('anual')} style={{
            padding: '9px 22px', borderRadius: 100, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
            background: ciclo === 'anual' ? '#2dd4bf' : 'transparent',
            color: ciclo === 'anual' ? '#042c28' : '#94a3b8',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>Anual <span style={{ fontSize: 10, opacity: .8 }}>ahorra ~17%</span></button>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
          {/* FUNDADOR */}
          <div className="pricing-card" style={{ borderColor: 'rgba(245,166,35,.4)', boxShadow: '0 0 80px rgba(245,166,35,.06)', flex: '1 1 380px', maxWidth: 420 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#f5a623,transparent)' }} />
            <div className="plan-label" style={{ color: '#f5a623' }}>🔥 Precio Fundador — primeros 50 usuarios</div>
            <div className="price">
              <div className="price-big">€{ciclo === 'mensual' ? PLANES.fundador.mensual : PLANES.fundador.anual}</div>
              <div className="price-period">/{ciclo === 'mensual' ? 'mes' : 'año'}</div>
            </div>
            <div className="price-note">Precio bloqueado para siempre mientras seas fundador · Cancela cuando quieras</div>
            <div className="price-features">
              <div className="pf"><span className="pf-check">✓</span> Plantilla ilimitada</div>
              <div className="pf"><span className="pf-check">✓</span> IA Coach incluida</div>
              <div className="pf"><span className="pf-check">✓</span> Análisis de partidos</div>
              <div className="pf"><span className="pf-check">✓</span> Pizarra táctica</div>
              <div className="pf"><span className="pf-check">✓</span> En Vivo desde el campo</div>
              <div className="pf"><span className="pf-check">✓</span> Plan de temporada</div>
              <div className="pf"><span className="pf-check">✓</span> Control de lesiones</div>
              <div className="pf"><span className="pf-check">✓</span> Soporte directo</div>
            </div>
            <button className="btn-pricing" style={{ background: '#f5a623' }} onClick={() => setModalOpen(true)}>Empieza gratis 15 días →</button>
          </div>

          {/* ESTÁNDAR */}
          <div className="pricing-card" style={{ flex: '1 1 380px', maxWidth: 420 }}>
            <div className="plan-label">Plan Entrenador</div>
            <div className="price">
              <div className="price-big">€{ciclo === 'mensual' ? PLANES.estandar.mensual : PLANES.estandar.anual}</div>
              <div className="price-period">/{ciclo === 'mensual' ? 'mes' : 'año'}</div>
            </div>
            <div className="price-note">Sin permanencia · Cancela cuando quieras</div>
            <div className="price-features">
              <div className="pf"><span className="pf-check">✓</span> Plantilla ilimitada</div>
              <div className="pf"><span className="pf-check">✓</span> IA Coach incluida</div>
              <div className="pf"><span className="pf-check">✓</span> Análisis de partidos</div>
              <div className="pf"><span className="pf-check">✓</span> Pizarra táctica</div>
              <div className="pf"><span className="pf-check">✓</span> En Vivo desde el campo</div>
              <div className="pf"><span className="pf-check">✓</span> Plan de temporada</div>
              <div className="pf"><span className="pf-check">✓</span> Control de lesiones</div>
              <div className="pf"><span className="pf-check">✓</span> Soporte directo</div>
            </div>
            <button className="btn-pricing" onClick={() => setModalOpen(true)}>Empieza gratis 15 días →</button>
          </div>
        </div>
        <div className="pricing-fine">Sin tarjeta de crédito · Activación en minutos</div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-emoji">⚽</div>
          <h2>¿Listo para entrenar<br /><em>con IA</em>?</h2>
          <p className="section-sub">Únete a los entrenadores que ya ganan más partidos con datos. 15 días gratis, sin compromiso.</p>
          <button className="btn-cta-big" onClick={() => setModalOpen(true)}>Empieza gratis ahora →</button>
          <div className="cta-fine">Sin tarjeta · Sin permanencia · Activación inmediata</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">KICK<em>AND</em>GO</div>
        <div className="footer-links">
          <a href="/privacidad">Privacidad</a>
          <a href="/terminos">Términos</a>
          <a href="mailto:kickandgoapp@gmail.com">Contacto</a>
        </div>
        <div>© 2026 KickandGo. Todos los derechos reservados.</div>
      </footer>

      {/* MODAL */}
      <div className={`modal-overlay${modalOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
        <div className="modal-box">
          <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
          <LeadForm onClose={() => setModalOpen(false)} />
        </div>
      </div>
    </div>
  )
}
