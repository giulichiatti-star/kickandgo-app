import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { cargarResumenAdmin, computeResumen, eur } from '../../lib/adminResumen'

const CUPO_FUNDADORES = 50

function Kpi({ label, val, sub, color = '#fafafa', big }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className="font-extrabold leading-none" style={{ color, fontSize: big ? 26 : 18 }}>{val}</div>
      {sub && <div className="text-[10px] text-muted mt-1">{sub}</div>}
    </div>
  )
}

export default function TabResumen() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try { setDatos(await cargarResumenAdmin()) }
      catch (e) { setError(e.message) }
      finally { setCargando(false) }
    })()
  }, [])

  const r = useMemo(() => (datos ? computeResumen(datos) : null), [datos])

  if (cargando) return <div className="text-sm text-muted py-16 text-center">Cargando resumen…</div>
  if (error) return (
    <div className="card p-6 text-center">
      <div className="text-sm mb-2" style={{ color: '#f87171' }}>⚠️ {error}</div>
      <div className="text-[11px] text-muted">Si dice “permission denied”, ejecuta <b>migracion_informe_global.sql</b> en Supabase (da lectura admin).</div>
    </div>
  )
  if (!r) return null

  const { dinero, cuentas, embudo, churn, riesgo, tendencias } = r
  const maxPaso = embudo.pasos[0].n || 1

  return (
    <div className="space-y-5">
      {/* ── Dinero ── */}
      <div>
        <div className="text-xs font-bold text-muted uppercase tracking-wide mb-2">💰 Ingresos</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Kpi big label="MRR (ingreso mensual)" val={eur(dinero.mrr)} sub={`${cuentas.pagado} cuentas · ticket ${eur(dinero.ticketMedio)}`} color="#34d399" />
          <Kpi big label="ARR (anual proyectado)" val={eur(dinero.arr)} color="#60a5fa" />
          <Kpi label="Cobros próximos 7 días" val={eur(dinero.cobros7)} sub={`30 días: ${eur(dinero.cobros30)}`} color="#fafafa" />
          <Kpi label="En riesgo / perdido" val={eur(dinero.enRiesgoMonto)} sub={`Baja acumulada: ${eur(dinero.churnedMonto)}`} color={dinero.enRiesgoMonto ? '#f59e0b' : '#71717a'} />
        </div>
      </div>

      {/* ── Cuentas ── */}
      <div>
        <div className="text-xs font-bold text-muted uppercase tracking-wide mb-2">👥 Cuentas</div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <Kpi label="Activas" val={cuentas.activas} color="#4ade80" />
          <Kpi label="En prueba" val={cuentas.prueba} color="#60a5fa" />
          <Kpi label="Pagando" val={cuentas.pagado} color="#34d399" />
          <Kpi label="En mora" val={cuentas.mora} color={cuentas.mora ? '#f59e0b' : '#71717a'} />
          <Kpi label="Bajas" val={cuentas.baja} color={cuentas.baja ? '#f87171' : '#71717a'} />
          <Kpi label="Altas este mes" val={`+${cuentas.altasMes}`} color="#a78bfa" />
        </div>
        <div className="text-[11px] text-muted mt-2">
          Fundadores: <b style={{ color: cuentas.fundadores >= CUPO_FUNDADORES ? '#f87171' : '#f59e0b' }}>{cuentas.fundadores}</b> / {CUPO_FUNDADORES} cupo
          {cuentas.fundadores >= CUPO_FUNDADORES && <span className="ml-2 font-bold" style={{ color: '#f87171' }}>CUPO COMPLETO</span>}
        </div>
      </div>

      {/* ── Embudo + churn ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🔻 Embudo de conversión</div>
          <div className="space-y-2.5">
            {embudo.pasos.map((s, i) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-muted">{s.n} · {s.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div style={{ width: `${Math.max(2, (s.n / maxPaso) * 100)}%`, height: '100%', background: ['#a1a1aa', '#60a5fa', '#818cf8', '#34d399'][i], borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-muted mt-3">Conversión lead→cuenta: <b className="text-cyan">{embudo.convLeadCuenta}%</b> · prueba→pago: <b className="text-cyan">{embudo.convPruebaPago}%</b></div>
        </div>

        <div className="card p-4 flex flex-col">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📉 Churn (bajas)</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-extrabold" style={{ color: churn.churnPct >= 10 ? '#f87171' : churn.churnPct >= 5 ? '#f59e0b' : '#4ade80' }}>{churn.churnPct}%</div>
              <div className="text-[11px] text-muted mt-1">{churn.bajas} baja{churn.bajas === 1 ? '' : 's'} sobre el total facturable</div>
            </div>
            <div className="flex-1 text-[11px] text-muted leading-relaxed">
              {churn.churnPct >= 10
                ? 'Churn alto: revisa por qué se van (precio, uso, soporte).'
                : churn.churnPct > 0
                ? 'Churn bajo control. Vigila las cuentas en riesgo de abajo.'
                : 'Sin bajas todavía. ¡Bien!'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tendencias ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📈 Altas por mes</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tendencias}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#fafafa' }} />
              <Bar dataKey="altas" name="Altas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📊 Cuentas acumuladas</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={tendencias}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#fafafa' }} />
              <Line type="monotone" dataKey="acumulado" name="Total cuentas" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 3, fill: '#2dd4bf' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Cuentas en riesgo ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-muted uppercase tracking-wide">🚨 Cuentas en riesgo / dormidas</div>
          <span className="text-[11px] text-muted">{riesgo.length} detectada{riesgo.length === 1 ? '' : 's'}</span>
        </div>
        {riesgo.length === 0 ? (
          <div className="text-sm text-muted py-6 text-center">Ninguna cuenta en riesgo ahora mismo. 🎉</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr style={{ color: '#71717a', textAlign: 'left' }}>
                  <th className="pb-2 font-semibold">Club</th>
                  <th className="pb-2 font-semibold">Entrenador</th>
                  <th className="pb-2 font-semibold">Plan</th>
                  <th className="pb-2 font-semibold text-center">Últ. uso</th>
                  <th className="pb-2 font-semibold text-center">Jug</th>
                  <th className="pb-2 font-semibold text-center">Part</th>
                  <th className="pb-2 font-semibold">Señales</th>
                </tr>
              </thead>
              <tbody>
                {riesgo.map((x) => (
                  <tr key={x.id} style={{ borderTop: '1px solid #27272a' }}>
                    <td className="py-2 font-semibold">{x.club}</td>
                    <td className="py-2 text-muted">{x.entrenador}</td>
                    <td className="py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,.06)', color: x.plan === 'mora' ? '#f59e0b' : x.plan === 'prueba' ? '#60a5fa' : '#a1a1aa' }}>{x.plan}</span></td>
                    <td className="py-2 text-center" style={{ color: x.dias == null ? '#f87171' : x.dias >= 14 ? '#f59e0b' : '#a1a1aa' }}>{x.dias == null ? 'nunca' : `${x.dias}d`}</td>
                    <td className="py-2 text-center" style={{ color: x.jug === 0 ? '#f87171' : '#a1a1aa' }}>{x.jug}</td>
                    <td className="py-2 text-center" style={{ color: x.par === 0 ? '#f87171' : '#a1a1aa' }}>{x.par}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {x.senales.map((s, i) => (
                          <span key={i} className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.25)' }}>{s}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
