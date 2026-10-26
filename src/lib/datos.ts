import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { comoMedia } from './imagen'
import { stockDe } from './pedidos/stock'
import type { CategoriaMenu, PrendaMenu } from './navegacion'
import { rutaCategoria } from './sitio'

// overrideAccess: false aplica las reglas de acceso de un visitante: solo
// productos publicados, nunca borradores.
const publico = { overrideAccess: false } as const

export const cliente = () => getPayload({ config })

// cache() evita repetir la consulta entre generateMetadata y la página.
export const getAjustes = cache(async () => (await cliente()).findGlobal({ slug: 'ajustes' }))

export const getPortada = cache(async () =>
  (await cliente()).findGlobal({ slug: 'portada', depth: 2 }),
)

export const getProducto = cache(async (slug: string) => {
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    ...publico,
  })
  return docs[0] ?? null
})

export const getColeccion = cache(async (slug: string) => {
  const { docs } = await (await cliente()).find({
    collection: 'colecciones',
    where: { slug: { equals: slug } },
    limit: 1,
    ...publico,
  })
  return docs[0] ?? null
})

export const getColecciones = cache(async () => {
  const { docs } = await (await cliente()).find({
    collection: 'colecciones',
    limit: 100,
    pagination: false,
    ...publico,
  })
  return docs
})

// Prendas mínimas para los recuadros destacados del mega menú y del menú móvil.
export const getPrendasMenu = cache(async (): Promise<PrendaMenu[]> => {
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    depth: 1,
    pagination: false,
    select: { slug: true, nombre: true, precio: true, coleccion: true, tipo: true, galeria: true },
    ...publico,
  })
  return docs.map((p) => {
    const foto = comoMedia(p.galeria?.[0])
    return {
      slug: p.slug,
      nombre: p.nombre,
      precio: p.precio,
      coleccion: typeof p.coleccion === 'object' ? (p.coleccion?.slug ?? null) : null,
      tipo: typeof p.tipo === 'object' ? (p.tipo?.nombre ?? null) : null,
      imagen: foto ? foto.sizes?.w800?.url || foto.sizes?.w400?.url || null : null,
    }
  })
})

// Categorías (tipos de prenda con página) para los menús.
export const getCategorias = cache(async (): Promise<CategoriaMenu[]> => {
  const { docs } = await (await cliente()).find({
    collection: 'tipos',
    pagination: false,
    sort: 'id',
    select: { nombre: true, categoria: true, slug: true },
    ...publico,
  })
  return docs.flatMap((t) =>
    t.slug
      ? [{ texto: t.categoria ? t.categoria.charAt(0) + t.categoria.slice(1).toLowerCase() : t.nombre, href: rutaCategoria(t.slug), tipo: t.nombre }]
      : [],
  )
})

// Stock disponible por "<productoId>:<talla>".
export async function getStock(ids: number[]) {
  return stockDe(await cliente(), ids)
}

export async function getProductos(opciones: { coleccion?: number; excluir?: number; limit?: number } = {}) {
  const and = []
  if (opciones.coleccion) and.push({ coleccion: { equals: opciones.coleccion } })
  if (opciones.excluir) and.push({ id: { not_equals: opciones.excluir } })
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: and.length ? { and } : undefined,
    depth: 1,
    limit: opciones.limit ?? 100,
    ...publico,
  })
  return docs
}
