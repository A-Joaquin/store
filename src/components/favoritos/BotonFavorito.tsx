'use client'

import s from './BotonFavorito.module.css'
import { useFavoritos } from './Favoritos'

type Props = {
  slug: string
  nombre: string
  // "icono": corazón solo (tarjetas). "texto": corazón + texto (ficha, vista rápida).
  variante?: 'icono' | 'texto'
  className?: string
}

export const Corazon = ({ lleno }: { lleno: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={s.corazon}>
    <path
      d="M12 20.3s-7.6-4.6-9.1-9.4C1.8 7.4 4 4.3 7.2 4.3c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.2 0 5.4 3.1 4.3 6.6-1.5 4.8-9.1 9.4-9.1 9.4z"
      fill={lleno ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
)

export function BotonFavorito({ slug, nombre, variante = 'icono', className }: Props) {
  const favoritos = useFavoritos()
  const activo = favoritos.es(slug)
  return (
    <button
      type="button"
      className={`${variante === 'icono' ? s.icono : s.texto} ${activo ? s.activo : ''} ${className ?? ''}`}
      aria-pressed={activo}
      aria-label={activo ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`}
      onClick={(e) => {
        // En las tarjetas el botón está sobre el enlace de la foto.
        e.preventDefault()
        e.stopPropagation()
        favoritos.alternar(slug)
      }}
    >
      <Corazon lleno={activo} />
      {variante === 'texto' && <span>{activo ? 'En favoritos' : 'Agregar a favoritos'}</span>}
    </button>
  )
}
