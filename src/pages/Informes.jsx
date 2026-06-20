import { useEffect, useState } from 'react'
import { listarPartidos } from '../lib/partidos'

function resultado(gf, gc) {
  if (gf > gc) return { l: 'V', c: 'text-cyan' }
  if (gf < gc) return { l: 'D', c: 'text-rojo' }
  return { l: 'E', c: 'text-dorado' }
}
function fechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function Informes() {
  const [partidos, setPartidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try { setPartidos(await listarPartidos()) }
      catch (e) { setError(e.message) }
      finally { setCargando(false) }
    })()
  }, [])

  if (cargando) return <div className="text-sm text-muted py-10 text-center">Cargando…</div>

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-1">Informes</h1>
      <p className="text-xs text-muted mb-4">{partidos.length} partidos guardados</p>
      {error && <div className="text-xs text-rojo mb-3">{error}</div>}

      {partidos.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          Aún no hay partidos. Juega uno en <b className="text-cyan">En Vivo</b> y pulsa "Finalizar y guardar".
        </div>
      ) : (
        <div className="space-y-2">
          {partidos.map((p) => {
            const r = resultado(p.gf, p.gc)
            const eventos = Array.isArray(p.notas) ? p.notas : []
            const abiertoEste = abierto === p.id
            return (
              <div key={p.id} className="card overflow-hidden">
                <button className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5"
                  onClick={() => setAbierto(abiertoEste ? null : p.id)}>
                  <div className={`w-7 h-7 rounded-md grid place-items-center font-black text-sm ${r.c} bg-white/5`}>{r.l}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">vs {p.rival || 'Rival'}</div>
                    <div className="text-[11px] text-muted">{fechaCorta(p.fecha)} · {p.local_visitante}</div>
                  </div>
                  <div className="text-lg font-black">{p.gf} – {p.gc}</div>
                </button>
                {abiertoEste && (
                  <div className="border-t border-borde p-3">
                    <div className="text-xs font-bold text-muted uppercase mb-2">Eventos ({eventos.length})</div>
                    {eventos.length === 0 ? (
                      <div className="text-[11px] text-muted">Sin eventos registrados.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {eventos.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-xs text-muted w-9">{e.min}'</span>
                            <span className="flex-1">{e.label}{e.jugador ? ` · ${e.jugador}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
