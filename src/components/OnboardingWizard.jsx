import { useState } from 'react'

const PASOS = [
  {
    icon: '⚽',
    titulo: 'Crea tu equipo',
    desc: 'Ve a <b>Ajustes</b> en el menú lateral. Escribe el nombre del club, elige el tipo (Fútbol 11 o 7) y sube el escudo. Pulsa Guardar.',
    pasos: [
      { t: 'Ve a <b>Ajustes</b> en el menú lateral', dest: true },
      { t: 'Escribe el nombre del club y elige el tipo de fútbol' },
      { t: 'Sube el escudo del equipo (opcional)' },
      { t: 'Pulsa <b>Guardar</b>' },
    ],
    visual: (
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: 9, color: '#52525b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Nombre del club</div>
        <div style={{ background: '#27272a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fafafa', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🛡️</span> Real Sporting CF
        </div>
        <div style={{ fontSize: 9, color: '#52525b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Tipo de equipo</div>
        <div style={{ background: '#27272a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Fútbol 11</span>
          <span style={{ background: '#10b98120', border: '1px solid #10b98140', color: '#10b981', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>✓ Seleccionado</span>
        </div>
      </div>
    ),
  },
  {
    icon: '👥',
    titulo: 'Añade tus jugadores',
    desc: 'Ve a <b>Plantilla</b> y pulsa <b style="color:#10b981">+ Jugador</b>. Rellena nombre, dorsal y posición. Añade mínimo 11 jugadores para cubrir la alineación.',
    pasos: [
      { t: 'Ve a <b>Plantilla</b> en el menú lateral', dest: true },
      { t: 'Pulsa <b>+ Jugador</b> (botón verde arriba a la derecha)' },
      { t: 'Rellena nombre, dorsal, posición y pie' },
      { t: 'Repite para todos los titulares habituales (mín. 11)' },
    ],
    visual: (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { num: '9', name: 'Carlos Méndez', pos: 'Delantero', col: '#10b981' },
          { num: '4', name: 'Javi Torres', pos: 'Central', col: '#3b82f6' },
          { num: '8', name: 'Marco Silva', pos: 'Mediocampista', col: '#8b5cf6', op: 0.5 },
        ].map((j) => (
          <div key={j.num} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '8px 10px', opacity: j.op || 1 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: j.col + '20', border: `1px solid ${j.col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: j.col }}>{j.num}</div>
            <div>
              <div style={{ fontSize: 11, color: '#fafafa', fontWeight: 600 }}>{j.name}</div>
              <div style={{ fontSize: 9, color: '#52525b' }}>{j.pos}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '📋',
    titulo: 'Prepara la convocatoria',
    desc: 'Antes de cada partido ve a <b>Convocatoria</b>. Toca cada jugador para marcarlo como titular o suplente, elige la formación y pulsa Guardar. El mapa del partido en vivo la cargará automáticamente.',
    pasos: [
      { t: 'Ve a <b>Convocatoria</b> en el menú lateral', dest: true },
      { t: 'Toca cada jugador para marcarlo como titular o suplente' },
      { t: 'Elige la <b>formación táctica</b> (4-3-3, 4-4-2…)' },
      { t: 'Pulsa <b>Guardar convocatoria</b>' },
    ],
    visual: (
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', width: '100%' }}>
        <div style={{ width: 120, height: 80, background: '#1a3a1a', border: '1px solid #2a5a2a', borderRadius: 8, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#2a5a2a' }} />
          {[['50%','12%'],['20%','42%'],['50%','42%'],['80%','42%'],['35%','70%'],['65%','70%']].map(([l,t],i) => (
            <div key={i} style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '1px solid #18181b', left: l, top: t, transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: '#27272a', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: '#fafafa', marginBottom: 8 }}>4-3-3 ▾</div>
          <div style={{ background: '#10b981', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 800, color: '#000', textAlign: 'center' }}>💾 Guardar convocatoria</div>
        </div>
      </div>
    ),
  },
  {
    icon: '⚡',
    titulo: 'Partido en vivo',
    desc: 'Ve a <b>En Vivo</b>. Verás el mapa con tu convocatoria. Pulsa <b style="color:#10b981">▶ Iniciar</b>, toca un jugador en el mapa y registra goles, tarjetas y cambios. Al terminar pulsa Finalizar.',
    pasos: [
      { t: 'Ve a <b>En Vivo</b> en el menú lateral', dest: true },
      { t: 'Pulsa <b>▶ Iniciar</b> para arrancar el cronómetro' },
      { t: 'Toca un jugador en el mapa → elige la acción (gol, tarjeta, cambio…)' },
      { t: 'Al finalizar pulsa <b>Finalizar</b> para guardar el partido' },
    ],
    visual: (
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Real Sporting<br /><small style={{ color: '#10b981', fontSize: 9 }}>LOCAL</small></div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fafafa' }}>2 <span style={{ color: '#52525b', fontSize: 18 }}>-</span> 1</div>
            <div style={{ fontSize: 9, color: '#10b981', fontWeight: 800 }}>▶ 67'</div>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Rival FC<br /><small style={{ color: '#52525b', fontSize: 9 }}>VISITANTE</small></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
          {['⚽ Gol', '🟨 Amarilla', '🔄 Cambio', '🎯 Corner'].map(e => (
            <span key={e} style={{ background: '#10b98120', border: '1px solid #10b98140', borderRadius: 20, padding: '4px 10px', fontSize: 10, color: '#10b981', fontWeight: 700 }}>{e}</span>
          ))}
        </div>
      </div>
    ),
  },
]

const KEY = 'kg_wizard_done'

export function useWizard() {
  const [open, setOpen] = useState(() => !localStorage.getItem(KEY))
  function abrir() { setOpen(true) }
  function cerrar() { localStorage.setItem(KEY, '1'); setOpen(false) }
  return { open, abrir, cerrar }
}

export default function OnboardingWizard({ open, onCerrar }) {
  const [paso, setPaso] = useState(0)
  const p = PASOS[paso]
  const esUltimo = paso === PASOS.length - 1

  function next() { esUltimo ? onCerrar() : setPaso(paso + 1) }
  function prev() { setPaso(paso - 1) }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onCerrar}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#18181b', border: '1px solid #27272a',
          borderRadius: 20, width: '100%', maxWidth: 480,
          overflow: 'hidden',
        }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f1a14, #0f1520)', borderBottom: '1px solid #27272a', padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: '#10b98120', border: '1px solid #10b98140', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {p.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 3 }}>
              Paso {paso + 1} de {PASOS.length}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fafafa' }}>{p.titulo}</div>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#52525b', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Barra progreso */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0' }}>
          {PASOS.map((_, i) => (
            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= paso ? '#10b981' : '#27272a', transition: 'background .3s' }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          {/* Visual */}
          <div style={{ background: '#0f0f11', border: '1px solid #27272a', borderRadius: 12, padding: 16, marginBottom: 14, minHeight: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {p.visual}
          </div>

          {/* Descripción */}
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65, marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: p.desc }} />

          {/* Pasos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.pasos.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: s.dest ? '#10b98108' : '#ffffff06', border: `1px solid ${s.dest ? '#10b98130' : '#27272a'}`, borderRadius: 10, padding: '9px 12px' }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: '#10b98120', border: '1px solid #10b98140', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#10b981' }}>{i + 1}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }} dangerouslySetInnerHTML={{ __html: s.t }} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 20px', alignItems: 'center' }}>
          <button onClick={onCerrar} style={{ fontSize: 11, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 4, flexShrink: 0 }}>
            Saltar guía
          </button>
          {paso > 0 && (
            <button onClick={prev} style={{ background: '#27272a', color: '#94a3b8', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 10, padding: '11px 16px', cursor: 'pointer' }}>
              ← Atrás
            </button>
          )}
          <button onClick={next} style={{ flex: 1, background: '#10b981', color: '#000', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 10, padding: 12, cursor: 'pointer' }}>
            {esUltimo ? '¡Empezar! →' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}
