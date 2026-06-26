export default function PWAInstallBanner({ onInstalar, onDescartar }) {
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9000,
      background: '#18181b', border: '1px solid #27272a',
      borderLeft: '3px solid #f59e0b',
      borderRadius: 12, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      maxWidth: 440, margin: '0 auto',
    }}>
      <span style={{ fontSize: 22 }}>📲</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginBottom: 2 }}>
          Instala la app
        </div>
        <div style={{ fontSize: 11, color: '#71717a' }}>
          Úsala sin conexión en el campo
        </div>
      </div>
      <button
        onClick={onDescartar}
        style={{ fontSize: 11, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
        Ahora no
      </button>
      <button
        onClick={onInstalar}
        style={{
          fontSize: 11, fontWeight: 700, color: '#000',
          background: '#f59e0b', border: 'none', borderRadius: 8,
          padding: '7px 14px', cursor: 'pointer',
        }}>
        Instalar
      </button>
    </div>
  )
}
