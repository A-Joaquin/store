'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import s from '@/app/(frontend)/coleccion/[slug]/coleccion.module.css'
import { BloqueColeccion } from '@/components/catalogo/BloqueColeccion'
import type { PrendaTarjeta } from '@/lib/tarjeta'

import { useFavoritos } from './Favoritos'
import l from './ListaFavoritos.module.css'

// Página de favoritos: mismo bloque que una colección. Los favoritos viven en
// el navegador (y en la cuenta, si hay sesión): se piden sus tarjetas al servidor.
export function ListaFavoritos() {
  const { slugs } = useFavoritos()
  const clave = slugs.join(',')
  const [cargadas, setCargadas] = useState<{ clave: string; prendas: PrendaTarjeta[] } | null>(null)

  useEffect(() => {
    if (!clave) return
    let vivo = true
    fetch(`/datos/prendas?s=${encodeURIComponent(clave)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((prendas: PrendaTarjeta[]) => vivo && setCargadas({ clave, prendas }))
      .catch(() => vivo && setCargadas({ clave, prendas: [] }))
    return () => {
      vivo = false
    }
  }, [clave])

  // Al quitar un favorito desaparece de inmediato, sin volver a pedir nada.
  const prendas = (cargadas?.prendas ?? []).filter((p) => slugs.includes(p.slug))
  const cargando = Boolean(clave) && cargadas === null

  return (
    <div className={s.pagina}>
      {slugs.length === 0 ? (
        <div className={l.vacio}>
          <h1>Favoritos</h1>
          <p>
            Todavía no guardaste prendas. Toca el corazón de cualquier prenda para tenerla aquí.
            <br />
            Sin cuenta se guardan en este navegador; <Link href="/cuenta">con tu cuenta</Link>, en todos tus dispositivos.
          </p>
          <Link href="/" className={l.boton}>
            VER LA TIENDA
          </Link>
        </div>
      ) : (
        <div style={{ opacity: cargando ? 0.4 : 1, transition: 'opacity 0.3s' }} aria-busy={cargando}>
          <BloqueColeccion titulo="Favoritos" prendas={prendas} total={slugs.length} tituloComoH1 />
        </div>
      )}
    </div>
  )
}
