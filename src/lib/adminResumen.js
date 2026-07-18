// ============================================================
// RESUMEN ADMIN — métricas de negocio del SaaS (solo admin).
// MRR/ingresos, embudo de conversión, churn, cuentas en riesgo y
// tendencias. Cálculo en cliente sobre datos que el admin lee por RLS.
// ============================================================
import { supabase } from './supabase'

export const PRECIOS = { fundador: 19.99, estandar: 24.99 }
export function precioCuenta(c) { return c && c.es_fundador ? PRECIOS.fundador : PRECIOS.estandar }
export const eur = (n) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

function diasEntre(desdeISO, hasta = new Date()) {
  if (!desdeISO) return null
  const d = new Date(desdeISO)
  if (isNaN(d)) return null
  return Math.floor((hasta - d) / 86400000)
}
function mesKey(iso) { return iso ? String(iso).slice(0, 7) : null }
function nombreMes(key) {
  const d = new Date(key + '-01T00:00:00')
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
}

// Genera y descarga un CSV con todas las cuentas (para análisis offline).
export function exportarCuentasCSV(profiles, catsPorUser = {}) {
  const cols = ['club', 'entrenador', 'email', 'plan', 'fundador', 'precio', 'alta', 'ultimo_pago', 'vence', 'categorias']
  const esc = (v) => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const filas = profiles.map((c) => [
    c.club_nombre || '', c.entrenador || '', c.email || '', c.plan_estado || '',
    c.es_fundador ? 'sí' : 'no', precioCuenta(c).toFixed(2),
    (c.creado || '').slice(0, 10), (c.ultimo_pago_en || '').slice(0, 10),
    (c.pago_vence || c.prueba_vence || '').slice(0, 10),
    Array.from(catsPorUser[c.id] || []).join(' / '),
  ].map(esc).join(';'))
  const csv = '﻿' + cols.join(';') + '\n' + filas.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `cuentas_kickandgo_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export async function cargarResumenAdmin() {
  const [pf, ld, ev, ju, pa, en, eq] = await Promise.all([
    supabase.from('profiles').select('id, email, club_nombre, entrenador, activo, plan_estado, prueba_vence, pago_vence, ultimo_pago_en, creado, es_fundador'),
    supabase.from('leads').select('id, estado, respondio, creado, contactado_en, activado_en'),
    supabase.from('analytics_eventos').select('user_id, creado'),
    supabase.from('jugadores').select('user_id'),
    supabase.from('partidos').select('user_id, fecha'),
    supabase.from('entrenamientos').select('user_id'),
    supabase.from('equipos').select('user_id, categoria, division'),
  ])
  const err = [pf, ld, ev, ju, pa, en, eq].find((r) => r.error)
  if (err) throw new Error(err.error.message)
  return {
    profiles: pf.data || [], leads: ld.data || [], eventos: ev.data || [],
    jugadores: ju.data || [], partidos: pa.data || [], entrenos: en.data || [],
    equipos: eq.data || [],
  }
}

export function computeResumen(datos, opts = {}) {
  const hoy = opts.hoy ? new Date(opts.hoy) : new Date()
  const { profiles, leads, eventos, jugadores, partidos, entrenos } = datos

  // Cuenta como "de pago" solo estados que facturan
  const esPagando = (c) => c.plan_estado === 'pagado'
  const enMora = (c) => c.plan_estado === 'mora'
  const enPrueba = (c) => c.plan_estado === 'prueba'
  const deBaja = (c) => c.plan_estado === 'baja'

  const pagadas = profiles.filter(esPagando)
  const morosas = profiles.filter(enMora)
  const pruebas = profiles.filter(enPrueba)
  const bajas = profiles.filter(deBaja)
  const fundadores = profiles.filter((c) => c.es_fundador).length

  // ── Dinero ──
  const mrr = pagadas.reduce((a, c) => a + precioCuenta(c), 0)
  const enRiesgoMonto = morosas.reduce((a, c) => a + precioCuenta(c), 0)   // dinero en mora
  const churnedMonto = bajas.reduce((a, c) => a + precioCuenta(c), 0)      // MRR perdido por bajas
  const ventana = (dias) => pagadas
    .filter((c) => { const d = diasEntre2(hoy, c.pago_vence); return d != null && d >= 0 && d <= dias })
    .reduce((a, c) => a + precioCuenta(c), 0)
  function diasEntre2(desde, hastaISO) {
    if (!hastaISO) return null
    const d = new Date(hastaISO); if (isNaN(d)) return null
    return Math.floor((d - desde) / 86400000)
  }
  const dinero = {
    mrr, arr: mrr * 12,
    ticketMedio: pagadas.length ? mrr / pagadas.length : 0,
    cobros7: ventana(7), cobros30: ventana(30),
    enRiesgoMonto, churnedMonto,
  }

  // ── Cuentas ──
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const altasMes = profiles.filter((c) => c.creado && new Date(c.creado) >= inicioMes).length
  const cuentas = {
    total: profiles.length,
    activas: profiles.filter((c) => c.activo).length,
    prueba: pruebas.length, pagado: pagadas.length, mora: morosas.length, baja: bajas.length,
    fundadores, altasMes,
  }

  // ── Embudo ──
  const leadsTotal = leads.length
  const contactados = leads.filter((l) => l.contactado_en || l.estado === 'contactado' || l.estado === 'activo').length
  const convertidos = leads.filter((l) => l.activado_en || l.estado === 'activo').length
  const pagandoN = pagadas.length
  const p = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0)
  const embudo = {
    pasos: [
      { label: 'Leads', n: leadsTotal, pct: 100 },
      { label: 'Contactados', n: contactados, pct: p(contactados, leadsTotal) },
      { label: 'Cuenta creada', n: convertidos, pct: p(convertidos, leadsTotal) },
      { label: 'Pagando', n: pagandoN, pct: p(pagandoN, leadsTotal) },
    ],
    convLeadCuenta: p(convertidos, leadsTotal),
    convPruebaPago: p(pagandoN, pagandoN + pruebas.length),
  }

  // ── Churn (acumulado, sin fecha de baja histórica) ──
  const baseFacturable = pagadas.length + morosas.length + bajas.length
  const churn = {
    bajas: bajas.length,
    churnPct: baseFacturable ? Math.round((bajas.length / baseFacturable) * 100) : 0,
  }

  // ── Actividad por cuenta ──
  const ultActividad = {}
  eventos.forEach((e) => {
    if (!e.user_id || !e.creado) return
    if (!ultActividad[e.user_id] || e.creado > ultActividad[e.user_id]) ultActividad[e.user_id] = e.creado
  })
  const contarPor = (arr) => { const m = {}; arr.forEach((x) => { if (x.user_id) m[x.user_id] = (m[x.user_id] || 0) + 1 }); return m }
  const nJug = contarPor(jugadores), nPar = contarPor(partidos), nEnt = contarPor(entrenos)

  // ── Cuentas en riesgo / dormidas (entre activas y en prueba, no bajas) ──
  const riesgo = profiles
    .filter((c) => c.plan_estado !== 'baja')
    .map((c) => {
      const dias = diasEntre(ultActividad[c.id], hoy)
      const jg = nJug[c.id] || 0, pj = nPar[c.id] || 0, et = nEnt[c.id] || 0
      const diasVence = c.plan_estado === 'prueba' ? diasEntre2(hoy, c.prueba_vence) : null
      const senales = []
      if (dias == null) senales.push('Nunca ha entrado')
      else if (dias >= 14) senales.push(`Sin usar ${dias} d`)
      if (jg === 0) senales.push('0 jugadores')
      if (pj === 0) senales.push('0 partidos')
      if (c.plan_estado === 'mora') senales.push('En mora')
      if (diasVence != null && diasVence >= 0 && diasVence <= 3) senales.push(`Prueba vence ${diasVence}d`)
      // severidad para ordenar
      let sev = 0
      if (c.plan_estado === 'mora') sev += 5
      if (dias == null) sev += 4
      else if (dias >= 30) sev += 4; else if (dias >= 14) sev += 2
      if (jg === 0 && pj === 0) sev += 3
      if (diasVence != null && diasVence >= 0 && diasVence <= 3) sev += 2
      return { id: c.id, club: c.club_nombre || '—', entrenador: c.entrenador || '—', plan: c.plan_estado, dias, jug: jg, par: pj, ent: et, senales, sev }
    })
    .filter((x) => x.senales.length > 0)
    .sort((a, b) => b.sev - a.sev)

  // ── Tendencias (últimos 6 meses) ──
  const meses = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const altasPorMesMap = {}
  profiles.forEach((c) => { const k = mesKey(c.creado); if (k) altasPorMesMap[k] = (altasPorMesMap[k] || 0) + 1 })
  let acum = profiles.filter((c) => mesKey(c.creado) && mesKey(c.creado) < meses[0]).length
  const tendencias = meses.map((k) => {
    const altas = altasPorMesMap[k] || 0
    acum += altas
    return { mes: nombreMes(k), altas, acumulado: acum }
  })

  // ── Health score por cuenta (0–100) ──
  function healthDe(c) {
    let s = 0
    // Pago (0–40)
    s += c.plan_estado === 'pagado' ? 40 : c.plan_estado === 'prueba' ? 25 : c.plan_estado === 'mora' ? 10 : 0
    // Uso reciente (0–35)
    const d = diasEntre(ultActividad[c.id], hoy)
    s += d == null ? 0 : d <= 2 ? 35 : d <= 7 ? 28 : d <= 14 ? 18 : d <= 30 ? 8 : 2
    // Datos cargados (0–25)
    const jg = nJug[c.id] || 0, pj = nPar[c.id] || 0, et = nEnt[c.id] || 0
    s += (jg >= 8 ? 10 : jg > 0 ? 5 : 0) + (pj > 0 ? 8 : 0) + (et > 0 ? 7 : 0)
    return Math.min(100, s)
  }
  const salud = profiles
    .filter((c) => c.plan_estado !== 'baja')
    .map((c) => ({
      id: c.id, club: c.club_nombre || '—', entrenador: c.entrenador || '—', plan: c.plan_estado,
      score: healthDe(c),
      dias: diasEntre(ultActividad[c.id], hoy),
      jug: nJug[c.id] || 0, par: nPar[c.id] || 0,
    }))
    .sort((a, b) => b.score - a.score)
  const saludResumen = {
    media: salud.length ? Math.round(salud.reduce((a, x) => a + x.score, 0) / salud.length) : 0,
    champions: salud.filter((x) => x.score >= 70).length,
    ok: salud.filter((x) => x.score >= 40 && x.score < 70).length,
    riesgoN: salud.filter((x) => x.score < 40).length,
    top: salud.slice(0, 5),
  }

  // ── Activación (time-to-value): primer partido dentro de 7 días del alta ──
  const primerPartido = {}
  partidos.forEach((p) => {
    if (!p.user_id || !p.fecha) return
    if (!primerPartido[p.user_id] || p.fecha < primerPartido[p.user_id]) primerPartido[p.user_id] = p.fecha
  })
  const hace90 = new Date(hoy); hace90.setDate(hace90.getDate() - 90)
  const nuevas90 = profiles.filter((c) => c.creado && new Date(c.creado) >= hace90)
  const activadas = nuevas90.filter((c) => {
    const fp = primerPartido[c.id]
    if (!fp) return false
    const dif = (new Date(fp) - new Date(c.creado)) / 86400000
    return dif >= -1 && dif <= 7
  }).length
  const activacion = {
    ventana: 'últimos 90 días',
    nuevas: nuevas90.length,
    activadas,
    pct: nuevas90.length ? Math.round((activadas / nuevas90.length) * 100) : 0,
    conPartido: profiles.filter((c) => (nPar[c.id] || 0) > 0).length,
    conPlantilla: profiles.filter((c) => (nJug[c.id] || 0) >= 8).length,
  }

  // ── Cohortes de retención por mes de alta (últimos 6) ──
  const cohortes = meses.map((k) => {
    const grupo = profiles.filter((c) => mesKey(c.creado) === k)
    const activos = grupo.filter((c) => c.activo).length
    return { mes: nombreMes(k), total: grupo.length, activos, retencion: grupo.length ? Math.round((activos / grupo.length) * 100) : 0 }
  })

  // ── LTV estimado (orientativo) ──
  const arpu = cuentas.pagado ? mrr / cuentas.pagado : 0
  const ltv = {
    arpu,
    // Vida media ≈ 1/churn. Usamos el churn acumulado como aproximación (orientativo).
    ltv: churn.churnPct > 0 ? arpu / (churn.churnPct / 100) : null,
  }

  // Categorías/divisiones por cuenta (para etiquetas y export)
  const catsPorUser = {}
  ;(datos.equipos || []).forEach((e) => {
    if (!e.user_id) return
    const set = catsPorUser[e.user_id] || (catsPorUser[e.user_id] = new Set())
    if (e.categoria && e.categoria.trim()) set.add(e.categoria.trim())
  })

  return {
    dinero, cuentas, embudo, churn, riesgo, tendencias,
    salud: saludResumen, activacion, cohortes, ltv,
    catsPorUser,
    sinActividad: eventos.length === 0,
  }
}
