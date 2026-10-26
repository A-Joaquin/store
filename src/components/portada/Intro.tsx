'use client'

import { useState, useSyncExternalStore } from 'react'

import s from './Intro.module.css'

const CLAVE = 'whatice_intro'
const UNA_HORA = 3600

// Se decide una sola vez por carga de página: ¿hubo una intro completa hace
// menos de una hora? Si no, se registra esta.
let decision: boolean | null = null
function esRepetida() {
  if (decision !== null) return decision
  const ahora = Math.floor(Date.now() / 1000)
  try {
    const ultima = Number(localStorage.getItem(CLAVE)) || 0
    decision = ultima > 0 && ahora - ultima <= UNA_HORA
    if (!decision) localStorage.setItem(CLAVE, String(ahora))
  } catch {
    decision = false
  }
  return decision
}

export function Intro() {
  // En el servidor se renderiza la intro completa (sin JS también termina sola).
  const repetida = useSyncExternalStore(
    () => () => {},
    esRepetida,
    () => false,
  )
  const [terminada, setTerminada] = useState(false)
  if (terminada) return null

  return (
    <div
      className={`${s.intro} ${repetida ? s.rapida : ''}`}
      aria-hidden="true"
      onAnimationEnd={(e) => e.target === e.currentTarget && setTerminada(true)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
      <img className={s.logo} src="/wordmark.svg" alt="" width={260} height={78} />
    </div>
  )
}
