'use client'

import { useState } from 'react'

import { Flecha, Sobre } from './Iconos'
import s from './Pie.module.css'

// TODO: conectar a un servicio de correo (fase 5). Por ahora solo confirma.
export function Newsletter() {
  const [enviado, setEnviado] = useState(false)
  return (
    <form
      className={s.news}
      onSubmit={(e) => {
        e.preventDefault()
        setEnviado(true)
      }}
    >
      <label className={s.newsTitulo} htmlFor="newsletter">
        <Sobre />
        NEWSLETTER
      </label>
      {enviado ? (
        <p className={s.newsGracias}>¡Gracias! Te escribiremos pronto.</p>
      ) : (
        <div className={s.newsCampo}>
          <input id="newsletter" type="email" name="email" placeholder="tu@correo.com" required autoComplete="email" />
          <button type="submit" aria-label="Suscribirme">
            <Flecha />
          </button>
        </div>
      )}
    </form>
  )
}
