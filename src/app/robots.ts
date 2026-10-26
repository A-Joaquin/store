import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/sitio'

// Solo se indexa con INDEXAR=true (producción). Así una copia de pruebas nunca
// compite en Google con el sitio real.
export default function robots(): MetadataRoute.Robots {
  if (process.env.INDEXAR !== 'true') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/datos', '/carrito', '/checkout', '/pedido'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
