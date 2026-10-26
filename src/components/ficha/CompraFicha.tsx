'use client'

import { useState } from 'react'

import { useCarrito } from '@/components/carrito/Carrito'
import { BotonFavorito } from '@/components/favoritos/BotonFavorito'
import { BolsaIcono, Regla } from '@/components/sitio/Iconos'

import s from './Ficha.module.css'

type Props = {
  slug: string
  nombre: string
  precio: number
  imagen: string | null
  color: string
  tallas: { talla: string; stock: number }[]
}

// Selectores de color y talla, "AGREGAR A LA BOLSA" y los accesos a la bolsa
// y a la guía de tallas (abre el acordeón TALLA).
export function CompraFicha({ slug, nombre, precio, imagen, color, tallas }: Props) {
  const carrito = useCarrito()
  const disponibles = tallas.filter((t) => t.stock > 0)
  const [talla, setTalla] = useState(disponibles[0]?.talla ?? '')
  const [aviso, setAviso] = useState('')
  const agotado = tallas.length > 0 && disponibles.length === 0

  const abrirGuia = () => {
    const acordeon = document.getElementById('acordeon-talla') as HTMLDetailsElement | null
    if (!acordeon) return
    acordeon.open = true
    acordeon.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <dl className={s.selector}>
        <dt>
          <label htmlFor="ficha-color">Color</label>
        </dt>
        <dd>
          <select id="ficha-color" className={s.select} defaultValue={color}>
            <option>{color}</option>
          </select>
        </dd>
      </dl>
      {tallas.length > 0 && (
        <dl className={s.selector}>
          <dt>
            <label htmlFor="ficha-talla">Talla</label>
          </dt>
          <dd>
            <select id="ficha-talla" className={s.select} value={talla} onChange={(e) => setTalla(e.target.value)}>
              {tallas.map((t) => (
                <option key={t.talla} value={t.talla} disabled={t.stock <= 0}>
                  {t.talla}
                  {t.stock <= 0 ? ' — agotada' : ''}
                </option>
              ))}
            </select>
          </dd>
        </dl>
      )}

      <button
        type="button"
        className={s.agregar}
        disabled={agotado}
        onClick={() => {
          carrito.agregar({ slug, nombre, precio, imagen, talla: talla || 'Única' })
          setAviso(`Agregado · Talla ${talla || 'Única'}`)
          carrito.abrir()
        }}
      >
        <span>{agotado ? 'AGOTADO' : 'AGREGAR A LA BOLSA'}</span>
      </button>
      <BotonFavorito slug={slug} nombre={nombre} variante="boton" />
      <p className={s.agregado} aria-live="polite">
        {aviso}
      </p>

      <button type="button" className={`${s.acceso} ${s.accesoBolsa}`} onClick={carrito.abrir}>
        <BolsaIcono />
        <span>Ver mi bolsa</span>
      </button>
      <button type="button" className={s.acceso} onClick={abrirGuia}>
        <Regla />
        <span>Guía de tallas</span>
      </button>
    </>
  )
}
