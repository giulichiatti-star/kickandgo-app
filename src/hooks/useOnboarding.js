import { useState, useCallback } from 'react'

const KEY_STEP = 'kg_onboarding_step'
const KEY_DONE = 'kg_onboarding_done'

export function useOnboarding() {
  const [paso, setPaso] = useState(() => {
    if (localStorage.getItem(KEY_DONE)) return null
    return parseInt(localStorage.getItem(KEY_STEP) || '1', 10)
  })

  const avanzar = useCallback((siguiente) => {
    if (siguiente > 4) {
      localStorage.setItem(KEY_DONE, 'true')
      localStorage.removeItem(KEY_STEP)
      setPaso(null)
    } else {
      localStorage.setItem(KEY_STEP, String(siguiente))
      setPaso(siguiente)
    }
  }, [])

  const saltar = useCallback(() => {
    localStorage.setItem(KEY_DONE, 'true')
    localStorage.removeItem(KEY_STEP)
    setPaso(null)
  }, [])

  return { paso, avanzar, saltar }
}
