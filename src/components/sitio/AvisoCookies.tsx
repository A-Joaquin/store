'use client'

import { useSyncExternalStore } from 'react'

import s from './AvisoCookies.module.css'

const CLAVE = 'whatice_cookies_ok'
const oyentes = new Set<() => void>()

function aceptado() {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

// Caja negra fija abajo a la derecha (como el sitio estático, solo en móvil).
export function AvisoCookies() {
  const ok = useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    aceptado,
    // En el servidor no se muestra: así no aparece y desaparece al hidratar.
    () => true,
  )
  if (ok) return null
  return (
    <div className={s.aviso} role="region" aria-label="Aviso de cookies" data-contraste-ignorar>
      <p>
        Usamos{' '}
        <a href="#" className={s.enlace}>
          cookies
        </a>
      </p>
      <button
        type="button"
        className={s.cerrar}
        aria-label="Cerrar aviso de cookies"
        onClick={() => {
          try {
            localStorage.setItem(CLAVE, '1')
          } catch {
            // Sin almacenamiento: se oculta solo en esta visita.
          }
          oyentes.forEach((f) => f())
        }}
      />
    </div>
  )
}
