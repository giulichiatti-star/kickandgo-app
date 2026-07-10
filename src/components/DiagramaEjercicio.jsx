// Diagrama SVG generado para ejercicios base sin imagen real.
// Selecciona por nombre exacto; si no encuentra, muestra un genérico según categoría o nombre.

const S = { r:'#ef4444', y:'#fbbf24', b:'#3b82f6', w:'#fafafa', k:'#000', gk:'#000' }
const line = { stroke:'rgba(255,255,255,.55)', strokeWidth:0.8, fill:'none' }
const dashed = { stroke:'#fafafa', strokeWidth:1, strokeDasharray:'2,2', fill:'none' }
const arrowY = { stroke:'#fbbf24', strokeWidth:1.2, fill:'none' }

const Bg = () => <rect x="0" y="0" width="200" height="125" fill="url(#g1)"/>
const Defs = () => (
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3a7a3f"/>
      <stop offset="100%" stopColor="#2f6a35"/>
    </linearGradient>
  </defs>
)
const Player = ({ x, y, color, r=3 }) => (
  <circle cx={x} cy={y} r={r} fill={color} stroke={S.k} strokeWidth={0.4}/>
)
const Ball = ({ x, y }) => <circle cx={x} cy={y} r={1.3} fill={S.w}/>
const Lbl = ({ x, y, children, anchor='middle', size=6 }) => (
  <text x={x} y={y} fill={S.y} fontSize={size} fontWeight={700} fontFamily="Inter" textAnchor={anchor}>{children}</text>
)

