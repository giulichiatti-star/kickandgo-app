export default function PWAInstallBanner({ onInstalar, onDescartar }) {
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9000,
      background: '#18181b', border: '1px solid #27272a',
      borderLeft: '3px solid #f59e0b',
      borderRadius: 12, padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      maxWidth: 440, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>📲</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>
            Úsala en el campo sin internet
          </div>
          <div style={{ fontSize: 11, color: '#a1a1aa', lineHeight: 1.5 }}>
            Instala la app y ábrela una vez con cobertura. Luego podrás registrar el partido en vivo aunque no tengas señal.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button
          onClick={onDescartar}
          style={{ fontSize: 11, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>
          Ahora no
        </button>
        <button
          onClick={onInstalar}
          style={{
            fontSize: 12, fontWeight: 700, color: '#000',
            background: '#f59e0b', border: 'none', borderRadius: 8,
            padding: '8px 16px', cursor: 'pointer',
          }}>
          Instalar →
        </button>
      </div>
    </div>
  )
}
