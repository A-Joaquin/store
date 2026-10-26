import type { Media, Producto } from '@/payload-types'

import { comoMedia, srcPrincipal, srcSet } from './imagen'

// Datos mínimos que viajan al navegador para una tarjeta (y su vista rápida).
export type FotoTarjeta = {
  src: string
  srcSet: string
  grande: string
  alt: string
  ancho: number | null
  alto: number | null
  blur: string | null
}

export type PrendaTarjeta = {
  slug: string
  nombre: string
  precio: number
  precioAnterior: number | null
  color: string
  descripcion: string
  coleccion: string | null
  tallas: { talla: string; stock: number }[]
  fotos: FotoTarjeta[]
}

const aFoto = (m: Media): FotoTarjeta => ({
  src: srcPrincipal(m),
  srcSet: srcSet(m),
  grande: m.sizes?.w1600?.url || m.sizes?.w1200?.url || srcPrincipal(m),
  alt: m.alt,
  ancho: m.width ?? null,
  alto: m.height ?? null,
  blur: m.blurDataURL ?? null,
})

// stock: disponible por "<productoId>:<talla>" (colección Inventario).
export function aTarjeta(p: Producto, stock: Map<string, number> = new Map()): PrendaTarjeta {
  return {
    slug: p.slug,
    nombre: p.nombre,
    precio: p.precio,
    precioAnterior: p.precioAnterior ?? null,
    color: p.color,
    descripcion: p.descripcion,
    coleccion: typeof p.coleccion === 'object' ? (p.coleccion?.nombre ?? null) : null,
    tallas: (p.tallas ?? []).map((t) => ({ talla: t.talla, stock: stock.get(`${p.id}:${t.talla}`) ?? 0 })),
    fotos: p.galeria.map(comoMedia).flatMap((m) => (m ? [aFoto(m)] : [])),
  }
}
