'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { PrendaTarjeta } from '@/lib/tarjeta'

import { BloqueColeccion } from './BloqueColeccion'
import { Paginacion } from './Paginacion'

type Datos = { prendas: PrendaTarjeta[]; total: number; totalPaginas: number }

type Props = {
  id: string
  coleccionId: number
  titulo: string
  verTodo: string
  inicial: Datos
}

// Bloque de colección de la portada con su índice de páginas: cambia de
// página ahí mismo. Para que el clic sea instantáneo, cada página se pide una
// sola vez y se precarga antes: la siguiente apenas se ve la actual, y
// cualquier otra al pasar el mouse por su número.
export function BloquePaginado({ id, coleccionId, titulo, verTodo, inicial }: Props) {
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState(inicial)
  const [cargando, setCargando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cache = useRef(new Map<number, Promise<Datos | null>>([[1, Promise.resolve(inicial)]]))

  const pedir = useCallback(
    (n: number) => {
      if (n < 1 || n > inicial.totalPaginas) return
      if (!cache.current.has(n)) {
        // GET a datos estáticos en caché: las peticiones van en paralelo y no tocan la base.
        const p = fetch(`/datos/coleccion/${coleccionId}/${n}`)
          .then((res) => (res.ok ? (res.json() as Promise<Datos>) : null))
          .catch(() => null)
        cache.current.set(n, p)
        // Si falla, se borra para poder reintentar.
        p.then((r) => r || cache.current.delete(n))
      }
      return cache.current.get(n)
    },
    [coleccionId, inicial.totalPaginas],
  )

  // La siguiente página, en segundo plano, cuando el navegador está libre.
  useEffect(() => {
    const libre = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 800))
    libre(() => pedir(pagina + 1))
  }, [pagina, pedir])

  const ir = async (n: number) => {
    const p = pedir(n)
    if (!p) return
    // Solo se atenúa si de verdad hay que esperar.
    const espera = window.setTimeout(() => setCargando(true), 120)
    const r = await p
    window.clearTimeout(espera)
    setCargando(false)
    if (!r) return
    setDatos(r)
    setPagina(n)
    const arriba = ref.current?.getBoundingClientRect().top ?? 0
    if (arriba < 0) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div ref={ref} style={{ opacity: cargando ? 0.5 : 1, transition: 'opacity 0.2s' }} aria-busy={cargando}>
      <BloqueColeccion id={id} titulo={titulo} prendas={datos.prendas} total={datos.total} verTodo={verTodo} />
      <Paginacion base={verTodo} pagina={pagina} total={datos.totalPaginas} alCambiar={ir} alPrecargar={pedir} />
    </div>
  )
}
