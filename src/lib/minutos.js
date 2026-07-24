// Cálculo de minutos jugados por jugador a partir de la alineación guardada
// en cada partido. Es una capa de DERIVACIÓN: no se guarda "minutos" en la BD,
// se reconstruye desde { titulares, cambios, duracion }.
//
// Formato esperado de partido.alineacion:
//   {
//     titulares: [{ id, nombre, dorsal }],   // 11/7 inicial
//     suplentes: [{ id, nombre, dorsal }],
//     cambios:   [{ min, saleId, entraId }], // en minutos de juego
//     duracion:  <int>                        // minutos totales del partido
//   }
// Si es null/incompleta → devuelve {} (partido histórico o sin datos).

// Minutos de UN partido. Devuelve { [jugadorId]: minutosJugados }.
export function minutosDePartido(alineacion) {
  if (!alineacion || !Array.isArray(alineacion.titulares) || !alineacion.titulares.length) return {}

  const dur = Number(alineacion.duracion) > 0 ? Number(alineacion.duracion) : 90
  const min = {}                 // id -> minutos acumulados
  const onField = new Map()      // id -> minuto en que entró al campo

  for (const t of alineacion.titulares) {
    if (!t?.id) continue
    onField.set(t.id, 0)
    min[t.id] = 0
  }

  const cambios = [...(alineacion.cambios || [])]
    .filter((c) => c && (c.saleId || c.entraId))
    .sort((a, b) => (Number(a.min) || 0) - (Number(b.min) || 0))

  for (const c of cambios) {
    const m = Math.max(0, Math.min(dur, Number(c.min) || 0))
    // Sale
    if (c.saleId && onField.has(c.saleId)) {
      min[c.saleId] = (min[c.saleId] || 0) + (m - onField.get(c.saleId))
      onField.delete(c.saleId)
    }
    // Entra (si no estaba ya en el campo)
    if (c.entraId && !onField.has(c.entraId)) {
      onField.set(c.entraId, m)
      if (min[c.entraId] == null) min[c.entraId] = 0
    }
  }

  // Cierre: los que siguen en el campo juegan hasta el final
  for (const [id, entrada] of onField) {
    min[id] = (min[id] || 0) + (dur - entrada)
  }

  // Redondeo defensivo (nunca negativos)
  for (const id of Object.keys(min)) min[id] = Math.max(0, Math.round(min[id]))
  return min
}

// Acumula minutos de VARIOS partidos.
// Devuelve { [jugadorId]: { minutos, partidos } } donde `partidos` cuenta
// solo aquellos en los que el jugador disputó > 0 min.
export function agregarMinutos(partidos) {
  const acc = {}
  for (const p of partidos || []) {
    const mp = minutosDePartido(p.alineacion)
    for (const [id, m] of Object.entries(mp)) {
      if (!acc[id]) acc[id] = { minutos: 0, partidos: 0 }
      acc[id].minutos += m
      if (m > 0) acc[id].partidos += 1
    }
  }
  return acc
}

// ¿Hay al menos un partido con datos de minutos? (para mostrar/ocultar la vista)
export function hayDatosMinutos(partidos) {
  return (partidos || []).some((p) => p.alineacion && Array.isArray(p.alineacion.titulares) && p.alineacion.titulares.length)
}

// Formatea minutos a "1.234'" o "90'".
export function fmtMin(m) {
  const n = Math.max(0, Math.round(Number(m) || 0))
  return `${n.toLocaleString('es-ES')}'`
}
