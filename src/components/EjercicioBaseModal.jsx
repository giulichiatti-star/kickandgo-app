import { useState, useMemo } from 'react'

const DIAS_CORTOS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']
const DIAS_LARGOS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

function fCorta(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function EjercicioBaseModal({ ejercicio, onClose, isos, diaSel, jugadores, onAdd }) {
  const puedeAnadir = typeof onAdd === 'function' && Array.isArray(isos)
  const [diaIdx, setDiaIdx] = useState(diaSel ?? 0)
  const [duracion, setDuracion] = useState(ejercicio?.duracion_min || 15)
  const [intensidad, setIntensidad] = useState(ejercicio?.intensidad || 'Media')
  const [jugSel, setJugSel] = useState(new Set())
  const [mostrarJug, setMostrarJug] = useState(false)

  const tagsOf = ejercicio?.tags_ofensivos || []
  const tagsDef = ejercicio?.tags_defensivos || []
  const durOpciones = useMemo(() => [5, 10, 15, 20, 25, 30], [])
  const intensidades = ['Baja', 'Media', 'Alta']
  const colorInt = { Baja: '#22c55e', Media: '#f59e0b', Alta: '#ef4444' }

  if (!ejercicio) return null

  const toggleJug = (id) => {
    setJugSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const anadir = () => {
    if (!puedeAnadir) return
    onAdd(isos[diaIdx], {
      duracion_min: duracion,
      intensidad,
      jugadores: Array.from(jugSel),
    })
  }

  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:14, width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'20px 22px 16px', borderBottom:'1px solid #27272a' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>{ejercicio.categoria || 'Ejercicio'}</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#fafafa', letterSpacing:'-0.2px', lineHeight:1.25 }}>{ejercicio.nombre}</div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8, border:'1px solid #27272a', background:'transparent', color:'#a1a1aa', fontSize:14, cursor:'pointer', flexShrink:0, marginLeft:12 }}>×</button>
        </div>

        <div style={{ padding:'18px 22px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.15fr 1fr', gap:16, marginBottom:16 }}>
            <div style={{ position:'relative', aspectRatio:'16/10', borderRadius:10, overflow:'hidden', border:'1px solid #27272a', background:'#0f0f11' }}>
              {ejercicio.imagen_url ? (
                <img src={ejercicio.imagen_url} alt={ejercicio.nombre}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#3f3f46', fontSize:11 }}>Sin imagen</div>
              )}
              {ejercicio.video_url && (
                <a href={ejercicio.video_url} target="_blank" rel="noopener noreferrer"
                  style={{ position:'absolute', bottom:8, right:8, background:'rgba(15,15,17,.85)', color:'#fafafa', fontSize:11, fontWeight:600, padding:'5px 10px', borderRadius:6, textDecoration:'none' }}>
                  ▶ Ver vídeo
                </a>
              )}
            </div>
            <div>
              <div style={{ fontSize:12.5, color:'#d4d4d8', lineHeight:1.55, marginBottom:12 }}>{ejercicio.descripcion}</div>
              {ejercicio.complejidad && (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>Complejidad</div>
                  <div style={{ fontSize:12, color:'#d4d4d8', lineHeight:1.5, marginBottom:10 }}>{ejercicio.complejidad}</div>
                </>
              )}
              {ejercicio.competitividad && (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>Competitividad</div>
                  <div style={{ fontSize:12, color:'#d4d4d8', lineHeight:1.5 }}>{ejercicio.competitividad}</div>
                </>
              )}
            </div>
          </div>

          {(tagsOf.length > 0 || tagsDef.length > 0) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:'12px 0', borderTop:'1px solid #27272a' }}>
              {tagsOf.length > 0 && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#71717a', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Contenidos ofensivos</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {tagsOf.map((t) => (
                      <span key={t} style={{ fontSize:11, fontWeight:600, color:'#6ee7b7', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.3)', padding:'3px 8px', borderRadius:6 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {tagsDef.length > 0 && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#71717a', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Contenidos defensivos</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {tagsDef.map((t) => (
                      <span key={t} style={{ fontSize:11, fontWeight:600, color:'#fca5a5', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', padding:'3px 8px', borderRadius:6 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {puedeAnadir && (
            <div style={{ background:'rgba(45,212,191,.06)', border:'1px solid rgba(45,212,191,.25)', borderRadius:10, padding:14, marginTop:14 }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#2dd4bf', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>Personalizar para esta sesión</div>

              {/* Selector de día */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#a1a1aa', marginBottom:6 }}>Día de la semana</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {isos.map((d, i) => (
                    <button key={d} onClick={() => setDiaIdx(i)}
                      style={{ flex:'1 1 60px', padding:'7px 4px', borderRadius:6, border:`1px solid ${diaIdx===i?'#10b981':'#27272a'}`, background: diaIdx===i?'rgba(16,185,129,.15)':'transparent', color: diaIdx===i?'#10b981':'#a1a1aa', fontSize:10, fontWeight:700, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                      <span>{DIAS_CORTOS[i]}</span>
                      <span style={{ fontSize:9, opacity:.7 }}>{fCorta(d)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#a1a1aa', marginBottom:6 }}>Duración</div>
                  <div style={{ display:'flex', gap:4 }}>
                    {durOpciones.map((m) => (
                      <button key={m} onClick={() => setDuracion(m)}
                        style={{ flex:1, padding:'7px 0', borderRadius:6, border:`1px solid ${duracion===m?'#10b981':'#27272a'}`, background: duracion===m?'rgba(16,185,129,.15)':'transparent', color: duracion===m?'#10b981':'#71717a', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        {m}'
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#a1a1aa', marginBottom:6 }}>Intensidad</div>
                  <div style={{ display:'flex', gap:4 }}>
                    {intensidades.map((k) => (
                      <button key={k} onClick={() => setIntensidad(k)}
                        style={{ flex:1, padding:'7px 0', borderRadius:6, border:`1px solid ${intensidad===k?colorInt[k]:'#27272a'}`, background: intensidad===k?`${colorInt[k]}22`:'transparent', color: intensidad===k?colorInt[k]:'#71717a', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Jugadores */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#a1a1aa' }}>
                    Jugadores <span style={{ color:'#71717a' }}>({jugSel.size} de {jugadores?.length || 0})</span>
                  </div>
                  <button onClick={() => setMostrarJug((v) => !v)}
                    style={{ background:'transparent', color:'#2dd4bf', fontSize:11, fontWeight:600, border:'none', cursor:'pointer', padding:0 }}>
                    {mostrarJug ? 'Ocultar plantilla ↑' : 'Elegir plantilla →'}
                  </button>
                </div>
                {mostrarJug && jugadores && jugadores.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, maxHeight:120, overflowY:'auto', padding:'4px 0' }}>
                    {jugadores.map((j) => {
                      const on = jugSel.has(j.id)
                      return (
                        <button key={j.id} onClick={() => toggleJug(j.id)}
                          style={{ fontSize:11, fontWeight:600, color: on?'#fafafa':'#71717a', background: on?'#27272a':'transparent', border:`1px solid ${on?'#3f3f46':'#27272a'}`, padding:'3px 8px', borderRadius:6, cursor:'pointer' }}>
                          {j.dorsal ? `#${j.dorsal} ` : ''}{(j.nombre || '').split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            {puedeAnadir ? (
              <button onClick={anadir}
                style={{ flex:1, background:'#10b981', color:'#022c22', fontSize:13, fontWeight:700, padding:11, borderRadius:9, border:'none', cursor:'pointer' }}>
                + Añadir a {DIAS_LARGOS[diaIdx]}
              </button>
            ) : null}
            <button onClick={onClose}
              style={{ background:'transparent', color:'#a1a1aa', fontSize:13, fontWeight:600, padding:'11px 16px', borderRadius:9, border:'1px solid #27272a', cursor:'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
