// Asistente basado en TUS datos reales (sin coste de API).
// Cruza: plantilla, partidos, tarjetas, entrenos, convocatoria y datos de la liga (rivales).
import { RIVALES_TABLA, RIVALES_GOLEADORES } from './rivales'

function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') }

function goleadoresPropios(partidos) {
  const t = {}
  partidos.forEach((p) => (Array.isArray(p.notas) ? p.notas : []).forEach((e) => {
    if (!e.jugador) return
    if (!t[e.jugador]) t[e.jugador] = { goles: 0, asist: 0 }
    if (/gol/i.test(e.tipo || '')) t[e.jugador].goles++
    if (/asist/i.test(e.tipo || '')) t[e.jugador].asist++
  }))
  return Object.entries(t).map(([j, s]) => ({ jugador: j, ...s }))
}

function balance(partidos) {
  return partidos.reduce((a, p) => {
    if (p.gf > p.gc) a.v++; else if (p.gf < p.gc) a.d++; else a.e++
    a.gf += p.gf || 0; a.gc += p.gc || 0; return a
  }, { v: 0, e: 0, d: 0, gf: 0, gc: 0 })
}

export function responder(pregunta, ctx) {
  const { jugadores = [], partidos = [], tarjetas = [], entrenos = [], conv = null, club = 'tu equipo', liga = null } = ctx
  const q = norm(pregunta)
  const bal = balance(partidos)
  const TABLA = liga?.tabla?.length ? liga.tabla : RIVALES_TABLA
  const GOL = liga?.goleadores?.length ? liga.goleadores : RIVALES_GOLEADORES

  // ---- LIGA / RIVALES ----
  if (/clasificacion|tabla|posicion|que puesto|en que lugar|liga/.test(q)) {
    const mi = TABLA.find((t) => t.miEquipo)
    if (!mi) return `La clasificación tiene ${TABLA.length} equipos. Mira la pestaña Rivales para el detalle.`
    return `📊 En la liga vas ${mi.pos}º con ${mi.pts} pts (${mi.pg}G ${mi.pe}E ${mi.pp}P), ${mi.gf} goles a favor y ${mi.gc} en contra. El líder es ${TABLA[0].nom.split(',')[0]} (${TABLA[0].pts} pts).`
  }
  if (/goleador de la liga|pichichi|maximo goleador de la|mejor goleador de la liga/.test(q)) {
    const g = GOL[0]
    return `⚽ El máximo goleador de la liga es ${g.nom} (${g.club}) con ${g.goles} goles.`
  }
  // Pregunta por un rival concreto (busca nombre en la tabla)
  const rivalMatch = TABLA.find((t) => !t.miEquipo && norm(t.nom).split(/[ ,]/).some((w) => w.length > 3 && q.includes(w)))
  if (rivalMatch && /rival|equipo|contra|sobre|info|datos|como es|juega/.test(q)) {
    const dif = rivalMatch.gf - rivalMatch.gc
    return `🛡️ ${rivalMatch.nom.split(',')[0]} va ${rivalMatch.pos}º con ${rivalMatch.pts} pts. ${rivalMatch.gf} goles a favor, ${rivalMatch.gc} en contra (dif ${dif > 0 ? '+' : ''}${dif}). Forma reciente: ${rivalMatch.forma.join(' ')}.`
  }

  // ---- GOLEADOR PROPIO ----
  if (/golead|quien mete|mas goles|nuestro goleador|mi goleador/.test(q)) {
    const g = goleadoresPropios(partidos).sort((a, b) => b.goles - a.goles)
    if (!g.length) return 'Aún no hay goles registrados con jugador. En En Vivo, toca al jugador antes de marcar el gol.'
    return `🥇 Tu máximo goleador es ${g[0].jugador} con ${g[0].goles} gol${g[0].goles > 1 ? 'es' : ''}${g[0].asist ? ` y ${g[0].asist} asistencias` : ''}.`
  }
  if (/asistente|asistencia.*gol|quien da|mas asistencias/.test(q)) {
    const g = goleadoresPropios(partidos).sort((a, b) => b.asist - a.asist)
    if (!g.length || !g[0].asist) return 'Aún no hay asistencias registradas con jugador.'
    return `🅰️ Tu jugador con más asistencias es ${g[0].jugador} (${g[0].asist}).`
  }

  // ---- BALANCE / FORMA / LOCAL-VISITANTE ----
  if (/como vamos|balance|resultados|como va|temporada|rendimiento general/.test(q)) {
    if (!partidos.length) return 'Todavía no hay partidos guardados. Juega uno en En Vivo.'
    return `📊 ${club}: ${bal.v}V · ${bal.e}E · ${bal.d}D en ${partidos.length} partidos. Goles: ${bal.gf} a favor, ${bal.gc} en contra (dif ${bal.gf - bal.gc >= 0 ? '+' : ''}${bal.gf - bal.gc}).`
  }
  if (/forma|racha|ultimos partidos/.test(q)) {
    const u5 = partidos.slice(0, 5).map((p) => (p.gf > p.gc ? 'V' : p.gf === p.gc ? 'E' : 'D'))
    if (!u5.length) return 'Sin partidos recientes.'
    return `📈 Tus últimos partidos: ${u5.join(' · ')}.`
  }
  if (/local|en casa|fuera|visitante/.test(q)) {
    const loc = partidos.filter((p) => p.local_visitante === 'local')
    const vis = partidos.filter((p) => p.local_visitante === 'visitante')
    if (!partidos.length) return 'Sin partidos para comparar local/visitante.'
    const b = (arr) => arr.reduce((a, p) => (p.gf > p.gc ? a + 3 : p.gf === p.gc ? a + 1 : a), 0)
    return `🏟️ Local: ${loc.length} PJ, ${b(loc)} pts. Visitante: ${vis.length} PJ, ${b(vis)} pts.`
  }

  // ---- CREAR SESIÓN DE ENTRENAMIENTO ----
  if (/crea|planifica|genera|diseña/.test(q) && /sesion|entrenamiento|entreno/.test(q)) {
    const esDerrota  = /derrota/.test(q)
    const esVictoria = /victoria/.test(q)
    const rival = (() => { const m = pregunta.match(/vs\s+([^\.,(]+)/i); return m ? m[1].trim() : null })()
    const resultado = (() => { const m = pregunta.match(/\d+\s*-\s*\d+/); return m ? m[0] : null })()
    const tipo = esDerrota ? 'correctiva' : esVictoria ? 'de consolidación' : 'de mejora'
    const contexto = rival ? ` post ${rival}${resultado ? ` (${resultado})` : ''}` : ''
    const objetivo = `Sesión ${tipo}${contexto}`

    const mañana = new Date(); mañana.setDate(mañana.getDate() + 1)
    const fechaStr = mañana.toISOString().slice(0, 10)

    const ejerciciosBase = [
      { nombre: 'Calentamiento dinámico con balón', categoria: 'Calentamiento', duracion_min: 15, intensidad: 'Baja', zona_muscular: 'Todo el cuerpo', descripcion: 'Movilidad articular general, rondos de activación 4v2, carreras progresivas.' },
    ]
    if (esDerrota) {
      ejerciciosBase.push(
        { nombre: 'Bloque defensivo 4+4', categoria: 'Defensa', duracion_min: 25, intensidad: 'Media', zona_muscular: 'Pierna / Core', descripcion: 'Estructura defensiva en bloque medio. Coberturas y permutas por bandas. Balón parado defensivo.' },
        { nombre: 'Repliegue y presión tras pérdida', categoria: 'Transiciones', duracion_min: 25, intensidad: 'Alta', zona_muscular: 'Cardio / Pierna', descripcion: 'Repliegue organizado tras pérdida. Presión en 5 segundos. Partido condicionado: +3 pts si recuperas en campo rival.' },
      )
    } else if (esVictoria) {
      ejerciciosBase.push(
        { nombre: 'Posesión y presión alta 5v2', categoria: 'Posesión', duracion_min: 25, intensidad: 'Media', zona_muscular: 'Pierna / Cardio', descripcion: 'Rondos 5v2, circulación en tres líneas con pressing, partido condicionado en superioridad.' },
        { nombre: 'Transiciones ofensivas rápidas', categoria: 'Transiciones', duracion_min: 25, intensidad: 'Alta', zona_muscular: 'Pierna', descripcion: 'Continuidad táctica del partido ganado. Transiciones rápidas y finalización desde segunda línea.' },
      )
    } else {
      ejerciciosBase.push(
        { nombre: 'Definición y centros laterales', categoria: 'Finalización', duracion_min: 25, intensidad: 'Alta', zona_muscular: 'Pierna', descripcion: 'Centros laterales y remates. 1v1 con portero desde distintos ángulos. Faltas directas e indirectas.' },
        { nombre: 'Gestión del partido — tiempo límite', categoria: 'Partido', duracion_min: 25, intensidad: 'Alta', zona_muscular: 'Todo el cuerpo', descripcion: 'Partido condicionado con tiempo límite. Situaciones de empate al 80\'. Balón parado ofensivo.' },
      )
    }
    ejerciciosBase.push(
      { nombre: 'Estiramientos y vuelta a la calma', categoria: 'Calentamiento', duracion_min: 10, intensidad: 'Baja', zona_muscular: 'Todo el cuerpo', descripcion: 'Cadena posterior, cuádriceps e isquiotibiales. Vuelta a la calma en grupo.' }
    )

    let plan = `📋 ${objetivo} — 90 min\n\n`
    ejerciciosBase.forEach(e => {
      plan += `${e.categoria === 'Calentamiento' && e.nombre.includes('Estir') ? '🧘' : e.categoria === 'Calentamiento' ? '⏱' : e.categoria === 'Finali' ? '🎯' : e.categoria === 'Posesión' ? '⚽' : '🛡️'} ${e.nombre} (${e.duracion_min} min)\n`
      plan += `${e.descripcion}\n\n`
    })
    plan += `✅ Pulsa "Guardar como entreno" para añadirlo al calendario.`

    return {
      text: plan,
      entreno: { fecha: fechaStr, objetivo, notas: 'Generado por Asistente IA', ejercicios: ejerciciosBase }
    }
  }

  // ---- ENTRENOS ----
  if (/entreno|entrenamiento|que trabaj|sesion|esta semana|asistencia/.test(q)) {
    if (!entrenos.length) return 'No hay entrenos guardados. Planifica uno en Entrenamientos.'
    const total = entrenos.reduce((a, e) => a + (e.duracion || 0), 0)
    const cat = {}
    entrenos.forEach((e) => (e.ejercicios || []).forEach((x) => { if (x.cat) cat[x.cat] = (cat[x.cat] || 0) + (x.min || 0) }))
    const top = Object.entries(cat).sort((a, b) => b[1] - a[1])[0]
    let pres = 0, tot = 0
    entrenos.forEach((e) => Object.values(e.asistencia || {}).forEach((v) => { tot++; if (v) pres++ }))
    const pct = tot ? Math.round(pres / tot * 100) : null
    let r = `🏋️ Tienes ${entrenos.length} entrenos (${total} min en total). `
    if (top) r += `Lo más trabajado: ${top[0]} (${Math.round(top[1])} min). `
    if (pct !== null) r += `Asistencia media: ${pct}%.`
    return r
  }
  if (/que entrenar|recomienda|recomendacion|que hago|consejo/.test(q)) {
    if (!partidos.length) return '💡 Empieza con base técnica y físico: rondos, posesión y finalización.'
    const gc3 = partidos.slice(0, 3).reduce((a, p) => a + (p.gc || 0), 0)
    const gf3 = partidos.slice(0, 3).reduce((a, p) => a + (p.gf || 0), 0)
    if (gc3 >= 6) return '💡 Encajáis mucho: trabaja defensa, coberturas y balón parado en contra.'
    if (gf3 <= 2) return '💡 Falta gol: enfócate en finalización y definición con pierna débil.'
    return '💡 Buen momento: mantén intensidad con posesión y partido condicionado.'
  }

  // ---- SANCIONES ----
  if (/sancionad|tarjeta|amarilla|roja|amonest/.test(q)) {
    const porJug = {}
    tarjetas.forEach((t) => {
      const j = jugadores.find((x) => x.id === t.jugador_id)
      const nom = j ? j.nombre : '?'
      if (!porJug[nom]) porJug[nom] = { am: 0, ro: 0 }
      if (t.tipo === 'amarilla') porJug[nom].am++; else porJug[nom].ro++
    })
    if (!tarjetas.length) return 'No hay tarjetas registradas. 🟨'
    const sanc = Object.entries(porJug).filter(([, s]) => s.am >= 5 || s.ro > 0).map(([n]) => n)
    const riesgo = Object.entries(porJug).filter(([, s]) => s.am >= 4 && s.am < 5).map(([n]) => n)
    let r = `🟨 ${tarjetas.filter((t) => t.tipo === 'amarilla').length} amarillas · 🟥 ${tarjetas.filter((t) => t.tipo === 'roja').length} rojas. `
    if (sanc.length) r += `Sancionados: ${sanc.join(', ')}. `
    if (riesgo.length) r += `En riesgo (4 amarillas): ${riesgo.join(', ')}.`
    if (!sanc.length && !riesgo.length) r += 'Nadie sancionado ni en riesgo. 👌'
    return r
  }

  // ---- PRÓXIMO PARTIDO / PLANTILLA / SALUDO ----
  if (/proximo|siguiente partido|contra quien jugamos|a quien enfrent/.test(q)) {
    if (!conv?.rival) return 'No tienes una convocatoria con rival aún. Créala en Convocatoria.'
    const r = TABLA.find((t) => norm(t.nom).includes(norm(conv.rival).split(' ')[0]))
    let txt = `📅 Próximo partido: vs ${conv.rival}${conv.fecha ? ` (${conv.fecha})` : ''}.`
    if (r) txt += ` Va ${r.pos}º en la liga con ${r.pts} pts; forma ${r.forma.join(' ')}.`
    return txt
  }
  if (/cuantos jugadores|plantilla|cuantos hay|jugadores tengo/.test(q)) {
    return `👥 Tienes ${jugadores.length} jugadores. Revisa Equipo para el detalle por posición.`
  }
  if (/hola|buenas|hey|que tal/.test(q)) {
    return '¡Hola! Soy tu asistente. Puedo cruzar tus entrenos, partidos y datos de la liga. Pregúntame por el goleador, tu puesto en la liga, un rival, sanciones, qué entrenar…'
  }

  return 'Puedo ayudarte con: tu puesto en la liga, un rival concreto, goleador (tuyo o de la liga), balance, forma, local/visitante, entrenos y asistencia, qué entrenar, sanciones y próximo partido. Pregúntame por cualquiera. 🙂'
}

export const SUGERENCIAS = [
  '¿Qué puesto ocupo en la liga?',
  '¿Quién es nuestro goleador?',
  '¿Qué entrenar esta semana?',
  '¿Cómo es el próximo rival?',
  '¿Hay sancionados?',
  '¿Cómo vamos de local y visitante?',
]

// ---- VÍA A CLAUDE (preparada, desactivada hasta que se configure VITE_ASISTENTE_API) ----
// Cuando exista un endpoint serverless seguro, devolverá respuestas a preguntas libres.
export function iaDisponible() {
  return Boolean(import.meta.env.VITE_ASISTENTE_API)
}
export async function responderIA(pregunta, ctx) {
  const url = import.meta.env.VITE_ASISTENTE_API
  if (!url) return null
  try {
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta, ctx }),
    })
    if (!r.ok) return null
    const j = await r.json()
    return j.respuesta || null
  } catch { return null }
}
