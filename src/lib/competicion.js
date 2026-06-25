import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'

// Lee la competición del equipo activo (equipoId) — fallback a profiles para retrocompatibilidad
export async function getCompeticion(equipoId) {
  const key = 'competicion_' + (equipoId || 'default')
  try {
    if (equipoId) {
      const { data, error } = await supabase.from('equipos').select('competicion').eq('id', equipoId).single()
      if (error) throw error
      const c = data?.competicion
      if (!c || (typeof c === 'object' && !Object.keys(c).length)) return null
      cacheSet(key, c)
      return c
    }
    // Fallback sin equipoId: leer de profiles
    const { data: u } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('profiles').select('competicion').eq('id', u.user.id).single()
    if (error) return cacheGet(key)
    const c = data?.competicion
    if (!c || (typeof c === 'object' && !Object.keys(c).length)) return null
    cacheSet(key, c)
    return c
  } catch {
    return cacheGet(key)
  }
}

export async function guardarCompeticion(comp, equipoId) {
  if (equipoId) {
    const { error } = await supabase.from('equipos').update({ competicion: comp }).eq('id', equipoId)
    if (error) throw error
  } else {
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ competicion: comp }).eq('id', u.user.id)
    if (error) throw error
  }
  return comp
}

// Calcula la tabla. nuestrosPartidos (de Supabase `partidos`) tienen prioridad
// sobre calendario_jugado para los partidos de nuestro equipo.
export function calcularTabla(jugados = [], nuestrosPartidos = [], clubNombre = '') {
  // Convertir nuestros partidos al mismo formato que jugados
  const nuestros = nuestrosPartidos.map(p => {
    const esLocal = p.local_visitante === 'local'
    return {
      local: esLocal ? clubNombre : p.rival,
      visitante: esLocal ? p.rival : clubNombre,
      golesLocal: esLocal ? Number(p.gf) : Number(p.gc),
      golesVisitante: esLocal ? Number(p.gc) : Number(p.gf),
      _nuestro: true,
    }
  }).filter(p => p.local && p.visitante)

  // Para cada jugado del CSV, descartar si hay un partido nuestro contra el mismo rival
  const nomClub = (clubNombre || '').toLowerCase()
  const rivalesNuestros = new Set(
    nuestros.map(p => (p.local.toLowerCase() === nomClub ? p.visitante : p.local).toLowerCase())
  )
  const jugadosFiltrados = jugados.filter(j => {
    const involucraClub = nomClub && (
      j.local?.toLowerCase().includes(nomClub) ||
      j.visitante?.toLowerCase().includes(nomClub)
    )
    if (!involucraClub) return true
    const rival = j.local?.toLowerCase().includes(nomClub) ? j.visitante?.toLowerCase() : j.local?.toLowerCase()
    return !rivalesNuestros.has(rival)
  })

  const todos = [...jugadosFiltrados, ...nuestros]

  const eq = {}
  todos.forEach(({ local, visitante, golesLocal, golesVisitante }) => {
    const gl = Number(golesLocal), gv = Number(golesVisitante)
    if (!local || !visitante || isNaN(gl) || isNaN(gv)) return
    if (!eq[local]) eq[local] = { nom: local, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0, forma:[], ico:'🛡️' }
    if (!eq[visitante]) eq[visitante] = { nom: visitante, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0, forma:[], ico:'🛡️' }
    const L = eq[local], V = eq[visitante]
    L.pj++; V.pj++
    L.gf += gl; L.gc += gv; V.gf += gv; V.gc += gl
    if (gl > gv) { L.pg++; L.pts += 3; L.forma.push('V'); V.pp++; V.forma.push('D') }
    else if (gl === gv) { L.pe++; L.pts += 1; L.forma.push('E'); V.pe++; V.pts += 1; V.forma.push('E') }
    else { V.pg++; V.pts += 3; V.forma.push('V'); L.pp++; L.forma.push('D') }
  })

  // Marcar nuestro equipo
  if (clubNombre && eq[clubNombre]) eq[clubNombre].miEquipo = true

  const tabla = Object.values(eq)
    .map(t => ({ ...t, forma: t.forma.slice(-5), pos: 0 }))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf)
  tabla.forEach((t, i) => { t.pos = i + 1 })
  return tabla
}

