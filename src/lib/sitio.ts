// URL pública del sitio, sin barra final. Se usa en canonical, sitemap y JSON-LD.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const MARCA = 'WHATICE'

export const rutaProducto = (slug: string) => `/producto/${slug}`
export const rutaColeccion = (slug: string) => `/coleccion/${slug}`
export const rutaCategoria = (slug: string) => `/categoria/${slug}`

// Página n de un listado: la 1 es la dirección base (sin /pagina/1).
export const rutaPagina = (base: string, n: number) => (n <= 1 ? base : `${base}/pagina/${n}`)
