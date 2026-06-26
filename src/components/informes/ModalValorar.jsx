const NOTA_COL = (n) => n >= 8 ? '#34d399' : n >= 6 ? '#f59e0b' : '#f87171'
const NOTA_LBL = { 10: '⭐ Sobresaliente', 9: 'Excelente', 8: 'Muy bien', 7: 'Bien', 6: 'Correcto', 5: 'Regular', 4: 'Mal', 3: 'Muy mal', 2: 'Pésimo', 1: 'No jugó' }

export default function ModalValorar({ jugadores, gf, gc, rival, valoraciones, onChange, onGuardar, onCerrar }) {
  function set(id, val) { onChange(prev => ({ ...prev, [id]: val })) }
  const completados = Object.values(valoraciones).filter(v => v != null).length

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#18181b', border: '1px solid #27272a', maxHeight: '92vh' }}>
        <div className="px-5 pt-5 pb-4 border-b border-borde flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-extrabold">⭐ Valorar jugadores</div>
            <button onClick={onCerrar} className="text-muted text-lg leading-none">✕</button>
          </div>
          <div className="text-[11px] text-muted">
            <span style={{ color: gf > gc ? '#34d399' : gf < gc ? '#f87171' : '#f59e0b', fontWeight: 700 }}>{gf}-{gc}</span> vs {rival}
            {' · '}Marca también a jugadores que entraron desde el banco
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
            <div style={{ width: `${jugadores.length ? (completados / jugadores.length) * 100 : 0}%`, height: '100%', background: '#2dd4bf', transition: 'width .3s' }} />
          </div>
          <div className="text-[10px] text-muted mt-1">{completados}/{jugadores.length} valorados</div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {jugadores.map((j) => {
            const nota = valoraciones[j.id]
            return (
              <div key={j.id} style={{ background: nota != null ? `${NOTA_COL(nota)}08` : '#131316', border: `1px solid ${nota != null ? NOTA_COL(nota) + '30' : '#27272a'}`, borderRadius: 10, padding: '10px 12px' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
                      style={{ background: nota != null ? NOTA_COL(nota) + '20' : '#27272a', color: nota != null ? NOTA_COL(nota) : '#71717a' }}>
                      {j.dorsal}
                    </span>
                    <span className="text-sm font-semibold">{j.nombre}</span>
                    <span className="text-[10px] text-muted">{j.posicion}</span>
                  </div>
                  {nota != null && <span className="text-[10px] font-black" style={{ color: NOTA_COL(nota) }}>{nota} — {NOTA_LBL[nota]}</span>}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button key={n} onClick={() => set(j.id, nota === n ? undefined : n)}
                      className="flex-1 min-w-[28px] py-1.5 rounded text-[12px] font-black transition"
                      style={{
                        background: nota === n ? NOTA_COL(n) : 'rgba(255,255,255,0.04)',
                        color: nota === n ? '#000' : n >= 8 ? '#34d399' : n >= 6 ? '#f59e0b' : '#f87171',
                        border: `1px solid ${nota === n ? NOTA_COL(n) : 'rgba(255,255,255,0.08)'}`,
                      }}>{n}</button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-borde flex-shrink-0">
          <button className="btn btn-outline flex-1 text-xs" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primary flex-1 text-xs" onClick={onGuardar}>💾 Guardar valoraciones</button>
        </div>
      </div>
    </div>
  )
}
