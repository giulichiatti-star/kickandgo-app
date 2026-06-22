export default function Ring({ value = 0, color = '#2dd4bf', label, icon }) {
  const v = Math.max(0, Math.min(100, value))
  const r = 30
  const c = 2 * Math.PI * r
  const off = c * (1 - v / 100)
  return (
    <div className="text-center">
      <div className="relative w-[68px] h-[68px] mx-auto">
        <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
          <circle cx="34" cy="34" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
          <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-base font-black">{Math.round(v)}</div>
      </div>
      <div className="text-[10px] text-muted mt-1">{icon} {label}</div>
    </div>
  )
}
