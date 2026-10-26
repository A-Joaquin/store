'use client'

import Link from 'next/link'

import { TAGLINE } from '@/lib/navegacion'
import { rutaColeccion } from '@/lib/sitio'
import { useAparecer } from '@/lib/useAparecer'

import s from './Secciones.module.css'

// Presentación de la marca, como un índice editorial: a la izquierda el
// cubo con el wordmark y la frase; a la derecha las colecciones en filas
// grandes, numeradas, que entran escalonadas al aparecer.
export function Presentacion({ colecciones }: { colecciones: { nombre: string; slug: string }[] }) {
  const [ref, visible] = useAparecer<HTMLElement>()
  return (
    <section ref={ref} id="colecciones" className={`${s.presentacion} ${visible ? s.visible : ''}`} aria-label="Colecciones">
      <div className={s.marca}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
        <img className={s.emblema} src="/logo-cubo-negro.svg" alt="" width={37} height={112} />
        <div className={s.marcaTexto}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img className={s.wordmark} src="/wordmark-negro.svg" alt="WHATICE" width={340} height={102} />
          <p className={s.tagline}>{TAGLINE}</p>
        </div>
      </div>

      <ol className={s.colecciones}>
        {colecciones.map((c, i) => (
          <li key={c.slug} style={{ transitionDelay: visible ? `${0.25 + i * 0.12}s` : undefined }}>
            <Link href={rutaColeccion(c.slug)}>
              <span className={s.numero}>{String(i + 1).padStart(2, '0')}</span>
              <span className={s.nombreColeccion}>{c.nombre}</span>
              <span className={s.flechaColeccion} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
