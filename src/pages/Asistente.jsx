import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { responder, responderIA, iaDisponible, SUGERENCIAS } from '../lib/asistente'
import { listarJugadores } from '../lib/jugadores'
import { listarPartidos } from '../lib/partidos'
import { listarTarjetas } from '../lib/tarjetas'
import { listarEntrenos, guardarEntreno } from '../lib/entrenamientos'
import { ultimaConvocatoria } from '../lib/convocatorias'
import { getPerfil } from '../lib/perfil'
import { getCompeticion, resolverLiga } from '../lib/competicion'
import { useEquipo } from '../contexts/EquipoContext'

export default function Asistente() {
  const { equipoActivo } = useEquipo()
  const eid = equipoActivo?.id
  const location = useLocation()
  const navigate = useNavigate()
  const [ctx, setCtx] = useState(null)
  const [mensajes, setMensajes] = useState([
    { from: 'ai', text: '¡Hola! Soy tu asistente. Pregúntame por el goleador, cómo vais, el próximo rival o las sanciones.' },
  ])
  const [input, setInput] = useState('')
  const [guardando, setGuardando] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [editandoNombre, setEditandoNombre] = useState(null) // idx del mensaje
  const [nombreEdit, setNombreEdit] = useState('')
  const fin = useRef(null)
  const promptPendiente = useRef(location.state?.prompt || null)

  useEffect(() => {
    (async () => {
      try {
        const [jugadores, partidos, tarjetas, entrenos, conv, perfil, comp] = await Promise.all([
          listarJugadores(eid), listarPartidos(eid), listarTarjetas(eid), listarEntrenos(eid).catch(() => []), ultimaConvocatoria(eid), getPerfil(), getCompeticion(eid),
        ])
        const nuevoCtx = { jugadores, partidos, tarjetas, entrenos, conv, club: equipoActivo?.nombre || perfil?.club_nombre || 'tu equipo', liga: resolverLiga(comp) }
        setCtx(nuevoCtx)
        if (promptPendiente.current) {
          const p = promptPendiente.current
          promptPendiente.current = null
          setTimeout(() => enviarConCtx(p, nuevoCtx), 100)
        }
      } catch { setCtx({}) }
    })()
  }, [eid])

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  function parsearRespuesta(r) {
    if (r && typeof r === 'object') return r
    return { text: r }
  }

  async function enviarConCtx(texto, ctxLocal) {
    const q = texto.trim()
    if (!q) return
    setMensajes((m) => [...m, { from: 'user', text: q }])
    if (ctxLocal && iaDisponible()) {
      setMensajes((m) => [...m, { from: 'ai', text: '…' }])
      const r = await responderIA(q, ctxLocal)
      const fallback = parsearRespuesta(responder(q, ctxLocal))
      setMensajes((m) => { const c = [...m]; c[c.length-1] = { from:'ai', text: r || fallback.text, entreno: fallback.entreno }; return c })
      return
    }
    const r = ctxLocal ? parsearRespuesta(responder(q, ctxLocal)) : { text: 'Cargando tus datos un momento…' }
    setMensajes((m) => [...m, { from: 'ai', text: r.text, entreno: r.entreno }])
  }

  async function enviar(texto) {
    const q = (texto ?? input).trim()
    if (!q) return
    setInput('')
    enviarConCtx(q, ctx)
  }

  async function guardarPlan(entreno, idx) {
    setGuardando(idx)
    try {
      await guardarEntreno(entreno, eid)
      setToastMsg('✅ Entreno guardado')
      setTimeout(() => { setToastMsg(''); navigate('/entrenamientos') }, 1800)
    } catch (e) {
      setToastMsg('⚠️ ' + e.message)
      setTimeout(() => setToastMsg(''), 3000)
    } finally { setGuardando(null) }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <h1 className="text-xl font-extrabold mb-3">🤖 Asistente</h1>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
              m.from === 'user' ? 'bg-cyan text-black rounded-br-sm' : 'card rounded-bl-sm'}`}>
              {m.text}
            </div>
            {m.entreno && (
              editandoNombre === i ? (
                <div className="mt-1.5 flex gap-1.5 items-center max-w-[82%]">
                  <input
                    autoFocus
                    className="field text-[11px] flex-1 py-1.5"
                    value={nombreEdit}
                    onChange={e => setNombreEdit(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter') guardarPlan({...m.entreno, objetivo: nombreEdit}, i); if (e.key==='Escape') setEditandoNombre(null) }}
                    placeholder="Nombre del entreno…"
                  />
                  <button
                    onClick={() => guardarPlan({...m.entreno, objetivo: nombreEdit}, i)}
                    disabled={guardando === i || !nombreEdit.trim()}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition flex-shrink-0"
                    style={{ borderColor:'rgba(45,212,191,0.4)', color:'#2dd4bf', background:'rgba(45,212,191,0.1)' }}>
                    {guardando === i ? '⏳' : '✓ Guardar'}
                  </button>
                  <button onClick={() => setEditandoNombre(null)}
                    className="text-[11px] px-2 py-1.5 rounded-lg border border-zinc-700 text-zinc-500 flex-shrink-0">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditandoNombre(i); setNombreEdit(m.entreno.objetivo || '') }}
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition"
                  style={{ borderColor:'rgba(45,212,191,0.35)', color:'#2dd4bf', background:'rgba(45,212,191,0.08)' }}>
                  💾 Guardar como entreno
                </button>
              )
            )}
          </div>
        ))}
        <div ref={fin} />
      </div>

      {toastMsg && (
        <div className="fixed bottom-20 right-4 text-xs px-4 py-2.5 rounded-xl font-bold z-50"
          style={{ background: toastMsg.startsWith('✅') ? 'rgba(22,163,74,0.9)' : 'rgba(220,38,38,0.9)', color:'#fff', borderLeft:'3px solid #fff' }}>
          {toastMsg}
        </div>
      )}

      {/* Sugerencias */}
      <div className="flex gap-1.5 overflow-x-auto py-2">
        {SUGERENCIAS.map((s) => (
          <button key={s} onClick={() => enviar(s)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-borde text-muted whitespace-nowrap hover:bg-white/5">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input className="field flex-1" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()} placeholder="Pregunta sobre tu equipo…" />
        <button className="btn btn-primary" onClick={() => enviar()}>Enviar</button>
      </div>
    </div>
  )
}
