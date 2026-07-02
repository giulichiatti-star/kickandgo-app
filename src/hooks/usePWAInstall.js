import { useState, useEffect } from 'react'

const KEY_INICIO = 'kg_pwa_prompted_inicio'
const KEY_ENVIVO = 'kg_pwa_prompted_envivo'

export function usePWAInstall(contexto = 'inicio') {
  const KEY = contexto === 'envivo' ? KEY_ENVIVO : KEY_INICIO
  const [prompt, setPrompt] = useState(null)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(KEY)) return
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setMostrar(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instalar() {
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    localStorage.setItem(KEY_INICIO, 'true')
    localStorage.setItem(KEY_ENVIVO, 'true')
    setMostrar(false)
  }

  function descartar() {
    localStorage.setItem(KEY, 'true')
    setMostrar(false)
  }

  return { mostrar, instalar, descartar }
}
