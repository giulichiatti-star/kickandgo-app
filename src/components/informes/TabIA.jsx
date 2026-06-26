import { useMemo } from 'react'
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { SecH, TTip } from './shared'

export default function TabIA({ partidos, sel, entrenos, liga, rl, positivos, amejorar, d, navigate }) {

  const evolucion = useMemo(() => {
    const meses = {}
    ;[...partidos].reverse().forEach(p => {
      if (!p.fecha) return
      const mes = p.fecha.slice(0, 7)
      if (!meses[mes]) meses[mes] = { mes, pts: 0, gf: 0, gc: 0, pj: 0 }
      meses[mes].pj++
      meses[mes].gf += p.gf || 0
      meses[mes].gc += p.gc || 0
      meses[mes].pts += p.gf > p.gc ? 3 : p.gf === p.gc ? 1 : 0
    })
    return Object.values(meses).map(m => ({
      ...m,
      label: new Date(m.mes + '-01').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
    }))
  }, [partidos])

  const radarData = useMemo(() => {
    if (!partidos.length) return []
    const tot = partidos.length
    const avgGF = partidos.reduce((a, p) => a + (p.gf || 0), 0) / tot
    const avgGC = partidos.reduce((a, p) => a + (p.gc || 0), 0) / tot
    const winPct = Math.round(partidos.filter(p => p.gf > p.gc).length / tot * 100)
    const locales = partidos.filter(p => p.local_visitante === 'local')
    const localW = locales.length ? Math.round(locales.filter(p => p.gf > p.gc).length / locales.length * 100) : 50
    const clean = Math.round(partidos.filter(p => p.gc === 0).length / tot * 100)
    const rivalGF = sel.gc
    const rivalGC = sel.gf
    const rivalAtt = Math.min(99, Math.round(rivalGF * 18))
    const rivalDef = Math.max(10, Math.round(100 - rivalGC * 20))
    return [
      { attr: 'Ataque',       nos: Math.min(99, Math.round(avgGF * 20)),          rival: rivalAtt },
      { attr: 'Defensa',      nos: Math.min(99, Math.round(clean * 0.7 + 30)),     rival: rivalDef },
      { attr: 'Local',        nos: localW,                                          rival: 50 },
      { attr: 'Efectividad',  nos: winPct,                                          rival: Math.max(10, 100 - winPct) },
      { attr: 'Goles/PJ',     nos: Math.min(99, Math.round(avgGF * 18)),            rival: Math.min(99, Math.round(avgGC * 14)) },
    ]
  }, [partidos, sel])

  const correlacion = useMemo(() => {
    if (!partidos.length) return []
    return [...partidos].reverse().slice(0, 8).map((p, i) => {
      const fechaPart = p.fecha ? new Date(p.fecha) : null
      const tuvoEntreno = fechaPart ? entrenos.some(e => {
        if (!e.fecha) return false
        const fe = new Date(e.fecha)
        const diff = (fechaPart - fe) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 7
      }) : false
      return {
        label: `P${i + 1}`, rival: p.rival || '—',
        gf: p.gf || 0, gc: p.gc || 0,
        pts: p.gf > p.gc ? 3 : p.gf === p.gc ? 1 : 0,
        entreno: tuvoEntreno ? 1 : 0,
        color: p.gf > p.gc ? '#34d399' : p.gf === p.gc ? '#f59e0b' : '#f87171',
      }
    })
  }, [partidos, entrenos])

  const prediccion = useMemo(() => {
    const u5 = partidos.slice(0, 5)
    if (!u5.length) return null
    const forma = u5.filter(p => p.gf > p.gc).length / u5.length
    const avgGC = u5.reduce((a, p) => a + (p.gc || 0), 0) / u5.length
    const defensa = Math.max(0, 1 - avgGC / 3)
    const base = Math.round((forma * 0.6 + defensa * 0.4) * 100)
    const proximo = liga?.proximas_fechas?.[0]
    return {
      rival: proximo ? (proximo.local || proximo.visitante || 'Próximo rival') : 'Próximo rival',
      fecha: proximo?.fecha || null,
      escenario_opt:  Math.min(99, base + 12),
      escenario_norm: Math.min(95, base),
      escenario_pes:  Math.max(10, base - 18),
    }
  }, [partidos, liga])

  const recomendacion = useMemo(() => {
    if (!partidos.length) return null
    const u5 = partidos.slice(0, 5)
    const avgGC = u5.reduce((a, p) => a + (p.gc || 0), 0) / Math.max(u5.length, 1)
    const avgGF = u5.reduce((a, p) => a + (p.gf || 0), 0) / Math.max(u5.length, 1)
    const derrotas = u5.filter(p => p.gc > p.gf).length
    if (avgGC >= 2)    return { foco: 'Defensa',         desc: 'Encajáis más de 2 goles por partido. Sesión de bloque defensivo y coberturas.',               impacto: '+10% en solidez defensiva',     col: '#60a5fa' }
    if (avgGF < 1)     return { foco: 'Finalización',    desc: 'Menos de 1 gol por partido. Trabajar definición y creación de ocasiones.',                    impacto: '+8% en efectividad ofensiva',   col: '#f59e0b' }
    if (derrotas >= 3) return { foco: 'Trabajo conjunto',desc: '3+ derrotas en los últimos 5 partidos. Partido de entrenamiento interno para recuperar confianza.', impacto: '+15% en confianza grupal', col: '#a78bfa' }
    return { foco: 'Mantener nivel', desc: 'Buenos resultados recientes. Sesión de mantenimiento con posesión y partido condicionado.', impacto: 'Consolidar la racha positiva', col: '#34d399' }
  }, [partidos])

  const chartOpts = { style: { background: 'transparent' } }

  return (
    <div className="space-y-4">
      <div className="inf-box p-4">
        <SecH col="#a78bfa">Resumen del partido</SecH>
        <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.7 }}>
          <p>Resultado: <b style={{ color: rl.c }}>{sel.gf}-{sel.gc} ({rl.l.toLowerCase()})</b> vs <b style={{ color: '#fff' }}>{sel.rival || 'el rival'}</b> · {sel.local_visitante || 'local'}.</p>
          {d.goleadores.length > 0 && <p style={{ marginTop: 6 }}>Goleadores: {d.goleadores.map(([n, c]) => `${n} (${c})`).join(', ')}.</p>}
          <div className="flex gap-4 mt-3 flex-wrap">
            {positivos.slice(0, 2).map((p, i) => <div key={i} style={{ fontSize: 11, color: '#34d399' }}>✓ {p.t}</div>)}
            {amejorar.filter(a => a.t !== 'Sin alertas').slice(0, 2).map((p, i) => <div key={i} style={{ fontSize: 11, color: '#f87171' }}>⚠ {p.t}</div>)}
          </div>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>

        <div className="inf-box p-4">
          <SecH col="#2dd4bf">Evolución mes a mes</SecH>
          {evolucion.length < 2
            ? <p style={{ fontSize: 11, color: '#52525b' }}>Necesitas partidos de al menos 2 meses distintos.</p>
            : <ResponsiveContainer width="100%" height={180}>
                <LineChart data={evolucion} {...chartOpts}>
                  <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TTip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#71717a' }} />
                  <Line type="monotone" dataKey="pts" name="Puntos" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 4, fill: '#2dd4bf' }} />
                  <Line type="monotone" dataKey="gf" name="Goles F" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                  <Line type="monotone" dataKey="gc" name="Goles C" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="inf-box p-4">
          <SecH col="#60a5fa">Tu equipo vs {sel.rival || 'Rival'}</SecH>
          {radarData.length < 2
            ? <p style={{ fontSize: 11, color: '#52525b' }}>Sin datos suficientes.</p>
            : <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData} {...chartOpts}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="attr" tick={{ fill: '#71717a', fontSize: 9 }} />
                  <Radar name="Nosotros" dataKey="nos" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name={sel.rival || 'Rival'} dataKey="rival" stroke="#f87171" fill="#f87171" fillOpacity={0.1} strokeWidth={1.5} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#71717a' }} />
                  <Tooltip content={<TTip />} />
                </RadarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="inf-box p-4">
          <SecH col="#f59e0b">Puntos por partido</SecH>
          {correlacion.length === 0
            ? <p style={{ fontSize: 11, color: '#52525b' }}>Sin partidos aún.</p>
            : <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={correlacion} {...chartOpts} barSize={18}>
                  <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                        <div style={{ color: '#fff', fontWeight: 700 }}>{d.rival}</div>
                        <div style={{ color: '#71717a' }}>{d.gf}-{d.gc} · {d.pts} pts</div>
                        {d.entreno ? <div style={{ color: '#34d399', fontSize: 10 }}>✓ Entrenó esa semana</div> : <div style={{ color: '#52525b', fontSize: 10 }}>Sin entreno previo</div>}
                      </div>
                    )
                  }} />
                  <Bar dataKey="pts" name="Puntos" radius={[4, 4, 0, 0]}>
                    {correlacion.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-2 flex-wrap">
                {[['#34d399', 'Victoria (3 pts)'], ['#f59e0b', 'Empate (1 pt)'], ['#f87171', 'Derrota (0 pts)']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#71717a' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
                  </div>
                ))}
              </div>
            </>
          }
        </div>

        <div className="inf-box p-4">
          <SecH col="#a78bfa">Predicción IA — Próximo partido</SecH>
          {!prediccion
            ? <p style={{ fontSize: 11, color: '#52525b' }}>Juega más partidos para generar predicciones.</p>
            : <>
              {prediccion.rival && (
                <div style={{ fontSize: 11, color: '#52525b', marginBottom: 12 }}>
                  {prediccion.rival}{prediccion.fecha ? ` · ${prediccion.fecha}` : ''}
                </div>
              )}
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                {[
                  { label: 'Óptimo',    val: prediccion.escenario_opt,  sub: 'Con buen entreno previo', col: '#34d399' },
                  { label: 'Normal',    val: prediccion.escenario_norm, sub: 'Nivel actual',             col: '#2dd4bf' },
                  { label: 'Pesimista', val: prediccion.escenario_pes,  sub: 'Sin preparación',         col: '#f87171' },
                ].map(sc => (
                  <div key={sc.label} style={{ borderRadius: 10, padding: '10px 8px', textAlign: 'center', background: `${sc.col}08`, border: `1px solid ${sc.col}25` }}>
                    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: sc.col, marginBottom: 4 }}>{sc.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: sc.col, lineHeight: 1 }}>{sc.val}%</div>
                    <div style={{ fontSize: 9, color: '#52525b', marginTop: 4 }}>Victoria</div>
                    <div style={{ fontSize: 8, color: '#52525b', marginTop: 3 }}>{sc.sub}</div>
                  </div>
                ))}
              </div>
            </>
          }
        </div>
      </div>

      {recomendacion && (
        <div className="inf-box p-4" style={{ borderColor: `${recomendacion.col}30`, borderLeftWidth: 3, borderLeftColor: recomendacion.col }}>
          <SecH col={recomendacion.col}>Recomendación estratégica</SecH>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6 }}>⚡ Sesión enfocada: {recomendacion.foco}</div>
          <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.6, marginBottom: 12 }}>{recomendacion.desc}</div>
          <div style={{ fontSize: 11, color: recomendacion.col, fontWeight: 700, marginBottom: 14 }}>Impacto esperado: {recomendacion.impacto}</div>
          <button
            onClick={() => {
              const msg = `Crea una sesión de entrenamiento con foco en ${recomendacion.foco}. ${recomendacion.desc} Duración: 90 minutos.`
              navigate('/asistente', { state: { prompt: msg } })
            }}
            className="w-full rounded-xl py-2.5 text-[12px] font-black tracking-wide text-white border-0 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${recomendacion.col}cc, ${recomendacion.col}88)` }}>
            ⚡ CREAR SESIÓN CON ASISTENTE IA
          </button>
        </div>
      )}
    </div>
  )
}