const DIAG = {
  'Calentamiento dinámico con balón': (
    <>
      <Bg/>
      <rect x="20" y="15" width="160" height="95" {...line} strokeDasharray="3,2"/>
      {[30,60,90,120,150].map(cx => (
        <g key={cx}>
          <polygon points={`${cx},25 ${cx+3},32 ${cx-3},32`} fill={S.y}/>
          <polygon points={`${cx},95 ${cx+3},102 ${cx-3},102`} fill={S.y}/>
          <Player x={cx} y={60} color={S.r}/>
        </g>
      ))}
      <path d="M 30 60 Q 45 30 60 60 T 90 60 T 120 60 T 150 60" {...dashed}/>
      <Ball x={30} y={60}/><Ball x={60} y={60}/><Ball x={90} y={60}/>
    </>
  ),
  'Rondo 5v2 con comodines': (
    <>
      <Bg/>
      <rect x="55" y="20" width="90" height="85" {...line}/>
      <Player x={100} y={25} color={S.r} r={3.5}/>
      <Player x={145} y={45} color={S.r} r={3.5}/>
      <Player x={145} y={85} color={S.r} r={3.5}/>
      <Player x={100} y={100} color={S.r} r={3.5}/>
      <Player x={55} y={65} color={S.r} r={3.5}/>
      <Player x={95} y={55} color={S.y} r={3.5}/>
      <Player x={110} y={72} color={S.y} r={3.5}/>
      <g {...dashed}>
        <path d="M 100 28 L 143 42"/>
        <path d="M 145 48 L 143 82"/>
        <path d="M 142 87 L 103 98"/>
        <path d="M 97 100 L 57 68"/>
        <path d="M 58 63 L 97 27"/>
      </g>
      <Ball x={145} y={45}/>
    </>
  ),
  '4v4 + 2 apoyos en bandas': (
    <>
      <Bg/>
      <rect x="25" y="20" width="150" height="85" {...line}/>
      <line x1="100" y1="20" x2="100" y2="105" stroke="rgba(255,255,255,.35)" strokeWidth={0.5} strokeDasharray="2,2"/>
      <Player x={55} y={45} color={S.r} r={3.5}/><Player x={55} y={80} color={S.r} r={3.5}/>
      <Player x={80} y={60} color={S.r} r={3.5}/><Player x={90} y={90} color={S.r} r={3.5}/>
      <Player x={120} y={45} color={S.y} r={3.5}/><Player x={115} y={80} color={S.y} r={3.5}/>
      <Player x={140} y={60} color={S.y} r={3.5}/><Player x={150} y={90} color={S.y} r={3.5}/>
      <Player x={100} y={12} color={S.b} r={3.5}/><Player x={100} y={113} color={S.b} r={3.5}/>
      <path d="M 80 60 L 100 15" {...dashed}/>
      <path d="M 100 15 L 118 45" {...dashed}/>
      <Ball x={80} y={60}/>
    </>
  ),
  'Transición 6 ataca vs 4 defiende (8s)': (
    <>
      <Bg/>
      <rect x="0" y="15" width="200" height="95" stroke="rgba(255,255,255,.5)" strokeWidth={0.6} fill="none"/>
      <line x1="100" y1="15" x2="100" y2="110" stroke="rgba(255,255,255,.35)" strokeWidth={0.4} strokeDasharray="2,2"/>
      <Player x={40} y={40} color={S.r} r={3.5}/><Player x={40} y={90} color={S.r} r={3.5}/>
      <Player x={70} y={60} color={S.r} r={3.5}/><Player x={70} y={30} color={S.r} r={3.5}/>
      <Player x={70} y={90} color={S.r} r={3.5}/><Player x={95} y={65} color={S.r} r={3.5}/>
      <Player x={140} y={45} color={S.y} r={3.5}/><Player x={140} y={80} color={S.y} r={3.5}/>
      <Player x={165} y={35} color={S.y} r={3.5}/><Player x={165} y={90} color={S.y} r={3.5}/>
      <path d="M 95 65 L 165 60" stroke={S.w} strokeWidth={1.2} fill="none"/>
      <path d="M 70 60 L 140 55" {...dashed}/>
      <Lbl x={100} y={12}>⏱ 8 s</Lbl>
    </>
  ),
  'Partido con presión 8 tras pérdida': (
    <>
      <Bg/>
      <rect x="10" y="15" width="180" height="95" stroke="rgba(255,255,255,.5)" strokeWidth={0.6} fill="none"/>
      <circle cx="100" cy="62" r="14" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={0.5}/>
      <Player x={60} y={40} color={S.r} r={3.5}/><Player x={80} y={60} color={S.r} r={3.5}/>
      <Player x={60} y={85} color={S.r} r={3.5}/><Player x={100} y={45} color={S.r} r={3.5}/>
      <Player x={140} y={55} color={S.y} r={3.5}/><Player x={130} y={85} color={S.y} r={3.5}/>
      <Player x={160} y={35} color={S.y} r={3.5}/><Player x={120} y={30} color={S.y} r={3.5}/>
      <g {...arrowY} strokeDasharray="2,2">
        <path d="M 100 45 L 138 55"/>
        <path d="M 80 60 L 128 82"/>
        <path d="M 60 40 L 118 32"/>
      </g>
      <Ball x={140} y={55}/>
      <Lbl x={100} y={12}>⏱ 8 s presión</Lbl>
    </>
  ),
  'Finalización ante portero (2v1 / 3v2)': (
    <>
      <Bg/>
      <rect x="80" y="15" width="120" height="95" {...line}/>
      <rect x="140" y="35" width="60" height="55" {...line}/>
      <rect x="196" y="55" width="4" height="15" fill="none" stroke="#fff" strokeWidth={1}/>
      <circle cx="170" cy="62" r="2.5" fill={S.gk} stroke={S.w} strokeWidth={0.4}/>
      <Player x={30} y={50} color={S.r} r={3.5}/><Player x={30} y={75} color={S.r} r={3.5}/>
      <Player x={60} y={62} color={S.r} r={3.5}/>
      <Player x={110} y={45} color={S.y} r={3.5}/><Player x={110} y={80} color={S.y} r={3.5}/>
      <path d="M 30 50 L 58 62" stroke={S.w} strokeWidth={1.2} fill="none"/>
      <path d="M 30 75 L 58 62" stroke={S.w} strokeWidth={1.2} fill="none"/>
      <path d="M 60 62 L 195 62" stroke={S.y} strokeWidth={1.2} fill="none"/>
      <Ball x={60} y={62}/>
    </>
  ),
  'Definición con pierna débil': (
    <>
      <Bg/>
      <rect x="80" y="15" width="120" height="95" {...line}/>
      <rect x="140" y="35" width="60" height="55" {...line}/>
      <rect x="196" y="55" width="4" height="15" fill="none" stroke="#fff" strokeWidth={1}/>
      <circle cx="180" cy="62" r="3" fill={S.gk} stroke={S.w} strokeWidth={0.5}/>
      <Player x={30} y={70} color={S.b} r={4}/>
      <Player x={100} y={60} color={S.r} r={3}/>
      <path d="M 34 70 L 96 62" {...dashed}/>
      <path d="M 103 58 L 175 60" stroke={S.y} strokeWidth={1.4} fill="none"/>
      <polygon points="175,60 170,58 170,62" fill={S.y}/>
      <Lbl x={130} y={55}>PIE DÉBIL</Lbl>
      <Ball x={30} y={70}/>
    </>
  ),
  'Balón parado ofensivo (córners)': (
    <>
      <Bg/>
      <rect x="0" y="30" width="70" height="65" {...line}/>
      <rect x="0" y="50" width="30" height="25" {...line}/>
      <rect x="-2" y="55" width="4" height="15" fill="none" stroke="#fff" strokeWidth={1}/>
      <path d="M0 5 A 5 5 0 0 1 5 0" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={0.6}/>
      <circle cx="3" cy="3" r="2" fill={S.w} stroke={S.k} strokeWidth={0.3}/>
      <path d="M 5 5 Q 30 40 50 55" fill="none" stroke={S.y} strokeWidth={1} strokeDasharray="2,2"/>
      <path d="M 5 5 Q 40 60 40 80" fill="none" stroke={S.y} strokeWidth={1} strokeDasharray="2,2"/>
      <Player x={35} y={55} color={S.r}/><Player x={55} y={60} color={S.r}/>
      <Player x={45} y={75} color={S.r}/><Player x={30} y={80} color={S.r}/>
      <Player x={30} y={60} color={S.y}/><Player x={45} y={65} color={S.y}/>
      <Player x={50} y={70} color={S.y}/>
      <circle cx="8" cy="62" r="2.5" fill={S.gk} stroke={S.w} strokeWidth={0.4}/>
    </>
  ),
  'Reflejos + blocajes + 1v1': (
    <>
      <Bg/>
      <rect x="60" y="15" width="130" height="95" {...line}/>
      <rect x="130" y="30" width="60" height="65" {...line}/>
      <rect x="188" y="55" width="4" height="15" fill="none" stroke="#fff" strokeWidth={1}/>
      <circle cx="165" cy="62" r="4" fill={S.gk} stroke={S.w} strokeWidth={0.5}/>
      <text x="165" y="52" fill={S.w} fontSize="5" textAnchor="middle" fontWeight={700}>GK</text>
      <Player x={60} y={40} color={S.r}/><Player x={80} y={62} color={S.r}/>
      <Player x={60} y={85} color={S.r}/><Player x={100} y={30} color={S.r}/>
      <Player x={100} y={95} color={S.r}/>
      <g fill="none" stroke={S.y} strokeWidth={1}>
        <path d="M 62 40 L 160 60"/>
        <path d="M 82 62 L 162 62"/>
        <path d="M 62 85 L 160 65"/>
        <path d="M 100 30 L 165 58"/>
        <path d="M 100 95 L 165 66"/>
      </g>
      <Ball x={80} y={62}/>
    </>
  ),
  'Partido condicionado': (
    <>
      <Bg/>
      <rect x="5" y="10" width="190" height="105" {...line}/>
      <line x1="100" y1="10" x2="100" y2="115" stroke="rgba(255,255,255,.55)" strokeWidth={0.6}/>
      <circle cx="100" cy="62" r="15" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={0.6}/>
      <rect x="5" y="40" width="20" height="45" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={0.5}/>
      <rect x="175" y="40" width="20" height="45" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={0.5}/>
      <Player x={35} y={40} color={S.r} r={2.8}/><Player x={35} y={85} color={S.r} r={2.8}/>
      <Player x={60} y={30} color={S.r} r={2.8}/><Player x={65} y={62} color={S.r} r={2.8}/>
      <Player x={60} y={95} color={S.r} r={2.8}/>
      <Player x={140} y={30} color={S.y} r={2.8}/><Player x={135} y={62} color={S.y} r={2.8}/>
      <Player x={140} y={95} color={S.y} r={2.8}/><Player x={165} y={45} color={S.y} r={2.8}/>
      <Player x={165} y={82} color={S.y} r={2.8}/>
      <Lbl x={100} y={8}>MÁX 2 TOQUES</Lbl>
    </>
  ),
  'Estiramientos y vuelta a la calma': (
    <>
      <Bg/>
      {[40,80,120,160].map(cx => (
        <g key={cx}>
          <Player x={cx} y={40} color={S.r} r={4}/>
          <Player x={cx} y={85} color={S.r} r={4}/>
          <path d={`M ${cx} 44 L ${cx} 60`} stroke={S.w} strokeWidth={0.8} strokeLinecap="round"/>
          <path d={`M ${cx-4} 60 L ${cx+4} 60`} stroke={S.w} strokeWidth={0.8} strokeLinecap="round"/>
          <path d={`M ${cx} 89 L ${cx} 105`} stroke={S.w} strokeWidth={0.8} strokeLinecap="round"/>
          <path d={`M ${cx-4} 105 L ${cx+4} 105`} stroke={S.w} strokeWidth={0.8} strokeLinecap="round"/>
        </g>
      ))}
      <Lbl x={100} y={16}>🧘 ESTIRAMIENTOS</Lbl>
      <text x="100" y="122" fill={S.w} fontSize="5" textAnchor="middle" opacity="0.7">10 min · respiración profunda</text>
    </>
  ),
}

