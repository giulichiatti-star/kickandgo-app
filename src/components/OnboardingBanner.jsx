export default function OnboardingBanner({ icono, titulo, pasos, storageKey, onDismiss }) {
  function cerrar() {
    localStorage.setItem(storageKey, '1')
    onDismiss?.()
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #18181b 0%, #1a2235 100%)',
      border: '1px solid #10b98140',
      borderLeft: '4px solid #10b981',
      borderRadius: 16,
      padding: '20px 20px 16px',
      marginBottom: 24,
      position: 'relative',
    }}>
      {/* Dismiss */}
      <button
        onClick={cerrar}
        style={{
          position: 'absolute', top: 12, right: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 16, color: '#52525b', lineHeight: 1,
        }}>✕</button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #10b98130, #10b98110)',
          border: '1px solid #10b98140',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>{icono}</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>
            ¿Cómo empezar?
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fafafa' }}>{titulo}</div>
        </div>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {pasos.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
              background: '#10b98120', border: '1px solid #10b98140',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, color: '#10b981',
            }}>{i + 1}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, paddingTop: 2 }}>{p}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button
        onClick={cerrar}
        style={{
          fontSize: 11, color: '#52525b', background: 'none',
          border: 'none', cursor: 'pointer', padding: 0,
          textDecoration: 'underline',
        }}>
        Ya lo entendí, no mostrar de nuevo
      </button>
    </div>
  )
}
