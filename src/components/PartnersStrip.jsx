// Franja dinámica de alianzas (marquee). Se desliza sola y se pausa al pasar el
// ratón para poder clicar cada logo. Reutilizable en Landing y en Formación.
// Los logos son SVG (reemplazables por los oficiales cuando lleguen).

// Curso "Técnico de Fútbol I y II" de Escuela Vitae, impartido con metodología
// Cruyff (por eso se muestra el logo de Cruyff).
const CRUYFF_URL = 'https://www.escuelavitae.com/es/cursos/tecnico-de-futbol-nivel-i-y-ii/'
const FAM_URL = 'https://www.instagram.com/famsoccer_/'

function CruyffLogo() {
  return (
    <svg width="118" height="84" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
      <polygon points="100,6 194,60 194,170 100,224 6,170 6,60" fill="#2b2e58" />
      <text x="102" y="118" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="800" fontSize="80" letterSpacing="-3"><tspan fill="#ffffff">c</tspan><tspan fill="#9c7f42">14</tspan></text>
      <text x="100" y="166" textAnchor="middle" fill="#ffffff" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fontSize="27" letterSpacing="8">CRUYFF</text>
      <text x="100" y="191" textAnchor="middle" fill="#ffffff" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fontSize="13" letterSpacing="7">FOOTBALL</text>
    </svg>
  )
}

function FamLogo({ id = 'a' }) {
  return (
    <svg width="94" height="94" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs><path id={`famTop-${id}`} d="M 26,100 A 74,74 0 0 1 174,100" fill="none" /></defs>
      <circle cx="100" cy="100" r="99" fill="#0b0b0d" />
      <circle cx="100" cy="100" r="92" fill="none" stroke="#35d67f" strokeWidth="5" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="#ffffff" strokeWidth="4" />
      <circle cx="100" cy="100" r="56" fill="#0b0b0d" />
      <g fill="none" stroke="#ffffff" strokeWidth="8" strokeLinejoin="miter">
        <path d="M85,92 L100,77 L115,92" />
        <path d="M79,108 L100,88 L121,108" />
        <path d="M74,124 L100,104 L126,124" />
      </g>
      <text fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fontSize="15" letterSpacing="1.5" fill="#35d67f">
        <textPath href={`#famTop-${id}`} startOffset="50%" textAnchor="middle">FAM SOCCER ACADEMY</textPath>
      </text>
      <text x="100" y="150" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fontSize="16" letterSpacing="3" fill="#35d67f">2024</text>
    </svg>
  )
}

const PARTNERS = [
  { type: 'cruyff', url: CRUYFF_URL, label: 'Cruyff Football' },
  { type: 'fam', url: FAM_URL, label: 'FAM Soccer Academy' },
]

function Chip({ p, uid }) {
  return (
    <a className="kg-chip" href={p.url} target="_blank" rel="noreferrer" aria-label={p.label}>
      {p.type === 'cruyff' ? <CruyffLogo /> : <FamLogo id={uid} />}
    </a>
  )
}

export default function PartnersStrip({ label = 'En alianza con' }) {
  // Repetimos la pareja para llenar la franja, y duplicamos el bloque completo
  // (mitad A + mitad B idénticas) para que el bucle no tenga saltos.
  const REPEAT = 3
  const half = []
  for (let r = 0; r < REPEAT; r++) PARTNERS.forEach((p, i) => half.push({ p, key: `${r}-${i}` }))
  const items = [
    ...half.map((x) => ({ ...x, uid: `a-${x.key}` })),
    ...half.map((x) => ({ ...x, uid: `b-${x.key}` })),
  ]
  return (
    <div className="kg-partners">
      <div className="kg-partners-label">{label}</div>
      <div className="kg-marquee">
        <div className="kg-track">
          {items.map((x) => <Chip key={x.uid} p={x.p} uid={x.uid} />)}
        </div>
      </div>
    </div>
  )
}
