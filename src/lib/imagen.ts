import type { Media } from '@/payload-types'

import { SITE_URL } from './sitio'

// Anchos que genera Payload al subir (ver collections/Media.ts). Vive aquí y no
// en Media.ts para que los componentes de cliente no arrastren sharp.
export const ANCHOS = [
  { name: 'w400', width: 400 },
  { name: 'w800', width: 800 },
  { name: 'w1200', width: 1200 },
  { name: 'w1600', width: 1600 },
  { name: 'w2400', width: 2400 },
] as const

export type ImagenRel = number | Media | null | undefined

export const comoMedia = (m: ImagenRel): Media | null => (m && typeof m === 'object' ? m : null)

export function srcSet(m: Media): string {
  return ANCHOS.map(({ name }) => m.sizes?.[name])
    .filter((s) => s?.url && s.width)
    .map((s) => `${s!.url} ${s!.width}w`)
    .join(', ')
}

// Respaldo para navegadores sin srcset. Nunca el original: puede pesar varios MB.
export function srcPrincipal(m: Media): string {
  const s = m.sizes
  return s?.w1200?.url || s?.w800?.url || s?.w400?.url || m.url || ''
}

export const absoluta = (url: string) => (url.startsWith('/') ? SITE_URL + url : url)

// Imagen para Open Graph / JSON-LD: el recorte 1200×630 en JPEG si existe.
export function urlCompartir(m: Media | null): string | undefined {
  if (!m) return undefined
  const url = m.sizes?.og?.url || srcPrincipal(m)
  return url ? absoluta(url) : undefined
}
