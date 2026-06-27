import { useState } from 'react'

export function useBanner(storageKey) {
  const [visible, setVisible] = useState(() => localStorage.getItem(storageKey) !== '1')

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  return { visible, dismiss }
}
