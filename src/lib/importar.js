// Parser de import de plantilla. Soporta:
//  1) Formato FCF: "APELLIDOS, NOMBRE"  (con dorsal opcional al inicio)
//  2) CSV: "nombre, dorsal, posicion"  (coma o ;)
//  3) Lista simple: un nombre por línea

function titleCase(s) {
  return (s || '').toLowerCase().replace(/\b([a-záéíóúñ])/g, (m) => m.toUpperCase()).trim()
}

export function parseImport(texto) {
  const lineas = (texto || '').split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const out = []
  for (let linea of lineas) {
    // saltar cabeceras típicas
    if (/^(nombre|jugador|dorsal|n[ºo]\.?)\b/i.test(linea) && linea.includes(',')) {
      // posible cabecera CSV: la ignoramos si no tiene datos numéricos claros
    }
    let dorsal = null
    let rest = linea
    // dorsal al inicio: "9 ", "9. ", "9) ", "9 - "
    const m = rest.match(/^(\d{1,2})[\s.\-)]+(.*)$/)
    if (m) { dorsal = parseInt(m[1]); rest = m[2].trim() }

    const comas = (rest.match(/,/g) || []).length
    let nombre = '', posicion = ''

    if (rest.includes(';') || comas >= 2) {
      // CSV: nombre, dorsal, posicion
      const partes = rest.split(/[;,]/).map((p) => p.trim()).filter(Boolean)
      nombre = titleCase(partes[0] || '')
      if (partes[1] && /^\d{1,2}$/.test(partes[1])) dorsal = dorsal ?? parseInt(partes[1])
      posicion = partes[2] || ''
    } else if (comas === 1) {
      // FCF: APELLIDOS, NOMBRE  →  Nombre Apellidos
      const [ape, nom] = rest.split(',').map((p) => p.trim())
      nombre = titleCase(`${nom} ${ape}`)
    } else {
      nombre = titleCase(rest)
    }

    if (nombre) out.push({ nombre, dorsal, posicion })
  }

  // Asignar dorsales que falten, sin repetir
  const usados = new Set(out.map((p) => p.dorsal).filter((d) => d != null))
  let next = 1
  for (const p of out) {
    if (p.dorsal == null) {
      while (usados.has(next)) next++
      p.dorsal = next; usados.add(next)
    }
  }
  return out
}
