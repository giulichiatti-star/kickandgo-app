export default function EjercicioBaseModal({ ejercicio, onClose }) {
  if (!ejercicio) return null
  const tagsOf = ejercicio.tags_ofensivos || []
  const tagsDef = ejercicio.tags_defensivos || []

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
        </div>
      </div>
    </div>
  )
}
