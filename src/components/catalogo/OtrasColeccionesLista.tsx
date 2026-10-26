'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'

import type { FotoTarjeta } from '@/lib/tarjeta'

import s from './OtrasColecciones.module.css'

export type ColeccionConFotos = { nombre: string; href: string; total: number; fotos: FotoTarjeta[] }

// Una semilla por carga de página: en el servidor (y al hidratar) se usa la
// primera foto; en el navegador, una al azar distinta en cada visita.
let semilla: number | null = null
const semillaNavegador = () => (semilla ??= Math.random())

export function OtrasColeccionesLista({ colecciones }: { colecciones: ColeccionConFotos[] }) {
  const azar = useSyncExternalStore(
    () => () => {},
    semillaNavegador,
    () => 0,
  )

  return (
    <section className={s.otras} aria-labelledby="titulo-otras">
      <h2 id="titulo-otras">OTRAS COLECCIONES</h2>
      <div className={s.lista}>
        {colecciones.map((c, i) => {
          // Cada colección toma su propia foto (la semilla se corre por colección).
          const foto = c.fotos.length ? c.fotos[Math.floor(((azar + i * 0.618) % 1) * c.fotos.length)] : null
          return (
            <Link key={c.href} href={c.href} className={s.item}>
              <span className={s.foto} data-cursor="prenda">
                {foto && (
                  // eslint-disable-next-line @next/next/no-img-element -- tamaños ya generados por Payload
                  <img
                    key={foto.src}
                    src={foto.src}
                    srcSet={foto.srcSet || undefined}
                    sizes="(max-width: 812px) 50vw, 25vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={foto.blur ? { backgroundImage: `url(${foto.blur})` } : undefined}
                  />
                )}
              </span>
              <span className={s.nombre}>{c.nombre}</span>
              <span className={s.cantidad}>
                {c.total} {c.total === 1 ? 'PRENDA' : 'PRENDAS'}
              </span>
              <span className={s.ver}>
                VER COLECCIÓN<span className={s.flecha} aria-hidden="true" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
