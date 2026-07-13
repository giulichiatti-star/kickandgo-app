import { useMemo } from 'react'
import { COLOR_CAT } from '../lib/entrenamientos'

function catDe(ej) { return ej.categoria || ej.cat || 'General' }
function minDe(ej) { return ej.duracion_min || ej.min || 0 }
function intDe(ej) { return ej.intensidad || 'Media' }

function isoSemana(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00')
  const dia = (d.getDay() + 6) % 7 // lunes=0
  d.setDate(d.getDate() - dia)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fCortaSemana(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function InformesEntrenos({ entrenos, jugadores }) {
  const stats = useMemo(() => {
    const sesiones = entrenos.filter(e => (e.ejercicios || []).length > 0)
    const totalMin = sesiones.reduce((a, e) => a + (e.duracion || (e.ejercicios || []).reduce((s, x) => s + minDe(x), 0)), 0)

    const porCat = new Map() // cat -> { min, count }
    const porInt = { Baja: 0, Media: 0, Alta: 0 }
    let totalEjercicios = 0
    sesiones.forEach(e => {
      (e.ejercicios || []).forEach(ej => {
        const c = catDe(ej), m = minDe(ej), i = intDe(ej)
        const acc = porCat.get(c) || { min: 0, count: 0 }
        acc.min += m; acc.count += 1
        porCat.set(c, acc)
        if (porInt[i] != null) porInt[i] += 1
        totalEjercicios += 1
      })
    })
    const categorias = Array.from(porCat.entries())
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.min - a.min)

    // Tendencia: últimas 8 semanas con datos
    const porSemana = new Map()
    sesiones.forEach(e => {
      if (!e.fecha) return
      const sem = isoSemana(e.fecha)
      const min = e.duracion || (e.ejercicios || []).reduce((s, x) => s + minDe(x), 0)
      porSemana.set(sem, (porSemana.get(sem) || 0) + min)
    })
    const semanas = Array.from(porSemana.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([sem, min]) => ({ sem, min }))

    // Sugerencias basadas en reglas simples
    const sugerencias = []
    const hace14 = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
    const recientes = sesiones.filter(e => e.fecha >= hace14)
    if (recientes.length === 0 && sesiones.length > 0) {
      sugerencias.push({ tipo: 'aviso', texto: 'No hay entrenos registrados en los últimos 14 días — actualiza el plan de la semana.' })
    }
    const altasRecientes = recientes.flatMap(e => e.ejercicios || []).filter(ej => intDe(ej) === 'Alta').length
    if (altasRecientes >= 5) {
      sugerencias.push({ tipo: 'aviso', texto: `${altasRecientes} ejercicios de intensidad Alta en los últimos 14 días — valora incluir una sesión de recuperación.` })
    }
    if (categorias.length >= 3) {
      const totalCatMin = categorias.reduce((a, c) => a + c.min, 0)
      const menor = categorias[categorias.length - 1]
      if (totalCatMin > 0 && menor.min / totalCatMin < 0.08) {
        sugerencias.push({ tipo: 'info', texto: `"${menor.cat}" apenas se trabaja (${Math.round(menor.min / totalCatMin * 100)}% del tiempo total) — podría faltar variedad ahí.` })
      }
      const finalizacion = porCat.get('Finalización')
      if (!finalizacion || finalizacion.min / totalCatMin < 0.1) {
        sugerencias.push({ tipo: 'info', texto: 'Poco trabajo de Finalización respecto al resto — si faltan goles en los partidos, priorízalo.' })
      }
    }
    if (sesiones.length >= 5 && semanas.length >= 2) {
      const ultima = semanas[semanas.length - 1].min, previa = semanas[semanas.length - 2].min
      if (previa > 0 && ultima < previa * 0.5) {
        sugerencias.push({ tipo: 'aviso', texto: 'La carga de esta semana cayó más del 50% respecto a la anterior — confirma que no falten sesiones por cargar.' })
      }
    }
    // Asistencia por jugador: asistencia = { [jugadorId]: true|false } (checkbox,
    // ver AsistenciaPanel en Entrenamientos.jsx). Solo cuentan las sesiones donde
    // se tomó lista (al menos un jugador marcado); en esas, true = asistió,
    // false o ausente del objeto = no asistió.
    const sesionesConLista = sesiones.filter(e => Object.keys(e.asistencia || {}).length > 0)
    const porJugador = new Map() // id -> { ok, no, ultimaAsistio }
    sesionesConLista.forEach(e => {
      (jugadores || []).forEach(j => {
        const acc = porJugador.get(j.id) || { ok: 0, no: 0, ultimaAsistio: null }
        if (e.asistencia[j.id] === true) { acc.ok += 1; if (!acc.ultimaAsistio || e.fecha > acc.ultimaAsistio) acc.ultimaAsistio = e.fecha }
        else acc.no += 1
        porJugador.set(j.id, acc)
      })
    })
    const jugadoresConDatos = (jugadores || [])
      .map(j => {
        const a = porJugador.get(j.id) || { ok: 0, no: 0, ultimaAsistio: null }
        const registrado = a.ok + a.no
        return {
          id: j.id, nombre: j.nombre, dorsal: j.dorsal,
          ...a, registrado,
          pct: registrado ? Math.round((a.ok / registrado) * 100) : null,
        }
      })
      .filter(j => j.registrado > 0)
      .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1))

    if (jugadoresConDatos.length >= 3) {
      const bajos = jugadoresConDatos.filter(j => j.registrado >= 3 && j.pct < 60)
      if (bajos.length > 0) {
        sugerencias.push({ tipo: 'aviso', texto: `${bajos.length === 1 ? bajos[0].nombre + ' tiene' : bajos.length + ' jugadores tienen'} asistencia por debajo del 60% — vale la pena hablar con ${bajos.length === 1 ? 'él' : 'ellos'}.` })
      }
    }
    if (sugerencias.length === 0 && sesiones.length > 0) {
      sugerencias.push({ tipo: 'ok', texto: 'Buen reparto de carga e intensidad en las últimas semanas — sin alertas.' })
    }

    return {
      totalSesiones: sesiones.length, totalMin, totalEjercicios,
      promedioMin: sesiones.length ? Math.round(totalMin / sesiones.length) : 0,
      categorias, porInt, semanas, sugerencias, jugadoresConDatos,
      sesionesConLista: sesionesConLista.length,
    }
  }, [entrenos, jugadores])

  if (!entrenos.length) {
    return (
      <div className="card p-8 text-center text-sm text-muted">
        Todavía no hay entrenos guardados para generar el informe.
      </div>
    )
  }

  const maxCatMin = stats.categorias[0]?.min || 1
  const maxSemMin = Math.max(1, ...stats.semanas.map(s => s.min))
  const totalInt = stats.porInt.Baja + stats.porInt.Media + stats.porInt.Alta || 1

  const kpi = (label, val, color) => (
    <div className="card p-3">
      <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className="text-lg font-extrabold" style={{ color }}>{val}</div>
    </div>
  )

  const ICONO_SUG = { aviso: '⚠️', info: '💡', ok: '✅' }
  const COLOR_SUG = { aviso: '#fbbf24', info: '#60a5fa', ok: '#4ade80' }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {kpi('Sesiones registradas', stats.totalSesiones, '#4ade80')}
        {kpi('Minutos totales', `${stats.totalMin}′`, '#60a5fa')}
        {kpi('Promedio por sesión', `${stats.promedioMin}′`, '#a1a1aa')}
        {kpi('Ejercicios totales', stats.totalEjercicios, '#2dd4bf')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Categorías */}
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📚 Minutos por categoría</div>
          <div className="space-y-2.5">
            {stats.categorias.map(c => (
              <div key={c.cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">{c.cat}</span>
                  <span className="text-muted">{c.min}′ · {c.count} ej.</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div style={{ width: `${Math.max(3, (c.min / maxCatMin) * 100)}%`, background: COLOR_CAT[c.cat] || '#2dd4bf', height: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intensidad */}
        <div className="card p-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🔥 Distribución de intensidad</div>
          <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-white/5">
            <div style={{ width: `${stats.porInt.Baja / totalInt * 100}%`, background: '#5eead4' }} />
            <div style={{ width: `${stats.porInt.Media / totalInt * 100}%`, background: '#f59e0b' }} />
            <div style={{ width: `${stats.porInt.Alta / totalInt * 100}%`, background: '#ef4444' }} />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#5eead4', display: 'inline-block' }} />Baja · {stats.porInt.Baja}</span>
            <span className="flex items-center gap-1.5"><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />Media · {stats.porInt.Media}</span>
            <span className="flex items-center gap-1.5"><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />Alta · {stats.porInt.Alta}</span>
          </div>
        </div>
      </div>

      {/* Tendencia semanal */}
      {stats.semanas.length > 1 && (
        <div className="card p-4 mb-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">📈 Minutos por semana</div>
          <div className="flex items-end gap-2" style={{ height: 90 }}>
            {stats.semanas.map(s => (
              <div key={s.sem} className="flex-1 flex flex-col items-center gap-1.5" style={{ height: '100%' }}>
                <div className="flex-1 flex items-end w-full">
                  <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, (s.min / maxSemMin) * 100)}%`, background: '#2dd4bf', minHeight: 4 }} title={`${s.min}′`} />
                </div>
                <div className="text-[9.5px] text-muted">{fCortaSemana(s.sem)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asistencia por jugador */}
      {stats.sesionesConLista === 0 ? (
        <div className="card p-4 mb-4 text-center text-xs text-muted">
          Todavía no se registró asistencia en ningún entreno — marca quién asistió en el panel "👥 Asistencia" al guardar una sesión, y aquí verás el detalle por jugador.
        </div>
      ) : stats.jugadoresConDatos.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🧍 Asistencia por jugador</div>
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#71717a', textAlign: 'left' }}>
                <th className="pb-2 font-semibold">Jugador</th>
                <th className="pb-2 font-semibold text-center">Asistió</th>
                <th className="pb-2 font-semibold text-center">Faltó</th>
                <th className="pb-2 font-semibold text-right">%</th>
                <th className="pb-2 font-semibold text-right">Última vez</th>
              </tr>
            </thead>
            <tbody>
              {stats.jugadoresConDatos.map(j => (
                <tr key={j.id} style={{ borderTop: '1px solid #27272a' }}>
                  <td className="py-2">
                    <span className="text-muted mr-1.5">#{j.dorsal ?? '-'}</span>
                    <span className="font-semibold">{j.nombre}</span>
                  </td>
                  <td className="py-2 text-center" style={{ color: '#4ade80' }}>{j.ok}</td>
                  <td className="py-2 text-center" style={{ color: j.no > 0 ? '#f87171' : undefined }}>{j.no}</td>
                  <td className="py-2 text-right font-bold" style={{ color: j.pct >= 80 ? '#4ade80' : j.pct >= 60 ? '#fbbf24' : '#f87171' }}>{j.pct}%</td>
                  <td className="py-2 text-right text-muted">{j.ultimaAsistio ? fCortaSemana(j.ultimaAsistio) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sugerencias */}
      <div className="card p-4">
        <div className="text-xs font-bold text-muted uppercase tracking-wide mb-3">✨ Sugerencias</div>
        <div className="space-y-2">
          {stats.sugerencias.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg"
              style={{ background: `${COLOR_SUG[s.tipo]}14`, border: `1px solid ${COLOR_SUG[s.tipo]}33` }}>
              <span>{ICONO_SUG[s.tipo]}</span>
              <span style={{ color: COLOR_SUG[s.tipo] }}>{s.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