// Devuelve tabla/goleadores/calendario del usuario (vacío si no tiene datos)
export function resolverLiga(comp, options = {}) {
  let jugados = comp?.calendario_jugado || []
  let proximas = comp?.proximas_fechas || []

  // Migración automática: si hay calendario viejo y no hay nuevos campos, separar por resultado
  if (!jugados.length && !proximas.length && comp?.calendario?.length) {
    comp.calendario.forEach(c => {
      if (c.resultado) {
        const parts = (c.resultado || '').split(/[-–]/).map(x => parseInt(x.trim(), 10))
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          jugados.push({ ...c, golesLocal: parts[0], golesVisitante: parts[1] })
          return
        }
      }
      proximas.push(c)
    })
  }

  // Tabla: si hay calendario importado (jugados), auto-calcular siempre.
  // Si no hay jugados pero sí tabla manual (importada o del seed), usar la manual.
  // Solo auto-calcular desde nuestros partidos si no hay tabla manual de referencia.
  const nuestrosPartidos = options?.nuestrosPartidos || []
  const clubNombre = options?.clubNombre || ''
  let tabla
  if (jugados.length > 0) {
    tabla = calcularTabla(jugados, nuestrosPartidos, clubNombre)
  } else if (comp?.tabla?.length >= 4) {
    // Tabla manual (importada o seed) — usarla directamente y marcar nuestro equipo
    tabla = comp.tabla.map(t => ({ ...t, miEquipo: clubNombre ? t.nom === clubNombre : !!t.miEquipo }))
  } else {
    tabla = nuestrosPartidos.length ? calcularTabla([], nuestrosPartidos, clubNombre) : []
  }

  // Si no hay clubNombre pero la tabla manual tenía miEquipo, preservarlo
  if (!clubNombre && comp?.tabla?.length) {
    comp.tabla.forEach(orig => {
      if (orig.miEquipo) {
        const t = tabla.find(x => x.nom === orig.nom)
        if (t) t.miEquipo = true
      }
    })
  }

  return {
    nombre: comp?.nombre || '',
    tabla,
    goleadores: comp?.goleadores?.length ? comp.goleadores : [],
    calendario: comp?.calendario || [],
    calendario_jugado: jugados,
    proximas_fechas: proximas,
    esEjemplo: false,
  }
}

// ---- PARSERS (aceptan CSV con coma/; o tabulado; ignoran cabecera) ----
function filas(texto) {
  return (texto || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => l.split(/\t|;|,/).map((c) => c.trim()))
}
function esCabecera(cols) {
  const j = cols.join(' ').toLowerCase()
  return /equipo|pts|punto|jugador|goles|local|visitante|jornada|pos/.test(j) && !/\d{2,}/.test(cols[cols.length - 1] || '')
}
const num = (v) => { const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10); return isNaN(n) ? 0 : n }

// Clasificación: pos, equipo, PJ, PG, PE, PP, GF, GC, [DIF,] PTS
// Acepta 7 cols (sin DIF) u 8 cols (con DIF, formato FCF)
export function parseTabla(texto) {
  const out = []
  filas(texto).forEach((c, i) => {
    if (i === 0 && esCabecera(c)) return
    if (c.length < 2) return
    let off = 0
    if (/^\d+º?$/.test(c[0]) && c.length >= 3) off = 1
    const nom = c[off]
    if (!nom || /^\d+$/.test(nom)) return
    const nums = c.slice(off + 1).map(num)
    let pj=0,pg=0,pe=0,pp=0,gf=0,gc=0,pts=0
    if (nums.length >= 8) {
      // formato FCF: PJ PG PE PP GF GC DIF PTS
      ;[pj,pg,pe,pp,gf,gc,,pts] = nums
    } else if (nums.length >= 7) {
      // formato sin DIF: PJ PG PE PP GF GC PTS
      ;[pj,pg,pe,pp,gf,gc,pts] = nums
    } else {
      pts = nums[nums.length - 1] || 0
    }
    out.push({ pos: out.length + 1, ico: '🛡️', nom, pj, pg, pe, pp, gf, gc, pts, forma: [] })
  })
  out.sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc))
  out.forEach((t, i) => { t.pos = i + 1 })
  return out
}

