import Link from 'next/link'

import type { Producto } from '@/payload-types'
import { rutaProducto } from '@/lib/sitio'
import { precioBs } from '@/lib/formato'

import { Imagen } from './Imagen'

type Props = {
  producto: Producto
  // Las tarjetas visibles al cargar (primera fila) no deben ir en lazy.
  prioridad?: boolean
}

export function TarjetaProducto({ producto, prioridad }: Props) {
  return (
    <article className="tarjeta">
      <Link href={rutaProducto(producto.slug)} className="tarjeta__enlace">
        <div className="tarjeta__foto">
          <Imagen
            media={producto.galeria[0]}
            sizes="(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw"
            prioridad={prioridad}
          />
        </div>
        <h3 className="tarjeta__nombre">{producto.nombre}</h3>
        <p className="tarjeta__precio">
          {producto.precioAnterior ? <s>{precioBs(producto.precioAnterior)}</s> : null} {precioBs(producto.precio)}
        </p>
      </Link>
    </article>
  )
}
