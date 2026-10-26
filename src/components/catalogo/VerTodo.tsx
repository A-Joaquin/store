'use client'

import { useAparecer } from '@/lib/useAparecer'

import s from './BloqueColeccion.module.css'

// Contenedor del enlace "VER TODO →": el subrayado se dibuja al aparecer.
export function VerTodo({ children }: { children: React.ReactNode }) {
  const [ref, visible] = useAparecer<HTMLDivElement>()
  return (
    <div ref={ref} className={`${s.verTodo} ${visible ? s.verTodoVisible : ''}`}>
      {children}
    </div>
  )
}
