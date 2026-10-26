import Link from 'next/link'

import type { PrendaTarjeta } from '@/lib/tarjeta'

import s from './BloqueColeccion.module.css'
import { Tarjeta } from './Tarjeta'
import { VerTodo } from './VerTodo'

type Props = {
  id?: string
  titulo: string
  prendas: PrendaTarjeta[]
  // Enlace "VER TODO →" (en la portada lleva a la página de la colección).
  verTodo?: string
  // En la página de colección el título es el h1.
  tituloComoH1?: boolean
  // Primeras tarjetas sin lazy (cuando el bloque está arriba de la página).
  prioridad?: number
}

export function BloqueColeccion({ id, titulo, prendas, verTodo, tituloComoH1, prioridad = 0 }: Props) {
  const Titulo = tituloComoH1 ? 'h1' : 'h2'
  return (
    <section className={s.bloque} id={id} aria-label={titulo}>
      <div className={s.lista}>
        <div className={s.cabeza}>
          <Titulo className={s.titulo}>{titulo}</Titulo>
          <p className={s.cantidad}>
            {prendas.length} {prendas.length === 1 ? 'PRENDA' : 'PRENDAS'}
          </p>
        </div>
        {prendas.map((p, i) => (
          <div key={p.slug} className={s.item}>
            <Tarjeta prenda={p} prioridad={i < prioridad} />
          </div>
        ))}
      </div>
      {verTodo && (
        <VerTodo>
          <Link href={verTodo}>
            VER TODO<span className={s.flecha} aria-hidden="true" />
          </Link>
        </VerTodo>
      )}
    </section>
  )
}
