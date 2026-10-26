import { ImagenHero } from '@/components/Imagen'
import { comoMedia } from '@/lib/imagen'
import type { Portada } from '@/payload-types'

import { HeroSlider, type SlideHero } from './HeroSlider'

// La escena del slider mide 2000 px de ancho en escritorio y 750 en móvil:
// se usa el tamaño generado más cercano por arriba.
export function Hero({ hero }: { hero: Portada['hero'] }) {
  const lista = hero ?? []
  const slides: SlideHero[] = lista.flatMap((h) => {
    const esc = comoMedia(h.imagen)
    if (!esc) return []
    const mov = comoMedia(h.imagenMovil)
    const src = esc.sizes?.w2400?.url || esc.sizes?.w1600?.url || esc.url
    if (!src) return []
    return [
      {
        foto: {
          src,
          srcMovil: mov ? mov.sizes?.w800?.url || mov.sizes?.w1200?.url || mov.url || null : null,
          alt: esc.alt,
        },
        enlace: h.enlace || null,
      },
    ]
  })
  if (slides.length === 0) return null
  const [primero] = lista

  return (
    <HeroSlider slides={slides}>
      <ImagenHero escritorio={primero.imagen} movil={primero.imagenMovil} prioridad />
    </HeroSlider>
  )
}
