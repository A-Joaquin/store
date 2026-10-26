import type { MetadataRoute } from 'next'

import { cliente, getColecciones } from '@/lib/datos'
import { absoluta, comoMedia, srcPrincipal } from '@/lib/imagen'
import { SITE_URL, rutaColeccion, rutaProducto } from '@/lib/sitio'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [colecciones, { docs: productos }] = await Promise.all([
    getColecciones(),
    (await cliente()).find({
      collection: 'productos',
      overrideAccess: false,
      pagination: false,
      depth: 1,
      select: { slug: true, updatedAt: true, galeria: true },
    }),
  ])

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...colecciones.map((c) => ({
      url: SITE_URL + rutaColeccion(c.slug),
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...productos.map((p) => ({
      url: SITE_URL + rutaProducto(p.slug),
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      // Sitemap de imágenes: ayuda a aparecer en Google Imágenes.
      images: p.galeria.map(comoMedia).flatMap((m) => (m ? [absoluta(srcPrincipal(m))] : [])),
    })),
  ]
}
