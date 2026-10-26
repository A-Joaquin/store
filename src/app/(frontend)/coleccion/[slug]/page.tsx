import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { Migas } from '@/components/Migas'
import { TarjetaProducto } from '@/components/TarjetaProducto'
import { getColeccion, getColecciones, getProductos } from '@/lib/datos'
import { comoMedia, urlCompartir } from '@/lib/imagen'
import { SITE_URL, rutaColeccion, rutaProducto } from '@/lib/sitio'

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

export default async function PaginaColeccion({ params }: Props) {
  const coleccion = await getColeccion((await params).slug)
  if (!coleccion) notFound()

  const productos = await getProductos({ coleccion: coleccion.id })

  return (
    <>
      <Migas items={[{ nombre: coleccion.nombre, ruta: rutaColeccion(coleccion.slug) }]} />
      <header className="encabezado-coleccion">
        <h1>{coleccion.nombre}</h1>
        {coleccion.descripcion && <p>{coleccion.descripcion}</p>}
      </header>

      <div className="grilla">
        {productos.map((p, i) => (
          <TarjetaProducto key={p.id} producto={p} prioridad={i < 2} />
        ))}
      </div>

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
    </>
  )
}
