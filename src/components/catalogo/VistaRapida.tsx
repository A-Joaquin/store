'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useCarrito } from '@/components/carrito/Carrito'
import { precioBs } from '@/lib/formato'
import { rutaProducto } from '@/lib/sitio'
import type { PrendaTarjeta } from '@/lib/tarjeta'

import { BotonFavorito } from '@/components/favoritos/BotonFavorito'

import s from './VistaRapida.module.css'

type Estado = { abrir: (p: PrendaTarjeta) => void }
const Ctx = createContext<Estado | null>(null)

export function useVistaRapida() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVistaRapida debe usarse dentro de <VistaRapidaProvider>')
  return ctx
}

export function VistaRapidaProvider({ children }: { children: React.ReactNode }) {
  const ruta = usePathname()
  // Se guarda la página donde se abrió: al navegar (p. ej. "ver ficha
  // completa") se cierra sola.
  const [abierta, setAbierta] = useState<{ prenda: PrendaTarjeta; ruta: string } | null>(null)
  const valor = useMemo(() => ({ abrir: (prenda: PrendaTarjeta) => setAbierta({ prenda, ruta }) }), [ruta])
  const prenda = abierta?.ruta === ruta ? abierta.prenda : null

  return (
    <Ctx.Provider value={valor}>
      {children}
      {/* key: cada prenda empieza con su primera foto y talla. */}
      {prenda && <Modal key={prenda.slug} prenda={prenda} cerrar={() => setAbierta(null)} />}
    </Ctx.Provider>
  )
}

function Modal({ prenda, cerrar }: { prenda: PrendaTarjeta; cerrar: () => void }) {
  const carrito = useCarrito()
  const [foto, setFoto] = useState(0)
  const [talla, setTalla] = useState(prenda.tallas.find((t) => t.stock > 0)?.talla ?? null)
  const [aviso, setAviso] = useState('')
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', alTeclear)
    }
  }, [cerrar])

  const actual = prenda.fotos[foto]

  return (
    <div className={s.modal} role="dialog" aria-modal="true" aria-label={prenda.nombre}>
      <div className={s.fondo} onClick={cerrar} />
      <div className={s.ventana}>
        <button ref={cerrarRef} type="button" className={`${s.cerrar} ${s.contenido}`} onClick={cerrar} aria-label="Cerrar" />

        <div className={`${s.galeria} ${s.contenido}`}>
          <div className={s.principal} data-cursor="prenda">
            {actual && (
              // eslint-disable-next-line @next/next/no-img-element -- tamaños ya generados por Payload
              <img src={actual.grande} srcSet={actual.srcSet} sizes="45vw" alt={actual.alt} />
            )}
          </div>
          {prenda.fotos.length > 1 && (
            <div className={s.miniaturas} role="group" aria-label={`Galería de ${prenda.nombre}`}>
              {prenda.fotos.map((f, i) => (
                <button
                  key={f.src}
                  type="button"
                  className={`${s.miniatura} ${i === foto ? s.miniaturaActiva : ''}`}
                  onClick={() => setFoto(i)}
                  aria-label={`Imagen ${i + 1}`}
                  aria-pressed={i === foto}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya generada por Payload */}
                  <img src={f.src} srcSet={f.srcSet} sizes="74px" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${s.lista} ${s.contenido}`}>
          <div className={s.detalle}>
            <h2 className={s.nombre}>{prenda.nombre}</h2>
            <p className={s.precio}>
              {prenda.precioAnterior ? <s>{precioBs(prenda.precioAnterior)}</s> : null}
              {precioBs(prenda.precio)}
            </p>
            <p className={s.desc}>{prenda.descripcion}</p>
            <p className={s.meta}>
              Color: <strong>{prenda.color}</strong>
            </p>
            {prenda.tallas.length > 0 && (
              <>
                <p className={s.meta}>Talla</p>
                <div className={s.tallas} role="radiogroup" aria-label="Talla">
                  {prenda.tallas.map((t) => (
                    <button
                      key={t.talla}
                      type="button"
                      role="radio"
                      aria-checked={talla === t.talla}
                      className={`${s.talla} ${talla === t.talla ? s.tallaActiva : ''}`}
                      disabled={t.stock <= 0}
                      onClick={() => setTalla(t.talla)}
                    >
                      {t.talla}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button
              type="button"
              className={s.agregar}
              disabled={prenda.tallas.length > 0 && !talla}
              onClick={() => {
                carrito.agregar({
                  slug: prenda.slug,
                  nombre: prenda.nombre,
                  precio: prenda.precio,
                  imagen: prenda.fotos[0]?.src ?? null,
                  talla: talla ?? 'Única',
                })
                setAviso(`Agregado · Talla ${talla ?? 'Única'}`)
                carrito.abrir()
              }}
            >
              AGREGAR A LA BOLSA
            </button>
            <p className={s.agregado} aria-live="polite">
              {aviso}
            </p>
            <Link className={s.ficha} href={rutaProducto(prenda.slug)}>
              VER FICHA COMPLETA
            </Link>
            <div className={s.favorito}>
              <BotonFavorito slug={prenda.slug} nombre={prenda.nombre} variante="texto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
