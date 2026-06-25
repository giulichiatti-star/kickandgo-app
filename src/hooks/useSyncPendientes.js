import { useEffect, useState } from 'react'
import { guardarPartido } from '../lib/partidos'

export function useSyncPendientes() {
  const [pendientes, setPendientes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kg_pendientes') || '[]') } catch { return [] }
  })

  async function sincronizar() {
    const lista = JSON.parse(localStorage.getItem('kg_pendientes') || '[]')
    if (!lista.length) return
    const fallidos = []
    for (const p of lista) {
      try {
        await guardarPartido(p, p._eid)
      } catch {
        fallidos.push(p)
      }
    }
    localStorage.setItem('kg_pendientes', JSON.stringify(fallidos))
    setPendientes(fallidos)
  }

  useEffect(() => {
    window.addEventListener('online', sincronizar)
    return () => window.removeEventListener('online', sincronizar)
  }, [])

  return { pendientes: pendientes.length, sincronizar }
}
