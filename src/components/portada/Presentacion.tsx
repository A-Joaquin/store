'use client'

import Link from 'next/link'

import { TAGLINE } from '@/lib/navegacion'
import { rutaColeccion } from '@/lib/sitio'
import { useAparecer } from '@/lib/useAparecer'

import s from './Secciones.module.css'

// Cubo | wordmark con la frase, y las colecciones que suben escalonadas.
export function Presentacion({ colecciones }: { colecciones: { nombre: string; slug: string }[] }) {
  const [ref, visible] = useAparecer<HTMLElement>()
  return (
    <section ref={ref} id="colecciones" className={`${s.presentacion} ${visible ? s.visible : ''}`} aria-label="Colecciones">
      <div className={s.marca}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
        <img className={s.emblema} src="/logo-cubo-negro.svg" alt="" width={37} height={112} />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
        <img className={s.wordmark} src="/wordmark-negro.svg" alt="WHATICE" width={320} height={96} />
        <p className={s.tagline}>{TAGLINE}</p>
      </div>
      <ul className={s.colecciones}>
        {colecciones.map((c, i) => (
          <li key={c.slug} style={{ transitionDelay: visible ? `${0.2 + i * 0.1}s` : undefined }}>
            <Link href={rutaColeccion(c.slug)}>{c.nombre.toUpperCase()}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
