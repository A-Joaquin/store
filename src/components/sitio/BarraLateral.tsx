'use client'

import { useCarrito } from '@/components/carrito/Carrito'

import s from './BarraLateral.module.css'
import c from './Cabecera.module.css'
import { Lupa } from './Iconos'

export function BarraLateral() {
  const carrito = useCarrito()
  return (
    <div className={s.lateral}>
      {/* TODO: búsqueda (fase 1, pendiente). */}
      <button type="button" className={`${s.item} ${s.buscar}`} aria-label="Buscar">
        <Lupa />
      </button>
      <button type="button" className={`${s.item} ${s.bolsa}`} onClick={carrito.alternar} aria-label={`Bolsa: ${carrito.cantidad}`}>
        <span className={s.vertical}>
          BOLSA<span className={s.burbuja}>{carrito.cantidad}</span>
        </span>
      </button>
      <a href="#" className={`${s.item} ${s.favoritos}`}>
        <span className={`${s.vertical} ${c.tachado}`}>FAVORITOS</span>
      </a>
      <a href="#" className={`${s.item} ${s.cuenta}`}>
        <span className={`${s.vertical} ${c.tachado}`}>CUENTA</span>
      </a>
    </div>
  )
}
