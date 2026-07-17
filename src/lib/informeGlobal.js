// ============================================================
// INFORME GLOBAL (solo admin) — motor de análisis de datos deportivos.
// 100% cálculo en el cliente sobre los datos que el admin lee de todos
// los clubes (habilitado por RLS de admin). Sin coste, sin LLM.
//
// Expone:
//   cargarDatosGlobales()  -> descarga todo (equipos, jugadores, partidos,
//                             tarjetas, entrenamientos, perfiles).
//   construirInforme(datos, filtros) -> KPIs + 8 premios + tabla por equipo.
//   TEMPORADAS(datos), CATEGORIAS(datos) -> opciones para los filtros.
// ============================================================
import { supabase } from './supabase'
import { analizarNotasPartidos } from './notasTendencias'

/* ── Utilidades ─────────────────────────────────────────── */
export function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
const round1 = (n) => Math.round(n * 10) / 10
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0)
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

// Temporada española a partir de una fecha ISO. Corte en julio: un partido
// de julio→diciembre pertenece a "año/año+1"; de enero→junio a "año-1/año".
export function temporadaDe(fechaISO) {
  if (!fechaISO) return null
  const d = new Date(fechaISO + (fechaISO.length <= 10 ? 'T00:00:00' : ''))
  if (isNaN(d)) return null
  const y = d.getFullYear()
  const m = d.getMonth() // 0=ene … 6=jul
  const ini = m >= 6 ? y : y - 1
  return `${ini}/${String(ini + 1).slice(-2)}`
}

// Clasifica una posición de texto en POR / DEF / MED / DEL / OTRO.
export function lineaDe(posicion) {
  const p = norm(posicion)
  if (!p) return 'OTRO'
  if (/porter|arquer|guardamet/.test(p)) return 'POR'
  if (/defens|central|lateral|zaguer|libero|carriler/.test(p)) return 'DEF'
  if (/medi|pivot|volante|interior|contenc|mediapunt/.test(p)) return 'MED'
  if (/delanter|extrem|punta|ariete|atacant|banda/.test(p)) return 'DEL'
  return 'OTRO'
}

