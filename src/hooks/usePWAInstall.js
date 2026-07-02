import { useState, useEffect } from 'react'

const KEY_INICIO = 'kg_pwa_prompted_inicio'
const KEY_ENVIVO = 'kg_pwa_prompted_envivo'
const KEY_CONVO = 'kg_pwa_prompted_convocatoria'

function keyForContexto(contexto) {
  if (contexto === 'envivo') return KEY_ENVIVO
  if (contexto === 'convocatoria') return KEY_CONVO
  return KEY_INICIO
}

export function usePWAInstall(contexto = 'inicio') {
  const KEY = keyForContexto(contexto)
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
    localStorage.setItem(KEY_CONVO, 'done')
    setMostrar(false)
  }

  function descartar() {
    localStorage.setItem(KEY, 'true')
    setMostrar(false)
  }

  return { mostrar, instalar, descartar }
}
