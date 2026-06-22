// Camiseta / escudo / chapa por equipo (portado de la demo)
const KIT = {
  local: { c1: '#e9f6ee', c2: '#1f9d57', num: '#0f5132' }, // verdiblanco
  rival: { c1: '#c0392b', c2: '#161616', num: '#ffffff' }, // rojinegro
  gkL: { solid: '#8b5cf6', num: '#ffffff' },                // portero local morado
  gkR: { solid: '#3b82f6', num: '#ffffff' },                // portero rival azul
}
const SHIRT = 'M13 5 L4 9 L7 18 L12 16 L12 35 L28 35 L28 16 L33 18 L36 9 L27 5 L23 8 Q20 11 17 8 Z'

let _id = 0

export default function Jersey({ num, side = 'local', gk = false, vista = 'camisetas' }) {
  const kit = gk ? (side === 'rival' ? KIT.gkR : KIT.gkL) : (side === 'rival' ? KIT.rival : KIT.local)

  if (vista === 'chapas') {
    return <div className="ev2-chip-disc" style={{ background: gk ? kit.solid : kit.c2 }}>{num}</div>
  }
  if (vista === 'escudo') {
    return (
      <div style={{ position: 'relative', width: 36, height: 40, display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 36 40" width="36" height="40">
          <path d="M2 3 L34 3 L34 22 Q34 34 18 39 Q2 34 2 22 Z" fill={gk ? kit.solid : kit.c2} stroke="rgba(255,255,255,.6)" strokeWidth="1.5" />
        </svg>
        <span style={{ position: 'absolute', color: '#fff', fontSize: 13, fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>{num}</span>
      </div>
    )
  }
  // camisetas
  const id = `jk${_id++}`
  return (
    <div className="ev2-jwrap">
      <svg viewBox="0 0 40 40" width="40" height="40" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}>
        {gk ? (
          <path d={SHIRT} fill={kit.solid} stroke="rgba(0,0,0,.4)" strokeWidth="1" />
        ) : (
          <>
            <defs><clipPath id={id}><path d={SHIRT} /></clipPath></defs>
            <g clipPath={`url(#${id})`}>
              <rect x="0" y="0" width="40" height="40" fill={kit.c1} />
              <rect x="8" y="0" width="5" height="40" fill={kit.c2} />
              <rect x="18" y="0" width="5" height="40" fill={kit.c2} />
              <rect x="28" y="0" width="5" height="40" fill={kit.c2} />
            </g>
            <path d={SHIRT} fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="1" />
          </>
        )}
      </svg>
      <span className="ev2-jnum" style={{ color: kit.num }}>{num}</span>
    </div>
  )
}
