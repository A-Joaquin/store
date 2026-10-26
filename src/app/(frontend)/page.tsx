import type { Metadata } from 'next'
import { Fragment } from 'react'

import { BloqueColeccion } from '@/components/catalogo/BloqueColeccion'
import { Hero } from '@/components/portada/Hero'
import { Presentacion } from '@/components/portada/Presentacion'
import { Divisor, Interludio, Manifiesto } from '@/components/portada/Secciones'
import { getColecciones, getPortada, getProductos } from '@/lib/datos'
import { MARCA, rutaColeccion } from '@/lib/sitio'
import { aTarjeta } from '@/lib/tarjeta'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function Inicio() {
  const [portada, colecciones] = await Promise.all([getPortada(), getColecciones()])
  const prendasPorColeccion = await Promise.all(colecciones.map((c) => getProductos({ coleccion: c.id })))

  return (
    <>
      {/* Un solo h1 por página; en la portada lo ocupa la marca. */}
      <h1 className="solo-lectores">{MARCA} — streetwear de Bolivia</h1>

      <Hero hero={portada.hero} />

      <Presentacion colecciones={colecciones.map((c) => ({ nombre: c.nombre, slug: c.slug }))} />

      {colecciones.map((c, i) => (
        <Fragment key={c.id}>
          {i > 0 && <Divisor numero={i + 1} nombre={c.nombre} />}
          <BloqueColeccion
            id={c.slug}
            titulo={c.nombre}
            prendas={prendasPorColeccion[i].map(aTarjeta)}
            verTodo={rutaColeccion(c.slug)}
          />
        </Fragment>
      ))}

      {portada.manifiesto && <Manifiesto texto={portada.manifiesto} />}

      <Interludio />
    </>
  )
}
