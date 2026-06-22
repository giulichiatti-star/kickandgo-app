import { useEffect, useRef, useState } from 'react'
import { responder, responderIA, iaDisponible, SUGERENCIAS } from '../lib/asistente'
import { listarJugadores } from '../lib/jugadores'
import { listarPartidos } from '../lib/partidos'
import { listarTarjetas } from '../lib/tarjetas'
import { listarEntrenos } from '../lib/entrenamientos'
import { ultimaConvocatoria } from '../lib/convocatorias'
import { getPerfil } from '../lib/perfil'
import { getCompeticion, resolverLiga } from '../lib/competicion'

export default function Asistente() {
  const [ctx, setCtx] = useState(null)
  const [mensajes, setMensajes] = useState([
    { from: 'ai', text: '¡Hola! Soy tu asistente. Pregúntame por el goleador, cómo vais, el próximo rival o las sanciones.' },
  ])
  const [input, setInput] = useState('')
  const fin = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const [jugadores, partidos, tarjetas, entrenos, conv, perfil, comp] = await Promise.all([
          listarJugadores(), listarPartidos(), listarTarjetas(), listarEntrenos().catch(() => []), ultimaConvocatoria(), getPerfil(), getCompeticion(),
        ])
        setCtx({ jugadores, partidos, tarjetas, entrenos, conv, club: perfil?.club_nombre || 'tu equipo', liga: resolverLiga(comp) })
      } catch { setCtx({}) }
    })()
  }, [])

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  async function enviar(texto) {
    const q = (texto ?? input).trim()
    if (!q) return
    setInput('')
    setMensajes((m) => [...m, { from: 'user', text: q }])
    // 1) Si hay IA real (Claude) configurada, intentar respuesta libre
    if (ctx && iaDisponible()) {
      setMensajes((m) => [...m, { from: 'ai', text: '…' }])
      const r = await responderIA(q, ctx)
      setMensajes((m) => {
        const copia = [...m]; copia[copia.length - 1] = { from: 'ai', text: r || responder(q, ctx) }; return copia
      })
      return
    }
    // 2) Reglas con tus datos
    const r = ctx ? responder(q, ctx) : 'Cargando tus datos un momento…'
    setMensajes((m) => [...m, { from: 'ai', text: r }])
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <h1 className="text-xl font-extrabold mb-3">🤖 Asistente</h1>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm ${
              m.from === 'user' ? 'bg-cyan text-black rounded-br-sm' : 'card rounded-bl-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={fin} />
      </div>

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
