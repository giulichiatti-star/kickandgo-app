// Mini-cancha vertical: portero abajo, delanteros arriba.
// Coloca a los titulares por categoría (POR/DEF/MED/DEL) y muestra iconos de eventos.
const ORDEN = ['POR', 'DEF', 'MED', 'DEL']

function apellidoCorto(nombre) {
  const p = (nombre || '').trim().split(/\s+/)
  if (p.length < 2) return p[0] || ''
  return `${p[0]} ${p[1][0]}.`
}

export default function Pitch({ titulares = [], seleccionado, onSelect, marks = {}, puntos = null }) {
  // Modo FORMACIÓN: puntos ya posicionados {id,num,nombre,gk,x,y}
  if (puntos) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-cyan/20 mb-4"
        style={{ background: 'linear-gradient(180deg,#0c1a14,#0a1410)', aspectRatio: '3/4' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="none">
          <rect x="3" y="3" width="94" height="127" fill="none" stroke="rgba(45,212,191,.25)" strokeWidth="0.6" />
          <line x1="3" y1="66.5" x2="97" y2="66.5" stroke="rgba(45,212,191,.25)" strokeWidth="0.6" />
          <circle cx="50" cy="66.5" r="11" fill="none" stroke="rgba(45,212,191,.25)" strokeWidth="0.6" />
          <rect x="28" y="3" width="44" height="18" fill="none" stroke="rgba(45,212,191,.2)" strokeWidth="0.6" />
          <rect x="28" y="112" width="44" height="18" fill="none" stroke="rgba(45,212,191,.2)" strokeWidth="0.6" />
        </svg>
        {puntos.map((p) => {
          const sel = seleccionado?.id === p.id
          const ms = marks[p.num] || []
          return (
            <button key={p.id} onClick={() => onSelect(sel ? null : { id: p.id, dorsal: p.num, nombre: p.nombre })}
              className="absolute flex flex-col items-center -ml-[18px] -mt-[18px]" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {ms.length > 0 && (
                <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 z-10">
                  {ms.map((m, k) => <span key={k} className="text-[10px] leading-none bg-negro/80 rounded-full w-4 h-4 grid place-items-center border border-white/20">{m}</span>)}
                </div>
              )}
              <div className={`w-9 h-9 rounded-full grid place-items-center text-sm font-black border-2 transition ${sel ? 'border-white scale-110' : 'border-white/30'}`}
                style={{ background: p.gk ? '#2f7fe0' : '#22c3b0', color: '#0d0d0f' }}>{p.num}</div>
              <div className="text-[8px] text-white/80 mt-0.5 max-w-[56px] truncate">{apellidoCorto(p.nombre)}</div>
            </button>
          )
        })}
      </div>
    )
  }

  // Agrupar por categoría
  const filas = ORDEN.map((cat) => titulares.filter((j) => (j.cat || 'MED') === cat))
  // Si algún jugador no tiene cat reconocida, va a MED
  const noClasificados = titulares.filter((j) => !ORDEN.includes(j.cat))
  if (noClasificados.length) filas[2] = filas[2].concat(noClasificados)

  return (
    <div className="relative rounded-xl overflow-hidden border border-cyan/20 mb-4"
      style={{ background: 'linear-gradient(180deg,#0c1a14,#0a1410)', aspectRatio: '3/4' }}>
      {/* líneas */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="none">
        <rect x="3" y="3" width="94" height="127" fill="none" stroke="rgba(45,212,191,.25)" strokeWidth="0.6" />
        <line x1="3" y1="66.5" x2="97" y2="66.5" stroke="rgba(45,212,191,.25)" strokeWidth="0.6" />
        <circle cx="50" cy="66.5" r="11" fill="none" stroke="rgba(45,212,191,.25)" strokeWidth="0.6" />
        <rect x="30" y="3" width="40" height="18" fill="none" stroke="rgba(45,212,191,.2)" strokeWidth="0.6" />
        <rect x="30" y="112" width="40" height="18" fill="none" stroke="rgba(45,212,191,.2)" strokeWidth="0.6" />
      </svg>

      {/* filas de jugadores */}
      <div className="absolute inset-0 flex flex-col-reverse justify-around py-3">
        {filas.map((fila, i) => (
          <div key={i} className="flex justify-around items-center">
            {fila.map((j) => {
              const sel = seleccionado?.id === j.id
              const ms = marks[j.dorsal] || []
              const esGK = (j.cat === 'POR')
              return (
                <button key={j.id} onClick={() => onSelect(sel ? null : j)} className="relative flex flex-col items-center">
                  {ms.length > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 z-10">
                      {ms.map((m, k) => (
                        <span key={k} className="text-[10px] leading-none bg-negro/80 rounded-full w-4 h-4 grid place-items-center border border-white/20">{m}</span>
                      ))}
                    </div>
                  )}
                  <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-black border-2 transition ${
                    sel ? 'border-white scale-110' : 'border-white/30'}`}
                    style={{ background: esGK ? '#2f7fe0' : '#22c3b0', color: '#0d0d0f' }}>
                    {j.dorsal}
                  </div>
                  <div className="text-[8px] text-white/80 mt-0.5 max-w-[54px] truncate">{apellidoCorto(j.nombre)}</div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
