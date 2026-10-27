import { preload } from 'react-dom'

import { comoMedia, srcPrincipal, srcSet, type ImagenRel } from '@/lib/imagen'

type Props = {
  media: ImagenRel
  // Ancho que ocupa en pantalla, p. ej. "(max-width: 768px) 50vw, 25vw".
  // Con esto el navegador baja la versión justa y no la de 2400 px.
  sizes: string
  // Solo para la imagen principal de la página (LCP): carga primero y sin lazy.
  prioridad?: boolean
  className?: string
  alt?: string
  // Dentro de un <picture> con otra foto para móvil no se precarga: el
  // preload bajaría la de escritorio también en el teléfono.
  precargar?: boolean
}

export function Imagen({ media, sizes, prioridad = false, className, alt, precargar = prioridad }: Props) {
  const m = comoMedia(media)
  if (!m) return null

  const set = srcSet(m) || undefined
  const src = srcPrincipal(m)
  if (precargar) preload(src, { as: 'image', imageSrcSet: set, imageSizes: sizes, fetchPriority: 'high' })

  return (
    // eslint-disable-next-line @next/next/no-img-element -- los tamaños ya los genera Payload; next/image los volvería a procesar
    <img
      src={src}
      srcSet={set}
      sizes={sizes}
      width={m.width ?? undefined}
      height={m.height ?? undefined}
      alt={alt ?? m.alt}
      loading={prioridad ? 'eager' : 'lazy'}
      fetchPriority={prioridad ? 'high' : 'auto'}
      decoding="async"
      className={className}
      style={{
        objectPosition: `${m.focalX ?? 50}% ${m.focalY ?? 50}%`,
        ...(m.blurDataURL && {
          backgroundImage: `url(${m.blurDataURL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }),
      }}
    />
  )
}

type HeroProps = {
  escritorio: ImagenRel
  movil?: ImagenRel
  prioridad?: boolean
  className?: string
}

// Dirección de arte: foto vertical en móvil y horizontal en escritorio.
export function ImagenHero({ escritorio, movil, prioridad, className }: HeroProps) {
  const m = comoMedia(movil)
  return (
    <picture>
      {m && <source media="(max-width: 812px)" srcSet={srcSet(m)} sizes="100vw" />}
      <Imagen
        media={escritorio}
        sizes="100vw"
        prioridad={prioridad}
        precargar={prioridad && !m}
        className={className}
      />
    </picture>
  )
}
