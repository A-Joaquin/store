'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import { precioBs } from '@/lib/formato'
import { rutaProducto } from '@/lib/sitio'
import type { PrendaTarjeta } from '@/lib/tarjeta'

import { BotonFavorito } from '@/components/favoritos/BotonFavorito'

import s from './Tarjeta.module.css'
import { useVistaRapida } from './VistaRapida'

type Props = {
  prenda: PrendaTarjeta
  // Ancho que ocupa la foto en pantalla (srcset): 5 columnas en escritorio, 2 en móvil.
  sizes?: string
  // Las tarjetas visibles al cargar no van en lazy.
  prioridad?: boolean
}

export function Tarjeta({ prenda, sizes = '(max-width: 812px) 50vw, 20vw', prioridad = false }: Props) {
  const vistaRapida = useVistaRapida()
  const [indice, setIndice] = useState(0)
  const toque = useRef<number | null>(null)
  const deslizo = useRef(false)
  const fotos = prenda.fotos
  const varias = fotos.length > 1
  const url = rutaProducto(prenda.slug)
  const ir = (n: number) => setIndice((n + fotos.length) % fotos.length)

  return (
    <article className={s.tarjeta} onMouseLeave={() => setIndice(0)}>
      <div className={s.figura} data-cursor="prenda">
        <Link
          href={url}
          className={s.foto}
          aria-label={prenda.nombre}
          onTouchStart={(e) => {
            toque.current = e.touches[0].clientX
            deslizo.current = false
          }}
          onTouchEnd={(e) => {
            if (toque.current === null) return
            const dx = e.changedTouches[0].clientX - toque.current
            toque.current = null
            if (varias && Math.abs(dx) > 40) {
              deslizo.current = true
              ir(indice + (dx < 0 ? 1 : -1))
            }
          }}
          // Un deslizamiento no cuenta como clic para abrir la ficha.
          onClick={(e) => {
            if (!deslizo.current) return
            deslizo.current = false
            e.preventDefault()
          }}
        >
          <div className={s.pista} style={{ transform: `translateX(${-100 * indice}%)` }}>
            {fotos.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- tamaños ya generados por Payload
              <img
                key={f.src}
                src={f.src}
                srcSet={f.srcSet || undefined}
                sizes={sizes}
                alt={i === 0 ? f.alt : ''}
                width={f.ancho ?? undefined}
                height={f.alto ?? undefined}
                loading={prioridad && i === 0 ? 'eager' : 'lazy'}
                fetchPriority={prioridad && i === 0 ? 'high' : 'auto'}
                decoding="async"
                style={f.blur ? { backgroundImage: `url(${f.blur})` } : undefined}
              />
            ))}
          </div>
        </Link>
        {varias && (
          <>
            <button type="button" className={`${s.nav} ${s.anterior}`} onClick={() => ir(indice - 1)} aria-label="Foto anterior" />
            <button type="button" className={`${s.nav} ${s.siguiente}`} onClick={() => ir(indice + 1)} aria-label="Foto siguiente" />
          </>
        )}
        <BotonFavorito slug={prenda.slug} nombre={prenda.nombre} />
        <button type="button" className={s.rapida} onClick={() => vistaRapida.abrir(prenda)} aria-label={`Vista rápida: ${prenda.nombre}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
          <span>VISTA RÁPIDA</span>
        </button>
      </div>
      <Link href={url} className={s.info}>
        <h3 className={s.nombre}>{prenda.nombre}</h3>
        <p className={s.precio}>
          {prenda.precioAnterior ? <s>{precioBs(prenda.precioAnterior)}</s> : null}
          {precioBs(prenda.precio)}
        </p>
      </Link>
    </article>
  )
}
