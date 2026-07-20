import { useNavigate } from 'react-router-dom'
import '../landing.css'
import PartnersStrip from '../components/PartnersStrip'

const CRUYFF_URL = 'https://www.cruyff-football.com'
const FAM_URL = 'https://www.instagram.com/famsoccer_/'

const ic = (inner) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{inner}</svg>
)
const IC = {
  cap: ic(<><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></>),
  globe: ic(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></>),
  chart: ic(<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>),
  badge: ic(<><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 22l4-2 4 2-1-8.5" /></>),
  users: ic(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5a3 3 0 010 6M18.5 20c0-2.5-1-4.6-2.5-5.6" /></>),
  spark: ic(<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />),
  rocket: ic(<><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 12l3 3M13.5 6.5c3-3 6.5-3 6.5-3s0 3.5-3 6.5l-4 4-4-4 4-3.5z" /><circle cx="15" cy="9" r="1.2" /></>),
  heart: ic(<path d="M12 20s-7-4.3-9.2-8.4C1.2 8.8 2.6 5.5 6 5.5c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.4 0 4.8 3.3 3.2 6.1C19 15.7 12 20 12 20z" />),
}
const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#042c28" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

function CruyffPanel() {
  return (
    <svg width="160" height="115" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
      <text x="102" y="112" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="800" fontSize="88" letterSpacing="-3"><tspan fill="#ffffff">c</tspan><tspan fill="#9c7f42">14</tspan></text>
      <text x="100" y="162" textAnchor="middle" fill="#ffffff" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fontSize="30" letterSpacing="9">CRUYFF</text>
      <text x="100" y="189" textAnchor="middle" fill="#ffffff" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fontSize="14.5" letterSpacing="8">FOOTBALL</text>
    </svg>
  )
}
function FamPanel() {
  return (
    <svg width="150" height="150" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs><path id="famTopPanel" d="M 26,100 A 74,74 0 0 1 174,100" fill="none" /></defs>
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
        <textPath href="#famTopPanel" startOffset="50%" textAnchor="middle">FAM SOCCER ACADEMY</textPath>
      </text>
      <text x="100" y="150" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fontSize="16" letterSpacing="3" fill="#35d67f">2024</text>
    </svg>
  )
}

function Feat({ icon, t, s }) {
  return (
    <div className="kg-feat"><span className="kg-ic">{icon}</span><div><div className="kg-ft">{t}</div><div className="kg-fs">{s}</div></div></div>
  )
}
function Quote({ stars = 5, text, iniciales, nombre, rol }) {
  return (
    <div className="kg-q">
      <div className="kg-stars">{'★'.repeat(stars)}</div>
      <p>{text}</p>
      <div className="kg-who"><div className="kg-av">{iniciales}</div><div><div className="kg-n">{nombre}</div><div className="kg-r">{rol}</div></div></div>
    </div>
  )
}

export default function Formacion() {
  const navigate = useNavigate()
  return (
    <div className="kg-landing">
      {/* NAV */}
      <nav>
        <a className="nav-logo" href="/" style={{ cursor: 'pointer' }}>
          <div className="nav-logo-icon">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="5" height="24" rx="1.5" fill="#2dd4bf" />
              <path d="M11 16 L24 4 L31 4 L17 16 Z" fill="#2dd4bf" />
              <path d="M11 16 L17 16 L31 28 L24 28 Z" fill="#f59e0b" />
            </svg>
          </div>
          <span className="nav-wordmark">KICK<em>AND</em>GO</span>
        </a>
        <ul className="nav-links">
          <li><a href="/">Inicio</a></li>
          <li><a href="/#funciones">Funciones</a></li>
          <li><a href="/#precios">Precios</a></li>
        </ul>
        <div className="nav-right">
          <button className="btn-login" onClick={() => navigate('/login')}>Iniciar sesión</button>
          <button className="btn-cta-nav" onClick={() => navigate('/?login=1')}>Empezar gratis</button>
        </div>
      </nav>

      {/* HERO / INTRO */}
      <div className="kg-form-hero">
        <div className="kg-eyebrow">Formación · Ecosistema Kick and Go</div>
        <h1>Los grandes entrenadores <em>nunca dejan de aprender</em></h1>
        <p className="kg-form-intro">Dirigir un equipo es mucho más que alinear once nombres. Por eso nos aliamos con las mejores escuelas y academias del fútbol: para que sigas creciendo como técnico y lleves a tu equipo donde otros no llegan. Esto es lo que significa formar parte del ecosistema.</p>
      </div>

      {/* FRANJA DINÁMICA */}
      <PartnersStrip />

      {/* PARTNER 1 — CRUYFF */}
      <div className="kg-feature">
        <div className="kg-flogo navy"><CruyffPanel /></div>
        <div className="kg-fbody">
          <span className="kg-ftag">◆ Partner oficial de metodología</span>
          <h2>Cruyff Football</h2>
          <p>La metodología que llevó al fútbol a otro nivel, ahora a tu alcance. Aprende los principios de juego, la lectura táctica y el desarrollo del jugador que definen a Cruyff Football — una referencia mundial en formación de entrenadores.</p>
          <div className="kg-feats">
            <Feat icon={IC.cap} t="Metodología de élite" s="Principios de juego reconocidos en todo el mundo" />
            <Feat icon={IC.globe} t="100% online" s="A tu ritmo, desde cualquier lugar" />
            <Feat icon={IC.chart} t="Desarrollo del jugador" s="Herramientas para hacer crecer a tu plantilla" />
            <Feat icon={IC.badge} t="Sello de prestigio" s="Formación con una marca de referencia" />
          </div>
          <a className="kg-cta" href={CRUYFF_URL} target="_blank" rel="noreferrer">Descubre la formación {arrow}</a>
        </div>
      </div>

      {/* PARTNER 2 — FAM */}
      <div className="kg-feature">
        <div className="kg-flogo dark"><FamPanel /></div>
        <div className="kg-fbody">
          <span className="kg-ftag">★ Academia partner · desde 2024</span>
          <h2>FAM Soccer Academy</h2>
          <p>Como su nombre indica, FAM es familia. Una academia joven nacida en 2024 con una idea clara: el fútbol se aprende mejor en comunidad. Formación cercana, moderna y con identidad propia, centrada en el desarrollo individual del jugador y en crear una auténtica familia futbolística dentro y fuera del campo.</p>
          <div className="kg-feats">
            <Feat icon={IC.users} t="Comunidad primero" s="Valores de familia y equipo en cada sesión" />
            <Feat icon={IC.spark} t="Desarrollo individual" s="Cada jugador crece a su ritmo" />
            <Feat icon={IC.rocket} t="Metodología moderna" s="Un proyecto joven y en plena expansión" />
            <Feat icon={IC.heart} t="Identidad propia" s="Una forma de entender el fútbol distinta" />
          </div>
          <a className="kg-cta" href={FAM_URL} target="_blank" rel="noreferrer">Síguelos en Instagram {arrow}</a>
        </div>
      </div>

      {/* TESTIMONIOS */}
      <div className="kg-testi">
        <h3>Lo que dicen los entrenadores</h3>
        <div className="kg-testi-sub">Técnicos que ya combinan formación y gestión con Kick and Go</div>
        <div className="kg-testi-cards">
          <Quote text="“Me formé para dar el salto y ahora gestiono todo el equipo desde una sola app. Se nota el cambio en el vestuario.”" iniciales="DM" nombre="David M." rol="Entrenador juvenil" />
          <Quote text="“El nivel de la metodología es brutal y tenerlo enlazado con mis entrenos y estadísticas lo cambia todo.”" iniciales="LR" nombre="Laura R." rol="2ª RFEF femenina" />
          <Quote text="“Pasé de improvisar a tener un plan. Formación seria + una herramienta seria. Justo lo que buscaba.”" iniciales="JC" nombre="Jordi C." rol="Fútbol 7 amateur" />
        </div>
        <div style={{ textAlign: 'center' }}><a className="kg-back" href="/">← Volver al inicio</a></div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">KICK<em>AND</em>GO</div>
        <div className="footer-links">
          <a href="/privacidad">Privacidad</a>
          <a href="/terminos">Términos</a>
          <a href="mailto:kickandgoapp@gmail.com">Contacto</a>
        </div>
        <div>© 2026 KickandGo. Todos los derechos reservados.</div>
      </footer>
    </div>
  )
}
