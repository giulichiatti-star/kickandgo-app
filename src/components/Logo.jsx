export default function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="5" height="24" rx="1.5" fill="#2dd4bf" />
        <path d="M11 16 L24 4 L31 4 L17 16 Z" fill="#2dd4bf" />
        <path d="M11 16 L17 16 L31 28 L24 28 Z" fill="#f59e0b" />
      </svg>
      <span className="font-extrabold tracking-tight leading-none">
        KICK <span className="text-dorado">AND GO</span>
      </span>
    </div>
  )
}
