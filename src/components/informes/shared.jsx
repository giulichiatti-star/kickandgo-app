/* Componentes compartidos de Informes */

function MiniBar({ val, max, col }) {
  const pct = Math.min(100, (val / Math.max(max, 1)) * 100)
  return (
    <div style={{ height: 3, background: '#2e2e38', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 2, transition: 'width .4s' }} />
    </div>
  )
}

export function Gauge({ val, col }) {
  const r = 50, circ = 2 * Math.PI * r
  const off = circ - (Math.min(10, Math.max(0, val)) / 10) * circ
  const color = col || (val >= 7 ? '#34d399' : val >= 5.5 ? '#f59e0b' : '#f87171')
  return (
    <div className="relative mx-auto" style={{ width: 130, height: 130 }}>
      <div className="absolute rounded-full" style={{
        width: 90, height: 90, top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`
      }} />
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#2e2e38" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '65px 65px', filter: `drop-shadow(0 0 6px ${color}88)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{val.toFixed(1)}</span>
        <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '.5px', color: '#71717a', marginTop: 3 }}>global</span>
      </div>
    </div>
  )
}

export function PlayerCard({ tipo, col, nom, rate, stat, sub, foto_url }) {
  const initials = nom ? nom.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() : '—'
  return (
    <div className="flex flex-col items-center text-center p-5">
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: col, marginBottom: 10 }}>{tipo}</div>
      <div className="rounded-full flex items-center justify-center font-black mb-3 overflow-hidden"
        style={{
          width: 54, height: 54,
          background: foto_url ? 'transparent' : `linear-gradient(135deg, ${col}33, ${col}11)`,
          border: `2px solid ${col}55`, color: col, fontSize: 17,
          boxShadow: `0 0 16px ${col}30`
        }}>
        {foto_url ? <img src={foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: col, lineHeight: 1, textShadow: `0 0 20px ${col}60` }}>
        {rate > 0 ? rate.toFixed(1) : '—'}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 6, marginBottom: 2 }}>{nom || 'Sin datos'}</div>
      <div style={{ fontSize: 10, color: '#71717a' }}>
        {stat && stat !== '—' && <b style={{ color: '#fff', fontSize: 11, marginRight: 4 }}>{stat}</b>}{sub}
      </div>
    </div>
  )
}

export const SecH = ({ children, col }) => (
  <div className="flex items-center gap-2 mb-3">
    {col && <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: col }} />}
    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#52525b' }}>{children}</span>
  </div>
)

export function StatRow({ label, left, right, isGoal, isWarn, maxVal = 10 }) {
  const lc = isGoal && left > 0 ? '#34d399' : isWarn && left > 0 ? '#f87171' : '#fff'
  const rc = isGoal && right > 0 ? '#f87171' : '#fff'
  return (
    <div className="py-1.5 border-t border-borde">
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 32px', gap: '0 8px', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: lc }}>{left}</span>
        <span style={{ fontSize: 10, color: '#52525b', textAlign: 'center' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: rc, textAlign: 'right' }}>{right}</span>
      </div>
      {typeof left === 'number' && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <MiniBar val={left} max={Math.max(left, typeof right === 'number' ? right : 0, 1)} col={lc} />
          <MiniBar val={typeof right === 'number' ? right : 0} max={Math.max(left, typeof right === 'number' ? right : 0, 1)} col={rc} />
        </div>
      )}
    </div>
  )
}

export const IcoOk = () => (
  <span className="flex-shrink-0 flex items-center justify-center rounded-full font-black"
    style={{ width: 18, height: 18, background: '#16a34a', color: '#fff', fontSize: 9 }}>✓</span>
)

export const IcoWarn = () => (
  <span className="flex-shrink-0 flex items-center justify-center rounded-full font-black"
    style={{ width: 18, height: 18, background: '#dc2626', color: '#fff', fontSize: 10 }}>!</span>
)

export const TTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
      {label && <div style={{ color: '#71717a', marginBottom: 3 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}
