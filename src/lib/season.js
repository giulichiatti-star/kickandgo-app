// Temporada / campeonato a partir de una fecha. Corte en julio: un evento de
// julio→diciembre pertenece a "año/año+1"; de enero→junio a "año-1/año".
// Es el mismo criterio que usa el Informe Global, centralizado aquí.
export function temporadaDe(fechaISO) {
  if (!fechaISO) return null
  const s = String(fechaISO)
  const d = new Date(s.length <= 10 ? s + 'T00:00:00' : s)
  if (isNaN(d)) return null
  const y = d.getFullYear()
  const ini = d.getMonth() >= 6 ? y : y - 1
  return `${ini}/${String(ini + 1).slice(-2)}`
}

// Lista de temporadas presentes en un conjunto de fechas, de más nueva a más vieja.
export function temporadasDe(fechas = []) {
  const set = new Set()
  fechas.forEach((f) => { const t = temporadaDe(f); if (t) set.add(t) })
  return Array.from(set).sort().reverse()
}

// La temporada "actual": la más reciente con datos, o la de hoy si no hay datos.
export function temporadaActual(fechas = []) {
  return temporadasDe(fechas)[0] || temporadaDe(new Date().toISOString())
}
