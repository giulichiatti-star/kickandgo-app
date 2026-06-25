import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { listarEquipos, crearEquipo as _crear, actualizarEquipo as _actualizar } from '../lib/equipos'

const Ctx = createContext(null)
const LS_KEY = 'kg_equipo_activo'

export function EquipoProvider({ children }) {
  const [equipos, setEquipos] = useState([])
  const [equipoActivo, setActivoState] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const lista = await listarEquipos()
      setEquipos(lista)
      const savedId = localStorage.getItem(LS_KEY)
      const saved = lista.find((e) => e.id === savedId)
      setActivoState(saved || lista[0] || null)
    } catch { /* noop */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function setEquipoActivo(eq) {
    setActivoState(eq)
    if (eq) localStorage.setItem(LS_KEY, eq.id)
  }

  async function crearEquipo(datos) {
    const nuevo = await _crear(datos)
    setEquipos((p) => [...p, nuevo])
    setEquipoActivo(nuevo)
    return nuevo
  }

  function actualizarLocal(eq) {
    setEquipos((p) => p.map((e) => (e.id === eq.id ? eq : e)))
    if (equipoActivo?.id === eq.id) setActivoState(eq)
  }

  async function actualizarEquipo(id, cambios) {
    const actualizado = await _actualizar(id, cambios)
    actualizarLocal(actualizado)
    return actualizado
  }

  return (
    <Ctx.Provider value={{ equipos, equipoActivo, setEquipoActivo, crearEquipo, actualizarEquipo, actualizarLocal, cargando, recargar: cargar }}>
      {children}
    </Ctx.Provider>
  )
}

export function useEquipo() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEquipo debe usarse dentro de EquipoProvider')
  return ctx
}