// Goleadores: nombre, club, goles[, asist]
export function parseGoleadores(texto) {
  const out = []
  filas(texto).forEach((c, i) => {
    if (i === 0 && esCabecera(c)) return
    if (c.length < 2) return
    const nom = c[0]
    const golesIdx = c.findIndex((x, k) => k > 0 && /^\d+$/.test(x))
    const goles = golesIdx >= 0 ? num(c[golesIdx]) : num(c[c.length - 1])
    const club = golesIdx > 1 ? c.slice(1, golesIdx).join(' ') : (c[1] && !/^\d+$/.test(c[1]) ? c[1] : '')
    const asist = num(c[golesIdx + 1])
    out.push({ ini: nom.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), nom, club, goles, asist, pj: 0 })
  })
  return out.sort((a, b) => b.goles - a.goles)
}

// Partidos jugados: jornada, fecha, local, golesLocal-golesVisitante, visitante
// Acepta: "J1, 15/09, Vilassar, 2-1, Cabrils" o "J1, 15/09, Vilassar, 2, 1, Cabrils"
export function parseJugados(texto) {
  const out = []
  filas(texto).forEach((c, i) => {
    if (i === 0 && esCabecera(c)) return
    if (c.length < 3) return
    let off = 0, jornada = ''
    if (/^j?\.?\s*\d+$/i.test(c[0])) { jornada = c[0].replace(/\D/g, ''); off = 1 }
    let fecha = ''
    if (/\d{1,2}[\/\-.]\d{1,2}/.test(c[off] || '')) { fecha = c[off]; off++ }

    // Buscar resultado en formato "2-1" o "2 - 1"
    const resIdx = c.findIndex((x, k) => k >= off && /^\d+\s*[-–]\s*\d+$/.test(x.trim()))
    if (resIdx >= 0) {
      const local = c.slice(off, resIdx).join(' ').trim() || c[off] || ''
      const [gl, gv] = c[resIdx].split(/[-–]/).map(x => parseInt(x.trim(), 10))
      const visitante = c.slice(resIdx + 1).join(' ').trim()
      if (local && visitante && !isNaN(gl) && !isNaN(gv)) {
        out.push({ jornada, fecha, local, visitante, golesLocal: gl, golesVisitante: gv })
      }
    } else if (c.length >= off + 4) {
      // Formato: local, golesLocal, golesVisitante, visitante
      const local = c[off], gl = num(c[off+1]), gv = num(c[off+2]), visitante = c.slice(off+3).join(' ').trim()
      if (local && visitante) out.push({ jornada, fecha, local, visitante, golesLocal: gl, golesVisitante: gv })
    }
  })
  return out
}

// Próximas fechas: jornada, fecha, local, visitante[, hora]
export function parseProximas(texto) {
  const out = []
  filas(texto).forEach((c, i) => {
    if (i === 0 && esCabecera(c)) return
    if (c.length < 2) return
    let off = 0, jornada = ''
    if (/^j?\.?\s*\d+$/i.test(c[0])) { jornada = c[0].replace(/\D/g, ''); off = 1 }
    let fecha = ''
    if (/\d{1,2}[\/\-.]\d{1,2}/.test(c[off] || '')) { fecha = c[off]; off++ }
    const local = c[off], visitante = c[off+1], hora = c[off+2] || ''
    if (!local || !visitante) return
    out.push({ jornada, fecha, local, visitante, hora })
  })
  return out
}

// Calendario: jornada, fecha, local, visitante[, resultado]
export function parseCalendario(texto) {
  const out = []
  filas(texto).forEach((c, i) => {
    if (i === 0 && esCabecera(c)) return
    if (c.length < 3) return
    let off = 0, jornada = ''
    if (/^j?\.?\s*\d+$/i.test(c[0])) { jornada = c[0].replace(/\D/g, ''); off = 1 }
    let fecha = ''
    if (/\d{1,2}[\/\-.]\d{1,2}/.test(c[off] || '')) { fecha = c[off]; off++ }
    const local = c[off], visitante = c[off + 1], resultado = c[off + 2] || ''
    if (!local || !visitante) return
    out.push({ jornada, fecha, local, visitante, resultado })
  })
  return out
}
