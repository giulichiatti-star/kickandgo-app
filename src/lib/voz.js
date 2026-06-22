// Clasifica una frase hablada en un evento.
// Faltas: "falta" sola = nosotros cometemos (falta en contra). "falta a favor" = nos la hacen.
function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const NUM_PALABRAS = {
  uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8,
  nueve:9, diez:10, once:11, doce:12, trece:13, catorce:14, quince:15,
  dieciseis:16, diecisiete:17, dieciocho:18, diecinueve:19, veinte:20,
  veintiuno:21, veintidos:22, veintitres:23, veinticuatro:24, veinticinco:25,
  veintiseis:26, veintisiete:27, veintiocho:28, veintinueve:29, treinta:30,
}

function extraerDorsal(t) {
  // Primero intenta dígitos: "el 4", "del 4", "#4"
  const numD = t.match(/(?:^|\s|#)(\d{1,2})(?:\s|$)/)
  if (numD) return parseInt(numD[1], 10)
  // Luego palabras: "el cuatro", "del nueve"
  for (const [word, val] of Object.entries(NUM_PALABRAS)) {
    if (new RegExp(`\\b${word}\\b`).test(t)) return val
  }
  return null
}

export function clasificarVoz(texto, titulares = [], clubNombre = '', rivalNombre = '') {
  const t = norm(texto)
  const clubNorm = norm(clubNombre).split(/\s+/).filter(w => w.length >= 3)
  const rivalNorm = norm(rivalNombre).split(/\s+/).filter(w => w.length >= 3)
  const mencionaRival = rivalNorm.some(w => t.includes(w))
  // Por defecto siempre nuestro equipo, salvo que mencione al rival explícitamente
  const contra = mencionaRival
    || /en contra|contrari|\brival\b|\bellos\b|del otro|nos (metieron|marcaron|hicieron)/.test(t)

  let tipo = null
  if (/\bgol|golazo|anoto|marco\b/.test(t) && !/sin gol|casi/.test(t)) tipo = contra ? 'gol-rival' : 'gol'
  else if (/roja|expuls/.test(t)) tipo = 'roja'
  else if (/amarilla|amonest/.test(t)) tipo = 'amarilla'
  else if (/asistenci|asist/.test(t)) tipo = 'asistencia'
  else if (/corner|esquina/.test(t)) tipo = 'corner'
  else if (/cambio|sustituc/.test(t)) tipo = 'cambio'
  else if (/falta.*(a favor|nos han|nos hicieron)/.test(t)) tipo = 'falta-favor'
  else if (/falta/.test(t)) tipo = 'falta'
  else if (/tiro|remate|disparo/.test(t)) tipo = 'tiro'

  if (!tipo) return null

  // jugador por número (dígito o palabra)
  let jugador = null
  const dorsal = extraerDorsal(t)
  if (dorsal != null) jugador = titulares.find((j) => Number(j.dorsal) === dorsal) || null
  // jugador por nombre/apellido
  if (!jugador) {
    for (const j of titulares) {
      const partes = norm(j.nombre).split(/\s+/)
      if (partes.some((p) => p.length >= 3 && t.includes(p))) { jugador = j; break }
    }
  }
  return { tipo, jugador }
}

export function vozSoportada() {
  return typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
}
