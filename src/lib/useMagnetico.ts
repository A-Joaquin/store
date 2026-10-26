'use client'

import { useMemo, useRef } from 'react'

// Efecto "magnético" del sitio estático (solo escritorio con mouse): mientras
// el puntero está sobre la zona, el elemento se corre hacia él (0,8 s); al
// salir vuelve a su lugar (0,3 s). Devuelve [ref del elemento que se mueve,
// manejadores para la zona].
export function useMagnetico<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const base = useRef<DOMRect | null>(null)

  const zona = useMemo(() => {
    const habilitado = () => window.matchMedia('(min-width: 813px) and (pointer: fine)').matches
    const mover = (x: number, y: number, duracion: number) => {
      const el = ref.current
      if (!el) return
      el.style.transition = `transform ${duracion}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      el.style.transform = x || y ? `translate(${x}px, ${y}px)` : ''
    }
    return {
      onMouseEnter: () => {
        const el = ref.current
        if (!el || !habilitado()) return
        // Caja sin el desplazamiento actual (puede estar volviendo a su lugar).
        const previo = el.style.transform
        el.style.transform = ''
        base.current = el.getBoundingClientRect()
        el.style.transform = previo
      },
      onMouseMove: (e: React.MouseEvent) => {
        const b = base.current
        if (!b || !habilitado()) return
        // Mismo punto de anclaje que el original: 3/4 del ancho, mitad del alto.
        mover(e.clientX - b.left - (b.width * 3) / 4, e.clientY - b.top - b.height / 2, 0.8)
      },
      onMouseLeave: () => {
        base.current = null
        mover(0, 0, 0.3)
      },
    }
  }, [])

  return [ref, zona] as const
}
