import type { Metadata } from 'next'
import Link from 'next/link'

import { ImagenHero } from '@/components/Imagen'
import { TarjetaProducto } from '@/components/TarjetaProducto'
import { getColecciones, getPortada, getProductos } from '@/lib/datos'
import type { Producto } from '@/payload-types'
import { MARCA, rutaColeccion } from '@/lib/sitio'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function Inicio() {
  const [portada, colecciones] = await Promise.all([getPortada(), getColecciones()])

  const destacados = (portada.destacados ?? []).filter((p): p is Producto => typeof p === 'object')
  const productos = destacados.length > 0 ? destacados : await getProductos({ limit: 12 })
  // TODO fase 1: slider Embla con el resto de slides (cargan en lazy).
  const [primero] = portada.hero ?? []

  return (
    <>
      {/* Un solo h1 por página; en la portada lo ocupa la marca. */}
      <h1 className="solo-lectores">{MARCA} — streetwear de Bolivia</h1>

      {primero && (
        <section className="hero" aria-label="Destacado">
          {/* Solo el primer slide es prioritario: es el elemento LCP de la portada. */}
          <ImagenHero escritorio={primero.imagen} movil={primero.imagenMovil} prioridad className="hero__img" />
          {primero.titulo && <p className="hero__titulo">{primero.titulo}</p>}
        </section>
      )}

      {portada.manifiesto && <p className="manifiesto">{portada.manifiesto}</p>}

      {colecciones.length > 0 && (
        <nav aria-label="Colecciones" className="colecciones" id="colecciones">
          {colecciones.map((c) => (
            <Link key={c.id} href={rutaColeccion(c.slug)}>
              {c.nombre}
            </Link>
          ))}
        </nav>
      )}

      <section aria-labelledby="titulo-productos">
        <h2 id="titulo-productos">Lo nuevo</h2>
        <div className="grilla">
          {productos.map((p, i) => (
            // Sin hero, la primera fila de tarjetas es lo primero que se ve.
            <TarjetaProducto key={p.id} producto={p} prioridad={!primero && i < 2} />
          ))}
        </div>
      </section>
    </>
  )
}