// Alias para matchear el nombre exacto en el SQL seed
const ALIAS = {
  'Partido con presión 8" tras pérdida': 'Partido con presión 8 tras pérdida',
}

function pickGenerico(cat) {
  const key = (cat || '').toLowerCase()
  if (key.includes('portero')) return 'Reflejos + blocajes + 1v1'
  if (key.includes('finaliz')) return 'Finalización ante portero (2v1 / 3v2)'
  if (key.includes('balón parado') || key.includes('balon parado')) return 'Balón parado ofensivo (córners)'
  if (key.includes('transic')) return 'Transición 6 ataca vs 4 defiende (8s)'
  if (key.includes('presi')) return 'Partido con presión 8 tras pérdida'
  if (key.includes('poses')) return 'Rondo 5v2 con comodines'
  if (key.includes('partido')) return 'Partido condicionado'
  if (key.includes('calent') || key.includes('estiram')) return 'Calentamiento dinámico con balón'
  return 'Calentamiento dinámico con balón'
}

export default function DiagramaEjercicio({ nombre, categoria }) {
  const key = ALIAS[nombre] || nombre
  const dia = DIAG[key] || DIAG[pickGenerico(categoria)]
  return (
    <svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg"
      style={{ width:'100%', height:'100%', display:'block', borderRadius: 6 }}>
      <Defs/>
      {dia}
    </svg>
  )
}
