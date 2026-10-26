'use client'

import { useRef, useState, useTransition } from 'react'

import { paginaDeColeccion } from '@/app/(frontend)/acciones-listado'
import type { PrendaTarjeta } from '@/lib/tarjeta'

import { BloqueColeccion } from './BloqueColeccion'
import { Paginacion } from './Paginacion'

type Props = {
  id: string
  coleccionId: number
  titulo: string
  verTodo: string
  inicial: { prendas: PrendaTarjeta[]; total: number; totalPaginas: number }
}

// Bloque de colección de la portada con su índice de páginas: cambia de
// página ahí mismo, pidiendo al servidor solo las prendas de esa página.
export function BloquePaginado({ id, coleccionId, titulo, verTodo, inicial }: Props) {
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState(inicial)
  const [cargando, iniciar] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const ir = (n: number) =>
    iniciar(async () => {
      const r = await paginaDeColeccion(coleccionId, n)
      if (!r) return
      setDatos(r)
      setPagina(n)
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

  return (
    <div ref={ref} style={{ opacity: cargando ? 0.5 : 1, transition: 'opacity 0.2s' }} aria-busy={cargando}>
      <BloqueColeccion id={id} titulo={titulo} prendas={datos.prendas} total={datos.total} verTodo={verTodo} />
      <Paginacion base={verTodo} pagina={pagina} total={datos.totalPaginas} alCambiar={ir} />
    </div>
  )
}
