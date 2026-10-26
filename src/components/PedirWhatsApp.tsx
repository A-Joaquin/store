'use client'

import { useState } from 'react'

type Talla = { talla: string; stock: number }

type Props = {
  nombre: string
  url: string
  tallas: Talla[]
  whatsapp?: string | null
}

// Fase 1: el pedido se cierra por WhatsApp. En la fase 2 este bloque pasa a
// "Agregar al carrito".
export function PedirWhatsApp({ nombre, url, tallas, whatsapp }: Props) {
  const [talla, setTalla] = useState<string | null>(tallas.length === 1 ? tallas[0].talla : null)
  const numero = whatsapp?.replace(/\D/g, '')
  const mensaje = `Hola, quiero pedir: ${nombre}${talla ? ` — talla ${talla}` : ''}\n${url}`

  return (
    <div className="pedido">
      {tallas.length > 0 && (
        <fieldset className="pedido__tallas">
          <legend>Talla</legend>
          {tallas.map((t) => (
            <label key={t.talla} className={t.stock > 0 ? undefined : 'agotada'}>
              <input
                type="radio"
                name="talla"
                value={t.talla}
                checked={talla === t.talla}
                disabled={t.stock <= 0}
                onChange={() => setTalla(t.talla)}
              />
              <span>{t.talla}</span>
            </label>
          ))}
        </fieldset>
      )}
      {numero ? (
        <a
          className="boton"
          href={`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={tallas.length > 0 && !talla}
          onClick={(e) => {
            if (tallas.length > 0 && !talla) e.preventDefault()
          }}
        >
          {tallas.length > 0 && !talla ? 'Elige una talla' : 'Pedir por WhatsApp'}
        </a>
      ) : null}
    </div>
  )
}
