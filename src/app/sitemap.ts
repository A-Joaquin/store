import type { MetadataRoute } from 'next'

import { cliente } from '@/lib/datos'
import { absoluta, comoMedia, srcPrincipal } from '@/lib/imagen'
import { todasLasPaginas } from '@/lib/listados'
import { SITE_URL, rutaCategoria, rutaColeccion, rutaPagina, rutaProducto } from '@/lib/sitio'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listados, { docs: productos }] = await Promise.all([
    todasLasPaginas(),
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
    // Colecciones y categorías, con todas sus páginas.
    ...listados.flatMap((l) => {
      const base = l.tipo === 'coleccion' ? rutaColeccion(l.slug) : rutaCategoria(l.slug)
      return Array.from({ length: l.paginas }, (_, i) => ({
        url: SITE_URL + rutaPagina(base, i + 1),
        changeFrequency: 'weekly' as const,
        priority: i === 0 ? 0.8 : 0.5,
      }))
    }),
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
