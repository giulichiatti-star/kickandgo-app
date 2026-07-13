import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { registrarVista } from '../lib/analytics'

// Mide cuánto tiempo pasa el usuario en cada ruta y lo registra al navegar
// a la siguiente. Solo activo cuando `activo` es true (usuario logueado).
export function useAnalyticsTracker(activo) {
  const location = useLocation()
  const prevRef = useRef(null) // { ruta, desde }

  useEffect(() => {
    if (!activo) { prevRef.current = null; return }
    const ahora = Date.now()
    const prev = prevRef.current
    if (prev) {
      const segundos = Math.round((ahora - prev.desde) / 1000)
      // Descarta lapsos absurdos (pestaña dejada abierta horas, reloj del
      // sistema cambiado, etc.) para no ensuciar el promedio del ranking.
      if (segundos > 0 && segundos < 3600) registrarVista(prev.ruta, segundos)
    }
    prevRef.current = { ruta: location.pathname, desde: ahora }
  }, [location.pathname, activo])

  // Al cerrar/recargar la pestaña, intenta registrar el último tramo con
  // sendBeacon (no bloquea el unload, mejor esfuerzo — puede perderse).
  useEffect(() => {
    function onHide() {
      if (!activo || !prevRef.current) return
      const segundos = Math.round((Date.now() - prevRef.current.desde) / 1000)
      if (segundos > 0 && segundos < 3600) registrarVista(prevRef.current.ruta, segundos)
    }
    function onVisibility() { if (document.hidden) onHide() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
    }
  }, [activo])
}
