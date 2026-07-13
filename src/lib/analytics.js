import { supabase } from './supabase'

// Nombres legibles para las rutas técnicas, usados en el panel admin.
export const NOMBRE_RUTA = {
  '/inicio': 'Inicio', '/calendario': 'Calendario', '/plantilla': 'Plantilla',
  '/convocatoria': 'Convocatoria', '/envivo': 'En Vivo', '/informes': 'Informes',
  '/entrenamientos': 'Entrenamientos', '/estadisticas': 'Estadísticas',
  '/rivales': 'Rivales', '/temporada': 'Plan Temporada', '/pizarra': 'Pizarra táctica',
  '/amonestaciones': 'Amonestaciones', '/predicciones': 'Probabilidades',
  '/clima': 'Clima', '/asistente': 'Asistente IA', '/ajustes': 'Ajustes',
}
export function nombreRuta(ruta) { return NOMBRE_RUTA[ruta] || ruta }

// Registra el tiempo (segundos) que el usuario pasó en una ruta. Falla en
// silencio a propósito — la analítica nunca debe romper la experiencia de uso.
export async function registrarVista(ruta, segundos) {
  try {
    const { data: u } = await supabase.auth.getUser()
    if (!u?.user) return
    await supabase.from('analytics_eventos').insert({ user_id: u.user.id, ruta, segundos })
  } catch { /* silencioso a propósito */ }
}

// Trae los eventos de los últimos `dias` días, junto con los perfiles
// (club/entrenador/email) para poder mostrar nombres legibles en el ranking.
// Solo funciona si el usuario logueado es admin (lo filtra la política RLS).
export async function listarUsoApp(dias = 30) {
  const desde = new Date(Date.now() - dias * 86400000).toISOString()
  const [{ data: eventos, error: e1 }, { data: perfiles, error: e2 }] = await Promise.all([
    supabase.from('analytics_eventos').select('user_id, ruta, segundos, creado').gte('creado', desde),
    supabase.from('profiles').select('id, club_nombre, entrenador, email'),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const perfilPorId = new Map((perfiles || []).map(p => [p.id, p]))

  const porUsuario = new Map()
  const porRuta = new Map()
  ;(eventos || []).forEach(ev => {
    const seg = ev.segundos || 0

    const u = porUsuario.get(ev.user_id) || { userId: ev.user_id, segundos: 0, eventos: 0, ultimaVisita: ev.creado }
    u.segundos += seg
    u.eventos += 1
    if (ev.creado > u.ultimaVisita) u.ultimaVisita = ev.creado
    porUsuario.set(ev.user_id, u)

    const r = porRuta.get(ev.ruta) || { ruta: ev.ruta, segundos: 0, eventos: 0 }
    r.segundos += seg
    r.eventos += 1
    porRuta.set(ev.ruta, r)
  })

  const usuarios = Array.from(porUsuario.values())
    .map(u => {
      const p = perfilPorId.get(u.userId)
      return { ...u, club: p?.club_nombre || '—', entrenador: p?.entrenador || '', email: p?.email || '' }
    })
    .sort((a, b) => b.segundos - a.segundos)

  const secciones = Array.from(porRuta.values()).sort((a, b) => b.segundos - a.segundos)

  return { usuarios, secciones, totalEventos: (eventos || []).length }
}
