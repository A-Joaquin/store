import type { Metadata } from 'next'
import { cache } from 'react'

import { cliente, getStock } from './datos'
import { comoMedia, urlCompartir } from './imagen'
import { rutaCategoria, rutaColeccion, rutaPagina } from './sitio'
import { aTarjeta, type PrendaTarjeta } from './tarjeta'

// 23 por página: el título ocupa dos celdas de la grilla de 5 columnas, así
// la primera fila lleva 3 prendas y las cuatro siguientes 5 (páginas llenas).
export const POR_PAGINA = 23
// En la portada cada colección muestra su primera fila y la siguiente.
export const EN_PORTADA = 8

export type TipoListado = 'coleccion' | 'categoria'

export type Listado = {
  titulo: string
  descripcion: string | null
  base: string
  pagina: number
  totalPaginas: number
  total: number
  prendas: PrendaTarjeta[]
  meta: { title?: string | null; description?: string | null; image?: unknown } | null | undefined
  imagen: unknown
}

// Prendas publicadas de una colección o categoría, paginadas y con stock.
export async function prendasPaginadas(filtro: { coleccion?: number; tipo?: number }, pagina: number, limit = POR_PAGINA) {
  const payload = await cliente()
  const res = await payload.find({
    collection: 'productos',
    where: filtro.coleccion ? { coleccion: { equals: filtro.coleccion } } : { tipo: { equals: filtro.tipo } },
    depth: 1,
    limit,
    page: pagina,
    sort: 'orden',
    overrideAccess: false,
  })
  const stock = await getStock(res.docs.map((p) => p.id))
  return { prendas: res.docs.map((p) => aTarjeta(p, stock)), total: res.totalDocs, totalPaginas: Math.max(1, res.totalPages) }
}

// Colección o categoría por su slug + la página pedida. null si no existe o
// la página está fuera de rango (la ruta responde 404).
export const cargarListado = cache(async (tipo: TipoListado, slug: string, pagina: number): Promise<Listado | null> => {
  if (!Number.isInteger(pagina) || pagina < 1) return null
  const payload = await cliente()
  if (tipo === 'coleccion') {
    const { docs } = await payload.find({ collection: 'colecciones', where: { slug: { equals: slug } }, limit: 1, overrideAccess: false })
    const c = docs[0]
    if (!c) return null
    const r = await prendasPaginadas({ coleccion: c.id }, pagina)
    if (pagina > r.totalPaginas) return null
    return { titulo: c.nombre, descripcion: c.descripcion ?? null, base: rutaColeccion(c.slug), pagina, ...r, meta: c.meta, imagen: c.imagen }
  }
  const { docs } = await payload.find({ collection: 'tipos', where: { slug: { equals: slug } }, limit: 1, overrideAccess: false })
  const t = docs[0]
  if (!t || !t.slug) return null
  const r = await prendasPaginadas({ tipo: t.id }, pagina)
  if (pagina > r.totalPaginas) return null
  const titulo = t.categoria ? t.categoria.charAt(0) + t.categoria.slice(1).toLowerCase() : t.nombre
  return { titulo, descripcion: t.descripcion ?? null, base: rutaCategoria(t.slug), pagina, ...r, meta: t.meta, imagen: null }
})

export function metadataListado(l: Listado): Metadata {
  const sufijo = l.pagina > 1 ? ` — página ${l.pagina}` : ''
  const descripcion = l.meta?.description || l.descripcion?.slice(0, 155) || undefined
  const imagen = urlCompartir(comoMedia(l.meta?.image as never) ?? comoMedia(l.imagen as never))
  const ruta = rutaPagina(l.base, l.pagina)
  return {
    title: l.meta?.title && l.pagina === 1 ? { absolute: l.meta.title } : l.titulo + sufijo,
    description: descripcion,
    // Cada página es su propia URL canónica (Google indexa todas las prendas).
    alternates: { canonical: ruta },
    openGraph: { url: ruta, description: descripcion, images: imagen ? [{ url: imagen, width: 1200, height: 630 }] : undefined },
  }
}

// Todas las páginas de todas las colecciones y categorías (generación estática y sitemap).
export async function todasLasPaginas(): Promise<{ tipo: TipoListado; slug: string; paginas: number }[]> {
  const payload = await cliente()
  const [colecciones, tipos] = await Promise.all([
    payload.find({ collection: 'colecciones', pagination: false, overrideAccess: false, select: { slug: true } }),
    payload.find({ collection: 'tipos', pagination: false, overrideAccess: false, select: { slug: true } }),
  ])
  const contar = async (where: Record<string, unknown>) =>
    (await payload.count({ collection: 'productos', where: where as never, overrideAccess: false })).totalDocs
  const salida: { tipo: TipoListado; slug: string; paginas: number }[] = []
  for (const c of colecciones.docs)
    salida.push({ tipo: 'coleccion', slug: c.slug, paginas: Math.max(1, Math.ceil((await contar({ coleccion: { equals: c.id } })) / POR_PAGINA)) })
  for (const t of tipos.docs)
    if (t.slug)
      salida.push({ tipo: 'categoria', slug: t.slug, paginas: Math.max(1, Math.ceil((await contar({ tipo: { equals: t.id } })) / POR_PAGINA)) })
  return salida
}
