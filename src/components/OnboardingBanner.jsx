export default function OnboardingBanner({ titulo, descripcion, onAvanzar, onSaltar, paso, totalPasos = 4 }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #10b98115, #10b98108)',
      border: '1px solid #10b98140',
      borderLeft: '3px solid #10b981',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🏈</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Paso {paso} de {totalPasos}
          </span>
          <span style={{ fontSize: 10, color: '#3f3f46', fontWeight: 600 }}>
            {'●'.repeat(paso)}{'○'.repeat(totalPasos - paso)}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginBottom: 3 }}>{titulo}</div>
        <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>{descripcion}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={onSaltar}
          style={{ fontSize: 11, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>
          Saltar
        </button>
        <button
          onClick={onAvanzar}
          style={{
            fontSize: 11, fontWeight: 700, color: '#000',
            background: '#10b981', border: 'none', borderRadius: 8,
            padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
          Entendido →
        </button>
      </div>
    </div>
  )
}
