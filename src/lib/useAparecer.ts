'use client'

import { useEffect, useRef, useState } from 'react'

// Devuelve [ref, visible]: visible pasa a true (una sola vez) cuando el
// elemento entra en pantalla. Es el "inview" del sitio estático.
export function useAparecer<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setVisible(true)
        obs.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}
