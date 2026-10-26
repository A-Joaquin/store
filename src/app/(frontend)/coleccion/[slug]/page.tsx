import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BloqueColeccion } from '@/components/catalogo/BloqueColeccion'
import { JsonLd } from '@/components/JsonLd'
import { Migas } from '@/components/Migas'
import { getColeccion, getColecciones, getProductos } from '@/lib/datos'
import { comoMedia, urlCompartir } from '@/lib/imagen'
import { SITE_URL, rutaColeccion, rutaProducto } from '@/lib/sitio'
import { aTarjeta } from '@/lib/tarjeta'

import s from './coleccion.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getColecciones()).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const coleccion = await getColeccion((await params).slug)
  if (!coleccion) return {}

  const descripcion = coleccion.meta?.description || coleccion.descripcion?.slice(0, 155)
  const imagen = urlCompartir(comoMedia(coleccion.meta?.image) ?? comoMedia(coleccion.imagen))
  return {
    title: coleccion.meta?.title ? { absolute: coleccion.meta.title } : coleccion.nombre,
    description: descripcion,
    alternates: { canonical: rutaColeccion(coleccion.slug) },
    openGraph: {
      url: rutaColeccion(coleccion.slug),
      description: descripcion ?? undefined,
      images: imagen ? [{ url: imagen, width: 1200, height: 630 }] : undefined,
    },
  }
}

// Mismo diseño que los bloques de colección de la portada.
export default async function PaginaColeccion({ params }: Props) {
  const coleccion = await getColeccion((await params).slug)
  if (!coleccion) notFound()

  const productos = await getProductos({ coleccion: coleccion.id })

  return (
    <div className={s.pagina}>
      <div className={s.migas}>
        <Migas items={[{ nombre: coleccion.nombre, ruta: rutaColeccion(coleccion.slug) }]} />
      </div>
      <BloqueColeccion titulo={coleccion.nombre} prendas={productos.map(aTarjeta)} tituloComoH1 prioridad={3} />
      {coleccion.descripcion && <p className={s.intro}>{coleccion.descripcion}</p>}

      <JsonLd
        datos={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: coleccion.nombre,
          itemListElement: productos.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: SITE_URL + rutaProducto(p.slug),
          })),
        }}
      />
    </div>
  )
}
