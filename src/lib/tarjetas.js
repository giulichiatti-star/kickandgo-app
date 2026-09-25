import { supabase } from './supabase'
import { cacheSet, cacheGet } from './cache'

function hoyISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

// Minúsculas, sin tildes y con espacios colapsados: para comparar nombres.
const norm = (s) => (s || '').toString().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
// Los eventos del acta guardan el jugador como texto "#16 Scott Sanchez".
const nombreDeEvento = (jugador) => norm(String(jugador || '').replace(/^#\s*\d+\s*/, ''))
const minutoNum = (m) => { const n = parseInt(m, 10); return Number.isFinite(n) ? n : null }

export async function listarTarjetas(equipoId) {
  // Sin equipo → vacío (evita traer las tarjetas de todos los equipos).
  if (!equipoId) return []
  const key = 'tarjetas_' + equipoId
  try {
    let q = supabase.from('tarjetas').select('*').order('creado', { ascending: false }).eq('equipo_id', equipoId)
    const { data, error } = await q
    if (error) throw error
    cacheSet(key, data)
    return data
  } catch (err) {
    const cached = cacheGet(key)
    if (cached !== null) return cached
    throw err
  }
}

// ── Sincronización acta del partido ↔ Disciplina ─────────────────────────
// Una tarjeta es un hecho del partido: vive en el acta (partidos.notas, lo que
// ve el Informe) y en la tabla tarjetas (Disciplina, ficha del jugador,
// alertas, Asistente…). tarjetas.partido_id enlaza ambas.

// Tarjetas propias (amarilla/roja) de un acta → [{ jugador_id, tipo, minuto }].
// Resuelve el jugador por jugador_id y, si el acta es antigua y solo tiene el
// texto "#N Nombre", por nombre (solo si es único en la plantilla).
export function tarjetasDeEventos(eventos, jugadores) {
  const lista = jugadores || []
  const porId = new Map(lista.map((j) => [j.id, j]))
  const repeticiones = {}
  lista.forEach((j) => { const k = norm(j.nombre); repeticiones[k] = (repeticiones[k] || 0) + 1 })
  const porNombre = new Map()
  lista.forEach((j) => { const k = norm(j.nombre); if (repeticiones[k] === 1) porNombre.set(k, j) })

  const tarjetas = [], sinResolver = []
  for (const e of Array.isArray(eventos) ? eventos : []) {
    if (!e || (e.tipo !== 'amarilla' && e.tipo !== 'roja')) continue
    let j = e.jugador_id ? porId.get(e.jugador_id) : null
    if (!j && e.jugador) j = porNombre.get(nombreDeEvento(e.jugador)) || null
    if (!j) { sinResolver.push(e); continue }
    tarjetas.push({ jugador_id: j.id, tipo: e.tipo, minuto: minutoNum(e.min) })
  }
  return { tarjetas, sinResolver }
}

// Acta → Disciplina. Idempotente: se puede llamar varias veces para el mismo
// partido sin duplicar (compara cuántas tarjetas hay ya por jugador/tipo/día).
export async function sincronizarTarjetasPartido({ id, fecha, rival, eventos }, equipoId) {
  const vacio = { insertadas: 0, enlazadas: 0, sinResolver: 0 }
  if (!id || !equipoId) return vacio

  const { data: jugs, error: errJ } = await supabase.from('jugadores').select('id, nombre, activo').eq('equipo_id', equipoId)
  if (errJ) throw errJ
  const { tarjetas: deActa, sinResolver } = tarjetasDeEventos(eventos, (jugs || []).filter((j) => j.activo !== false))
  if (!deActa.length) return { ...vacio, sinResolver: sinResolver.length }

  const fechaISO = String(fecha || hoyISO()).slice(0, 10)
  const { data: existentes, error: errT } = await supabase.from('tarjetas')
    .select('id, jugador_id, tipo, partido_id').eq('equipo_id', equipoId).eq('fecha', fechaISO)
  if (errT) throw errT
  const { data: u } = await supabase.auth.getUser()

  const grupos = {}
  deActa.forEach((t) => {
    const k = t.jugador_id + '|' + t.tipo
    if (!grupos[k]) grupos[k] = []
    grupos[k].push(t)
  })

  const nuevas = [], aEnlazar = []
  Object.keys(grupos).forEach((k) => {
    const lista = grupos[k]
    // Tarjetas que ya cubren este partido: las suyas o las manuales del mismo día.
    const propias = (existentes || []).filter((x) => x.jugador_id + '|' + x.tipo === k && (!x.partido_id || x.partido_id === id))
    propias.filter((x) => !x.partido_id).slice(0, lista.length).forEach((x) => aEnlazar.push(x.id))
    const faltan = lista.length - propias.length
    if (faltan > 0) {
      lista.slice(-faltan).forEach((t) => nuevas.push({
        user_id: u.user.id, equipo_id: equipoId, jugador_id: t.jugador_id, tipo: t.tipo,
        fecha: fechaISO, minuto: t.minuto, motivo: rival ? `vs ${rival}` : '', partido_id: id,
      }))
    }
  })

  if (aEnlazar.length) {
    const { error } = await supabase.from('tarjetas').update({ partido_id: id }).in('id', aEnlazar)
    if (error) throw error
  }
  if (nuevas.length) {
    const { error } = await supabase.from('tarjetas').insert(nuevas)
    if (error) throw error
  }
  return { insertadas: nuevas.length, enlazadas: aEnlazar.length, sinResolver: sinResolver.length }
}

// Disciplina → acta. Una tarjeta creada a mano en un día con partido se enlaza
// con él y, si el acta no la tenía, se añade como evento. Si ese día hay más de
// un partido (o ninguno) no se enlaza: es una tarjeta suelta.
async function enlazarConPartido(tarjeta, equipoId) {
  if (!tarjeta || tarjeta.partido_id || !tarjeta.fecha) return
  const { data: partidos, error } = await supabase.from('partidos').select('id, notas')
    .eq('equipo_id', equipoId).eq('activo', true).eq('fecha', tarjeta.fecha)
  if (error) throw error
  if (!partidos || partidos.length !== 1) return
  const p = partidos[0]

  const { data: j } = await supabase.from('jugadores').select('id, nombre, dorsal').eq('id', tarjeta.jugador_id).maybeSingle()
  if (!j) return

  const notas = Array.isArray(p.notas) ? [...p.notas] : []
  const enActa = notas.filter((e) => e && e.tipo === tarjeta.tipo && (e.jugador_id === j.id || nombreDeEvento(e.jugador) === norm(j.nombre))).length
  const { data: enlazadas } = await supabase.from('tarjetas').select('id')
    .eq('equipo_id', equipoId).eq('jugador_id', j.id).eq('tipo', tarjeta.tipo).eq('partido_id', p.id)

  // Si el acta ya tiene un evento sin tarjeta que lo respalde, esta tarjeta es
  // ese evento: solo se enlaza. Si no, hay que añadirlo al acta.
  if (enActa <= (enlazadas ? enlazadas.length : 0)) {
    const ev = {
      min: minutoNum(tarjeta.minuto), tipo: tarjeta.tipo, label: tarjeta.tipo === 'roja' ? 'Roja' : 'Amarilla',
      jugador: `#${j.dorsal} ${j.nombre}`, jugador_id: j.id,
    }
    let pos = notas.length
    if (ev.min !== null) {
      const i = notas.findIndex((e) => (parseInt(e && e.min, 10) || 0) <= ev.min)
      if (i !== -1) pos = i
    }
    notas.splice(pos, 0, ev)
    const { error: errP } = await supabase.from('partidos').update({ notas }).eq('id', p.id)
    if (errP) throw errP
  }
  const { error: errL } = await supabase.from('tarjetas').update({ partido_id: p.id }).eq('id', tarjeta.id)
  if (errL) throw errL
}

// Quita del acta el evento que corresponde a una tarjeta borrada.
async function quitarDeActa(t) {
  const { data: p } = await supabase.from('partidos').select('id, notas').eq('id', t.partido_id).maybeSingle()
  if (!p || !Array.isArray(p.notas)) return
  const { data: j } = await supabase.from('jugadores').select('id, nombre').eq('id', t.jugador_id).maybeSingle()
  const coincide = (e) => e && e.tipo === t.tipo && (e.jugador_id === t.jugador_id || (j && nombreDeEvento(e.jugador) === norm(j.nombre)))
  let i = p.notas.findIndex((e) => coincide(e) && minutoNum(e.min) === minutoNum(t.minuto))
  if (i === -1) i = p.notas.findIndex(coincide)
  if (i === -1) return
  const { error } = await supabase.from('partidos').update({ notas: p.notas.filter((_, k) => k !== i) }).eq('id', p.id)
  if (error) throw error
}

export async function crearTarjeta(t, equipoId) {
  const { data: u } = await supabase.auth.getUser()
  const payload = {
    user_id: u.user.id,
    equipo_id: equipoId,
    jugador_id: t.jugador_id,
    tipo: t.tipo || 'amarilla',
    fecha: t.fecha || hoyISO(),
    minuto: t.minuto || null,
    motivo: t.motivo || '',
  }
  const { data, error } = await supabase.from('tarjetas').insert(payload).select().single()
  if (error) throw error
  // La tarjeta ya está guardada; enlazarla con el acta es un extra que no debe
  // hacer fallar el guardado si algo sale mal.
  try { await enlazarConPartido(data, equipoId) } catch (err) { console.error('[tarjetas] enlazar con partido', err) }
  return data
}

export async function borrarTarjeta(id) {
  const { data: t } = await supabase.from('tarjetas').select('id, partido_id, jugador_id, tipo, minuto').eq('id', id).maybeSingle()
  const { error } = await supabase.from('tarjetas').delete().eq('id', id)
  if (error) throw error
  if (t && t.partido_id) {
    try { await quitarDeActa(t) } catch (err) { console.error('[tarjetas] quitar del acta', err) }
  }
}

export async function borrarTodasTarjetas(equipoId) {
  if (!equipoId) return
  const { error } = await supabase.from('tarjetas').delete().eq('equipo_id', equipoId)
  if (error) throw error
}
