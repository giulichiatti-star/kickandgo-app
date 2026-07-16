// Análisis de tendencias en las notas de los partidos — 100% local, sin coste.
// Lee el texto libre que el entrenador escribe en cada partido (campo analisis_ia)
// y detecta temas recurrentes por palabras clave + sinónimos. Determinista: no
// llama a ningún LLM. Preparado para enchufar Claude en el futuro si se quiere.

// Normaliza: minúsculas y sin acentos, para que "presión" == "presion".
function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Diccionario de temas típicos en notas de fútbol. Cada tema agrupa varias
// palabras/expresiones (ya normalizadas, sin acentos). Ampliable sin tocar la lógica.
export const TEMAS_NOTAS = [
  { id: 'defensa',      label: 'Defensa',            emoji: '🛡️', color: '#60a5fa', claves: ['defens', 'atras', 'linea defensiva', 'zaga', 'central', 'marcaje', 'nos marcan', 'cobertura', 'repliegue', 'nos hicieron gol', 'encajamos', 'nos meten gol'] },
  { id: 'ataque',       label: 'Ataque y gol',       emoji: '⚽', color: '#34d399', claves: ['ataque', 'ofensiv', 'gol', 'finaliz', 'definicion', 'delanter', 'remate', 'ocasion', 'chut', 'disparo', 'falta de puntería', 'falta de punteria', 'no metemos'] },
  { id: 'mediocampo',   label: 'Mediocampo',         emoji: '🎯', color: '#2dd4bf', claves: ['mediocampo', 'medio campo', 'centro del campo', 'circulacion', 'posesion', 'control del juego', 'perdimos balones', 'perdida de balon', 'perdidas'] },
  { id: 'fisico',       label: 'Físico',             emoji: '💪', color: '#f59e0b', claves: ['fisic', 'cansanc', 'resistencia', 'nos quedamos sin gasolina', 'ultimos minutos', 'últimos minutos', 'ritmo', 'intensidad fisica', 'bajon fisico'] },
  { id: 'presion',      label: 'Presión / intensidad', emoji: '🔥', color: '#ef4444', claves: ['presion', 'pressing', 'intensidad', 'agresiv', 'nos presionaron', 'no presionamos', 'robo'] },
  { id: 'balonparado',  label: 'Balón parado',       emoji: '📐', color: '#a78bfa', claves: ['balon parado', 'corner', 'saque de esquina', 'tiro libre', 'saque de falta', 'falta directa', 'falta lateral', 'penalti', 'penalty', 'estrategia'] },
  { id: 'concentracion',label: 'Concentración / errores', emoji: '🧠', color: '#f472b6', claves: ['concentrac', 'error', 'errores', 'despiste', 'desconcentr', 'fallo', 'fallos', 'regalamos', 'nos dormimos'] },
  { id: 'transiciones', label: 'Transiciones',       emoji: '↔️', color: '#38bdf8', claves: ['transicion', 'contraataque', 'contragolpe', 'al contra', 'repliegue', 'nos cogieron a la contra'] },
  { id: 'bandas',       label: 'Bandas / amplitud',  emoji: '📏', color: '#22d3ee', claves: ['banda', 'extremo', 'amplitud', 'centros', 'ancho', 'por fuera', 'por las alas'] },
  { id: 'actitud',      label: 'Actitud / mentalidad', emoji: '💥', color: '#fb923c', claves: ['actitud', 'mentalidad', 'caracter', 'ganas', 'garra', 'confianza', 'nervios', 'ansiedad', 'motivacion', 'entrega'] },
  { id: 'portero',      label: 'Portería',           emoji: '🧤', color: '#818cf8', claves: ['portero', 'porteria', 'guardameta', 'arquero', 'paradon', 'parada', 'bajo palos'] },
  { id: 'arbitro',      label: 'Arbitraje',          emoji: '🟨', color: '#facc15', claves: ['arbitr', 'colegiado', 'tarjeta', 'expulsion', 'roja', 'amarilla', 'nos perjudico'] },
]

// Etiqueta el resultado de un partido: 'V' | 'E' | 'D'
function resultado(p) {
  const gf = p.gf || 0, gc = p.gc || 0
  return gf > gc ? 'V' : gf === gc ? 'E' : 'D'
}

// Analiza las notas de una lista de partidos y devuelve las tendencias.
// - min: nº mínimo de menciones para considerarlo "tendencia" (default 2)
// Retorna { conNotas, tendencias, resumen }
export function analizarNotasPartidos(partidos = [], { min = 2 } = {}) {
  // Solo partidos que tienen texto real en analisis_ia (las notas del entrenador)
  const conNotas = partidos
    .map((p) => ({ ...p, _texto: norm(p.analisis_ia) }))
    .filter((p) => p._texto.trim().length > 0)

  const total = conNotas.length

  const tendencias = TEMAS_NOTAS.map((tema) => {
    const partidosTema = conNotas.filter((p) => tema.claves.some((k) => p._texto.includes(k)))
    const n = partidosTema.length
    const res = { V: 0, E: 0, D: 0 }
    partidosTema.forEach((p) => { res[resultado(p)]++ })
    // ¿El tema aparece más ligado a derrotas o a victorias?
    let sesgo = null
    if (n >= min) {
      if (res.D > res.V && res.D >= 2) sesgo = 'derrota'
      else if (res.V > res.D && res.V >= 2) sesgo = 'victoria'
    }
    return {
      ...tema, n, res, sesgo,
      pct: total ? Math.round((n / total) * 100) : 0,
      // Fechas donde aparece, más recientes primero
      fechas: partidosTema.map((p) => p.fecha).filter(Boolean).sort().reverse(),
    }
  })
    .filter((t) => t.n >= min)
    .sort((a, b) => b.n - a.n)

  // Resumen en lenguaje natural (plantilla, sin IA)
  let resumen = ''
  if (total === 0) {
    resumen = 'Todavía no has escrito notas en tus partidos. Escribe una observación al guardar cada partido y aquí verás los temas que más se repiten.'
  } else if (tendencias.length === 0) {
    resumen = `Tienes notas en ${total} ${total === 1 ? 'partido' : 'partidos'}, pero aún no se repite ningún tema lo suficiente para marcar una tendencia. Sigue anotando y aparecerán solas.`
  } else {
    const top = tendencias[0]
    const partesSesgo = top.sesgo === 'derrota'
      ? ', y aparece sobre todo en partidos que acabáis perdiendo'
      : top.sesgo === 'victoria'
      ? ', y suele coincidir con victorias'
      : ''
    resumen = `Sobre ${total} ${total === 1 ? 'partido con notas' : 'partidos con notas'}, el tema más recurrente es ${top.emoji} ${top.label} (aparece en ${top.n} de ${total})${partesSesgo}.`
    if (tendencias.length > 1) {
      const otros = tendencias.slice(1, 3).map((t) => `${t.label} (${t.n})`).join(' y ')
      resumen += ` También se repite ${otros}.`
    }
  }

  return { conNotas: total, tendencias, resumen }
}
