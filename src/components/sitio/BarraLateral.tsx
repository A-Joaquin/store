'use client'

import { useCarrito } from '@/components/carrito/Carrito'
import { useMagnetico } from '@/lib/useMagnetico'

import s from './BarraLateral.module.css'
import c from './Cabecera.module.css'
import { Lupa } from './Iconos'

export function BarraLateral() {
  const carrito = useCarrito()
  const [refBuscar, zonaBuscar] = useMagnetico<HTMLSpanElement>()
  const [refBolsa, zonaBolsa] = useMagnetico<HTMLSpanElement>()
  const [refFavoritos, zonaFavoritos] = useMagnetico<HTMLSpanElement>()
  const [refCuenta, zonaCuenta] = useMagnetico<HTMLSpanElement>()

  return (
    <div className={s.lateral} data-contraste-ignorar>
      {/* TODO: búsqueda (fase 1, pendiente). */}
      <button type="button" className={`${s.item} ${s.buscar}`} aria-label="Buscar" {...zonaBuscar}>
        <span ref={refBuscar} className={s.iman} data-contraste>
          <Lupa />
        </span>
      </button>
      <button
        type="button"
        className={`${s.item} ${s.bolsa}`}
        onClick={carrito.alternar}
        aria-label={`Bolsa: ${carrito.cantidad}`}
        {...zonaBolsa}
      >
        <span ref={refBolsa} className={s.iman} data-contraste>
          <span className={s.vertical}>
            BOLSA<span className={s.burbuja}>{carrito.cantidad}</span>
          </span>
        </span>
      </button>
      <a href="#" className={`${s.item} ${s.favoritos}`} {...zonaFavoritos}>
        <span ref={refFavoritos} className={s.iman} data-contraste>
          <span className={`${s.vertical} ${c.tachado}`}>FAVORITOS</span>
        </span>
      </a>
      <a href="#" className={`${s.item} ${s.cuenta}`} {...zonaCuenta}>
        <span ref={refCuenta} className={s.iman} data-contraste>
          <span className={`${s.vertical} ${c.tachado}`}>CUENTA</span>
        </span>
      </a>
    </div>
  )
}