// Empareja el texto de un evento ("#9 Diego Sanz") con un jugador del equipo.
// Prioriza dorsal; si falla, empareja por nombre normalizado.
function emparejarJugador(textoEvento, jugadoresEquipo) {
  if (!textoEvento) return null
  const t = String(textoEvento)
  const mDorsal = t.match(/#\s*(\d+)/)
  const nombreTxt = norm(t.replace(/#\s*\d+/, ''))
  if (mDorsal) {
    const dor = parseInt(mDorsal[1], 10)
    const porDorsal = jugadoresEquipo.filter((j) => Number(j.dorsal) === dor)
    if (porDorsal.length === 1) return porDorsal[0]
    if (porDorsal.length > 1 && nombreTxt) {
      const m = porDorsal.find((j) => norm(j.nombre) && nombreTxt.includes(norm(j.nombre).split(' ')[0]))
      if (m) return m
    }
    if (porDorsal.length >= 1) return porDorsal[0]
  }
  if (nombreTxt) {
    const m = jugadoresEquipo.find((j) => {
      const n = norm(j.nombre)
      return n && (nombreTxt.includes(n) || n.includes(nombreTxt))
    })
    if (m) return m
  }
  return null
}

// Resultado de un partido: 'V' | 'E' | 'D'
function resultado(p) {
  const gf = p.gf || 0, gc = p.gc || 0
  return gf > gc ? 'V' : gf === gc ? 'E' : 'D'
}

/* ── Carga de datos (admin) ─────────────────────────────── */
export async function cargarDatosGlobales() {
  const [eq, ju, pa, ta, en, pr] = await Promise.all([
    supabase.from('equipos').select('id, user_id, nombre, tipo_equipo, categoria, division, escudo_url'),
    supabase.from('jugadores').select('id, equipo_id, user_id, nombre, dorsal, posicion, activo'),
    supabase.from('partidos').select('id, equipo_id, user_id, fecha, rival, local_visitante, gf, gc, notas, valoraciones, analisis_ia, activo'),
    supabase.from('tarjetas').select('id, equipo_id, jugador_id, tipo, fecha'),
    supabase.from('entrenamientos').select('id, equipo_id, fecha, ejercicios, duracion, asistencia'),
    supabase.from('profiles').select('id, entrenador, club_nombre'),
  ])
  const err = [eq, ju, pa, ta, en, pr].find((r) => r.error)
  if (err) throw new Error(err.error.message)
  return {
    equipos: (eq.data || []).filter((e) => e),
    jugadores: (ju.data || []).filter((j) => j.activo !== false),
    partidos: (pa.data || []).filter((p) => p.activo !== false),
    tarjetas: ta.data || [],
    entrenos: en.data || [],
    perfiles: pr.data || [],
  }
}

/* ── Opciones de filtro ─────────────────────────────────── */
export function TEMPORADAS(datos) {
  const set = new Set()
  ;(datos.partidos || []).forEach((p) => { const t = temporadaDe(p.fecha); if (t) set.add(t) })
  return Array.from(set).sort().reverse()
}
export function CATEGORIAS(datos) {
  const set = new Set()
  ;(datos.equipos || []).forEach((e) => { if (e.categoria && e.categoria.trim()) set.add(e.categoria.trim()) })
  return Array.from(set).sort()
}
export function DIVISIONES(datos) {
  const set = new Set()
  ;(datos.equipos || []).forEach((e) => { if (e.division && e.division.trim()) set.add(e.division.trim()) })
  return Array.from(set).sort()
}

// Preset de categorías por EDAD para el desplegable de creación/edición de equipo.
export const CATEGORIAS_PRESET = [
  'Prebenjamín', 'Benjamín', 'Alevín', 'Infantil', 'Cadete',
  'Juvenil', 'Senior', 'Veteranos', 'Femenino', 'Fútbol base', 'Otra',
]

// Preset de DIVISIÓN / nivel competitivo. Cubre los escalones nacionales y
// etiquetas genéricas para el fútbol regional/amateur (varía por comunidad).
export const DIVISIONES_PRESET = [
  'Primera División', 'Segunda División', 'Primera Federación', 'Segunda Federación',
  'Tercera Federación', 'Regional Preferente', 'Primera Regional', 'Segunda Regional',
  'Tercera Regional', 'Liga local / amateur', 'Fútbol base', 'Otra',
]

/* ── Núcleo: construir el informe con filtros ───────────── */
export function construirInforme(datos, filtros = {}) {
  const { temporada = 'todas', categoria = 'todas', division = 'todas', equipoId = 'todos' } = filtros
  const { equipos, jugadores, partidos, tarjetas, entrenos, perfiles } = datos

  const perfilPorUser = Object.fromEntries((perfiles || []).map((p) => [p.id, p]))
  const equipoPorId = Object.fromEntries((equipos || []).map((e) => [e.id, e]))
  const jugadoresPorEquipo = {}
  ;(jugadores || []).forEach((j) => {
    (jugadoresPorEquipo[j.equipo_id] = jugadoresPorEquipo[j.equipo_id] || []).push(j)
  })

  // Equipos que pasan el filtro de categoría/equipo
  const equiposFiltrados = (equipos || []).filter((e) => {
    if (equipoId !== 'todos' && e.id !== equipoId) return false
    if (categoria !== 'todas' && (e.categoria || '').trim() !== categoria) return false
    if (division !== 'todas' && (e.division || '').trim() !== division) return false
    return true
  })
  const equipoIds = new Set(equiposFiltrados.map((e) => e.id))

  // Partidos filtrados por temporada + equipos permitidos
  const partidosF = (partidos || []).filter((p) => {
    if (!equipoIds.has(p.equipo_id)) return false
    if (temporada !== 'todas' && temporadaDe(p.fecha) !== temporada) return false
    return true
  })
  const entrenosF = (entrenos || []).filter((e) => {
    if (!equipoIds.has(e.equipo_id)) return false
    if (temporada !== 'todas' && temporadaDe(e.fecha) !== temporada) return false
    return true
  })
  const tarjetasF = (tarjetas || []).filter((t) => {
    if (!equipoIds.has(t.equipo_id)) return false
    if (temporada !== 'todas' && temporadaDe(t.fecha) !== temporada) return false
    return true
  })

  /* ── Acumuladores por jugador ── */
  // clave: jugador.id
  const J = {} // { id, nombre, dorsal, equipoId, equipoNombre, categoria, linea, goles, asist, pj, cleanSheets, notas:[], tarjetas }
  function jref(jug, equipo) {
    if (!J[jug.id]) {
      J[jug.id] = {
        id: jug.id, nombre: jug.nombre, dorsal: jug.dorsal,
        equipoId: equipo.id, equipoNombre: equipo.nombre,
        categoria: equipo.categoria || '—', division: equipo.division || '—',
        linea: lineaDe(jug.posicion), posicion: jug.posicion || '',
        goles: 0, asist: 0, pj: 0, cleanSheets: 0, gcJugados: 0, notas: [], amarillas: 0, rojas: 0,
      }
    }
    return J[jug.id]
  }

  /* ── Acumuladores por equipo ── */
  const T = {} // { id, nombre, categoria, tipo, coach, pj, v, e, d, gf, gc, entrenos, asisSum, asisCnt, cards, goleadores:{} }
  function tref(equipo) {
    if (!T[equipo.id]) {
      const perfil = perfilPorUser[equipo.user_id]
      T[equipo.id] = {
        id: equipo.id, nombre: equipo.nombre,
        categoria: equipo.categoria || '—', division: equipo.division || '—',
        tipo: equipo.tipo_equipo || '11',
        coach: perfil?.entrenador || '—', club: perfil?.club_nombre || equipo.nombre,
        pj: 0, v: 0, e: 0, d: 0, gf: 0, gc: 0, entrenos: 0,
        asisSum: 0, asisCnt: 0, cards: 0, golesPorJug: {},
        partidosOrden: [], // para evolución (ppp por mitad)
      }
    }
    return T[equipo.id]
  }

  // Recorre partidos
  partidosF.forEach((p) => {
    const equipo = equipoPorId[p.equipo_id]
    if (!equipo) return
    const t = tref(equipo)
    const jugsEq = jugadoresPorEquipo[p.equipo_id] || []
    const r = resultado(p)
    t.pj++; t[r === 'V' ? 'v' : r === 'E' ? 'e' : 'd']++
    t.gf += p.gf || 0; t.gc += p.gc || 0
    t.partidosOrden.push({ fecha: p.fecha, pts: r === 'V' ? 3 : r === 'E' ? 1 : 0 })

    // Eventos: goles / asistencias propios
    const ev = Array.isArray(p.notas) ? p.notas : []
    ev.forEach((e) => {
      if (e.tipo === 'gol' || e.tipo === 'asistencia') {
        const jug = emparejarJugador(e.jugador, jugsEq)
        if (jug) {
          const jr = jref(jug, equipo)
          if (e.tipo === 'gol') { jr.goles++; t.golesPorJug[jug.id] = (t.golesPorJug[jug.id] || 0) + 1 }
          else jr.asist++
        }
      }
    })

    // Valoraciones: quién jugó + nota. También clean sheets del que jugó.
    const vals = p.valoraciones || {}
    Object.entries(vals).forEach(([jid, nota]) => {
      if (nota == null) return
      const jug = jugsEq.find((j) => j.id === jid)
      if (!jug) return
      const jr = jref(jug, equipo)
      jr.pj++
      jr.notas.push(Number(nota))
      jr.gcJugados += (p.gc || 0)
      if ((p.gc || 0) === 0) jr.cleanSheets++
    })
  })

  // Entrenos → conteo + asistencia media por equipo
  entrenosF.forEach((en) => {
    const equipo = equipoPorId[en.equipo_id]
    if (!equipo) return
    const t = tref(equipo)
    if ((en.ejercicios || []).length === 0) return
    t.entrenos++
    const asis = en.asistencia || {}
    const marcados = Object.keys(asis).length
    if (marcados > 0) {
      const presentes = Object.values(asis).filter(Boolean).length
      t.asisSum += pct(presentes, marcados)
      t.asisCnt++
    }
  })

  // Tarjetas → por jugador y por equipo
  tarjetasF.forEach((tj) => {
    const equipo = equipoPorId[tj.equipo_id]
    if (equipo) tref(equipo).cards++
    const jug = (jugadoresPorEquipo[tj.equipo_id] || []).find((j) => j.id === tj.jugador_id)
    if (jug && J[jug.id]) {
      if (/roja/.test(tj.tipo || '')) J[jug.id].rojas++
      else J[jug.id].amarillas++
    }
  })

  /* ── Post-proceso equipos: índice DT ── */
  const equiposArr = Object.values(T)
  const maxEntrenos = Math.max(1, ...equiposArr.map((t) => t.entrenos))
  equiposArr.forEach((t) => {
    t.ppp = t.pj ? round1((t.v * 3 + t.e) / t.pj) : 0
    t.asistencia = t.asisCnt ? Math.round(t.asisSum / t.asisCnt) : null
    t.dif = t.gf - t.gc
    // Máximo goleador del equipo
    const topG = Object.entries(t.golesPorJug).sort((a, b) => b[1] - a[1])[0]
    if (topG) {
      const jug = (jugadores || []).find((j) => j.id === topG[0])
      t.maxGoleador = jug ? { nombre: jug.nombre, goles: topG[1] } : null
    } else t.maxGoleador = null

    // Factores del índice DT (0..100)
    const fResultados = Math.round((t.ppp / 3) * 100)
    const fEntrenos = Math.round((t.entrenos / maxEntrenos) * 100)
    const fAsistencia = t.asistencia == null ? 50 : t.asistencia
    // Evolución: ppp 2ª mitad vs 1ª mitad de la temporada
    const ord = [...t.partidosOrden].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
    let fEvolucion = 50
    if (ord.length >= 4) {
      const mid = Math.floor(ord.length / 2)
      const p1 = avg(ord.slice(0, mid).map((x) => x.pts))
      const p2 = avg(ord.slice(mid).map((x) => x.pts))
      fEvolucion = Math.max(0, Math.min(100, Math.round(50 + (p2 - p1) * 33)))
    }
    t.dtFactores = { resultados: fResultados, entrenos: fEntrenos, asistencia: fAsistencia, evolucion: fEvolucion }
    t.dtIndice = Math.round(0.40 * fResultados + 0.20 * fEntrenos + 0.20 * fAsistencia + 0.20 * fEvolucion)
    t.registro = `${t.v}V-${t.e}E-${t.d}D`
  })

  /* ── Post-proceso jugadores: medias ── */
  const jugadoresArr = Object.values(J).map((j) => ({
    ...j,
    ga: j.goles + j.asist,
    valMedia: j.notas.length ? round1(avg(j.notas)) : null,
    valMuestras: j.notas.length,
    gcPorPJ: j.pj ? round1(j.gcJugados / j.pj) : null,
  }))

  /* ── Rankings / premios ── */
  const top = (arr, key, n = 5) => [...arr].sort((a, b) => (b[key] ?? -Infinity) - (a[key] ?? -Infinity)).slice(0, n)

  const mejorDelantero = top(
    jugadoresArr.filter((j) => j.linea === 'DEL' || j.goles + j.asist >= 1), 'ga'
  ).filter((j) => j.ga > 0)

  const maxAsistente = top(jugadoresArr.filter((j) => j.asist > 0), 'asist')

  const mejorMedio = top(
    jugadoresArr
      .filter((j) => j.linea === 'MED' && (j.valMedia != null || j.asist > 0))
      .map((j) => ({ ...j, scoreMedio: round1((j.valMedia || 0) + j.asist * 0.3) })),
    'scoreMedio'
  )

  const mejorDefensa = top(
    jugadoresArr
      .filter((j) => j.linea === 'DEF' && j.pj >= 1)
      .map((j) => ({ ...j, scoreDef: round1(j.cleanSheets + (j.valMedia || 0) / 10) })),
    'scoreDef'
  )

  // Portero: primero porterías a cero; a igualdad, menos goles encajados por PJ.
  const mejorPortero = jugadoresArr
    .filter((j) => j.linea === 'POR' && j.pj >= 1)
    .sort((a, b) => (b.cleanSheets - a.cleanSheets) || ((a.gcPorPJ ?? 99) - (b.gcPorPJ ?? 99)))
    .slice(0, 5)

  // Jugador revelación: mejor valoración media con muestra mínima
  const revelacion = top(
    jugadoresArr.filter((j) => j.valMuestras >= 3 && j.valMedia != null), 'valMedia'
  )

  // Fair play (equipo): menos tarjetas por partido
  const fairPlay = [...equiposArr]
    .filter((t) => t.pj >= 3)
    .map((t) => ({ ...t, cardsPorPJ: round1(t.cards / t.pj) }))
    .sort((a, b) => a.cardsPorPJ - b.cardsPorPJ)
    .slice(0, 5)

  // Más regular (jugador): más partidos jugados (con valoración = jugó)
  const masRegular = top(jugadoresArr.filter((j) => j.pj >= 1), 'pj')

  const mejorDT = [...equiposArr]
    .filter((t) => t.pj >= 3)
    .sort((a, b) => b.dtIndice - a.dtIndice)
    .slice(0, 5)

  /* ── KPIs globales ── */
  const totV = equiposArr.reduce((a, t) => a + t.v, 0)
  const totE = equiposArr.reduce((a, t) => a + t.e, 0)
  const totD = equiposArr.reduce((a, t) => a + t.d, 0)
  const totGF = equiposArr.reduce((a, t) => a + t.gf, 0)
  const totMin = entrenosF.reduce((a, e) => a + (e.duracion || 0), 0)
  const clubs = new Set(equiposFiltrados.map((e) => e.user_id)).size

  const kpis = {
    clubs,
    equipos: equiposFiltrados.length,
    categorias: new Set(equiposFiltrados.map((e) => (e.categoria || '').trim()).filter(Boolean)).size,
    jugadores: (jugadores || []).filter((j) => equipoIds.has(j.equipo_id)).length,
    partidos: partidosF.length,
    registro: `${totV}V · ${totE}E · ${totD}D`,
    goles: totGF,
    golesPorPartido: partidosF.length ? round1(totGF / partidosF.length) : 0,
    entrenos: entrenosF.filter((e) => (e.ejercicios || []).length > 0).length,
    minutos: totMin,
  }

  // Tendencias de notas sobre TODOS los partidos filtrados
  const notas = analizarNotasPartidos(partidosF, { min: 2 })

  // Tabla por equipo ordenada por índice DT
  const tabla = [...equiposArr].sort((a, b) => b.dtIndice - a.dtIndice)

  return {
    kpis,
    premios: {
      mejorDT, mejorDelantero, mejorMedio, mejorDefensa,
      mejorPortero, maxAsistente, fairPlay, revelacion, masRegular,
    },
    tabla,
    notas,
    filtrosActivos: { temporada, categoria, division, equipoId },
    vacio: partidosF.length === 0 && equiposFiltrados.length === 0,
  }
}
