import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AcordeonesFicha } from '@/components/AcordeonesFicha'
import { Tarjeta } from '@/components/catalogo/Tarjeta'
import { CompraFicha } from '@/components/ficha/CompraFicha'
import s from '@/components/ficha/Ficha.module.css'
import { Imagen } from '@/components/Imagen'
import { JsonLd } from '@/components/JsonLd'
import { MigasDatos, type Miga } from '@/components/Migas'
import { cliente, getAjustes, getProducto, getProductos } from '@/lib/datos'
import { precioBs } from '@/lib/formato'
import { absoluta, comoMedia, srcPrincipal, urlCompartir } from '@/lib/imagen'
import { MARCA, SITE_URL, rutaColeccion, rutaProducto } from '@/lib/sitio'
import { aTarjeta } from '@/lib/tarjeta'
import type { Coleccion, Producto } from '@/payload-types'

type Props = { params: Promise<{ slug: string }> }

// Todas las fichas publicadas se generan al compilar; las nuevas se generan en
// la primera visita y se regeneran al publicar cambios en el panel.
export async function generateStaticParams() {
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
  })
  return docs.map((p) => ({ slug: p.slug }))
}

const coleccionDe = (p: Producto) => (typeof p.coleccion === 'object' ? (p.coleccion as Coleccion | null) : null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const producto = await getProducto((await params).slug)
  if (!producto) return {}

  const coleccion = coleccionDe(producto)
  const descripcion = producto.meta?.description || producto.descripcion.slice(0, 155)
  const imagen = urlCompartir(comoMedia(producto.meta?.image) ?? comoMedia(producto.galeria[0]))

  return {
    // meta.title ya trae "| WHATICE"; si no hay, la plantilla del layout lo agrega.
    title: producto.meta?.title
      ? { absolute: producto.meta.title }
      : [producto.nombre, coleccion?.nombre].filter(Boolean).join(' | '),
    description: descripcion,
    alternates: { canonical: rutaProducto(producto.slug) },
    openGraph: {
      url: rutaProducto(producto.slug),
      description: descripcion,
      images: imagen ? [{ url: imagen, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default async function FichaProducto({ params }: Props) {
  const producto = await getProducto((await params).slug)
  if (!producto) notFound()

  const coleccion = coleccionDe(producto)
  const tipo = typeof producto.tipo === 'object' ? producto.tipo : null
  const tallas = producto.tallas ?? []
  const url = SITE_URL + rutaProducto(producto.slug)
  const fotos = [...producto.galeria, ...(producto.fotosDetalle ?? [])]
  const imagenesLd = fotos.map(comoMedia).flatMap((m) => (m ? [absoluta(srcPrincipal(m))] : []))

  const elegidos = (producto.relacionados ?? []).filter((p): p is Producto => typeof p === 'object')
  const relacionados =
    elegidos.length > 0
      ? elegidos
      : coleccion
        ? await getProductos({ coleccion: coleccion.id, excluir: producto.id, limit: 4 })
        : []

  const ajustes = await getAjustes()

  const migas: Miga[] = [
    ...(coleccion ? [{ nombre: coleccion.nombre, ruta: rutaColeccion(coleccion.slug) }] : []),
    { nombre: producto.nombre, ruta: rutaProducto(producto.slug) },
  ]

  const oferta = (stock: number, urlOferta: string) => ({
    '@type': 'Offer',
    url: urlOferta,
    price: producto.precio,
    priceCurrency: 'BOB',
    availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
  })
  const base = {
    '@context': 'https://schema.org',
    name: producto.nombre,
    description: producto.descripcion,
    url,
    image: imagenesLd,
    brand: { '@type': 'Brand', name: MARCA },
    ...(coleccion && { category: coleccion.nombre }),
  }
  // Con tallas: un ProductGroup con una variante por talla (así lo pide Google
  // Merchant). Sin tallas: un Product simple.
  const productoLd =
    tallas.length > 0
      ? {
          ...base,
          '@type': 'ProductGroup',
          productGroupID: producto.sku || producto.slug,
          variesBy: ['https://schema.org/size'],
          hasVariant: tallas.map((t) => ({
            '@type': 'Product',
            name: `${producto.nombre} — ${t.talla}`,
            sku: t.sku || `${producto.sku || producto.slug}-${t.talla}`,
            size: t.talla,
            color: producto.color,
            image: imagenesLd[0],
            offers: oferta(t.stock, `${url}?talla=${encodeURIComponent(t.talla)}`),
          })),
        }
      : {
          ...base,
          '@type': 'Product',
          sku: producto.sku || producto.slug,
          color: producto.color,
          offers: oferta(1, url),
        }

  const [principal, ...resto] = fotos
  const primeraFoto = comoMedia(principal)

  return (
    <article className={s.ficha}>
      <div className={s.arriba}>
        <div className={s.foto}>
          {/* La foto principal es el LCP de la ficha. */}
          <Imagen media={principal} prioridad sizes="(max-width: 812px) 100vw, 50vw" />
        </div>
        <div className={s.detalle}>
          <div className={s.interior}>
            {/* Como el sitio estático: INICIO > COLECCIÓN > CATEGORÍA > */}
            <nav aria-label="Migas de pan" className={s.migas}>
              <ol>
                <li>
                  <Link href="/">INICIO</Link>
                </li>
                {coleccion && (
                  <li>
                    <Link href={rutaColeccion(coleccion.slug)}>{coleccion.nombre.toUpperCase()}</Link>
                  </li>
                )}
                {tipo?.categoria && <li>{tipo.categoria}</li>}
              </ol>
            </nav>
            {coleccion && <p className={s.categoria}>{coleccion.nombre.toUpperCase()}</p>}
            <h1 className={s.titulo}>{producto.nombre}</h1>
            <ul className={s.estado}>
              <li>NUEVO</li>
            </ul>
            <p className={s.precio}>
              {producto.precioAnterior ? <s>{precioBs(producto.precioAnterior)}</s> : null}
              {precioBs(producto.precio)}
            </p>

            <CompraFicha
              slug={producto.slug}
              nombre={producto.nombre}
              precio={producto.precio}
              imagen={primeraFoto ? srcPrincipal(primeraFoto) : null}
              color={producto.color}
              tallas={tallas.map((t) => ({ talla: t.talla, stock: t.stock }))}
            />

            <AcordeonesFicha producto={producto} tipo={tipo} coleccion={coleccion} ajustes={ajustes} />
          </div>
        </div>
      </div>

      {resto.length > 0 && (
        <ul className={s.detalles}>
          {resto.map((f) => (
            <li key={typeof f === 'object' ? f.id : f}>
              <Imagen media={f} sizes="50vw" />
            </li>
          ))}
        </ul>
      )}

      {relacionados.length > 0 && (
        <section aria-labelledby="titulo-relacionados" className={s.relacionados}>
          <h2 id="titulo-relacionados">TAMBIÉN TE PUEDE GUSTAR</h2>
          <div className={s.relacionadosLista}>
            {relacionados.slice(0, 4).map((p) => (
              <div key={p.id} className={s.relacionadosItem}>
                <Tarjeta prenda={aTarjeta(p)} sizes="(max-width: 812px) 50vw, 25vw" />
              </div>
            ))}
          </div>
        </section>
      )}

      <MigasDatos items={migas} />
      <JsonLd datos={productoLd} />
    </article>
  )
}
