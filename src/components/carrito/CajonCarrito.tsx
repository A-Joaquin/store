'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { precioBs } from '@/lib/formato'

import { useCarrito } from './Carrito'
import s from './CajonCarrito.module.css'

export function CajonCarrito() {
  const { items, subtotal, abierto, cerrar, cambiarCantidad, quitar } = useCarrito()

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto, cerrar])

  return (
    <div className={abierto ? s.abierto : undefined}>
      <div className={s.fondo} onClick={cerrar} />
      <aside className={s.cajon} aria-label="Tu bolsa" aria-hidden={!abierto}>
        <div className={s.interior}>
          {items.length === 0 ? (
            <p className={s.vacio}>Tu bolsa está vacía.</p>
          ) : (
            <>
              <h2 className={s.titulo}>TU BOLSA</h2>
              <ul>
                {items.map((i) => (
                  <li key={i.clave} className={s.item}>
                    <div className={s.foto} style={i.imagen ? { backgroundImage: `url(${i.imagen})` } : undefined} />
                    <div>
                      <p className={s.nombre}>{i.nombre}</p>
                      <p className={s.variante}>Talla {i.talla}</p>
                      <div className={s.cantidad}>
                        <button type="button" onClick={() => cambiarCantidad(i.clave, -1)} aria-label="Quitar uno">
                          −
                        </button>
                        <span>{i.cantidad}</span>
                        <button type="button" onClick={() => cambiarCantidad(i.clave, 1)} aria-label="Agregar uno">
                          +
                        </button>
                      </div>
                      <p className={s.precio}>{precioBs(i.precio * i.cantidad)}</p>
                    </div>
                    <button type="button" className={s.quitar} onClick={() => quitar(i.clave)} aria-label={`Eliminar ${i.nombre}`}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className={s.abajo}>
          <dl className={s.total}>
            <dt>SUBTOTAL</dt>
            <dd>{precioBs(subtotal)}</dd>
          </dl>
          {/* El pedido se registra (y reserva el stock) antes de ir a WhatsApp. */}
          <Link className={s.pedir} href="/pedido" onClick={cerrar} aria-disabled={items.length === 0}>
            FINALIZAR PEDIDO
          </Link>
        </div>
      </aside>
    </div>
  )
}
