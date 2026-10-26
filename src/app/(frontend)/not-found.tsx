import Link from 'next/link'

import s from './not-found.module.css'

// Mismo aviso que el sitio estático cuando una prenda no existía.
export default function NoEncontrado() {
  return (
    <section className={s.aviso}>
      <h1>Página no encontrada</h1>
      <p>Puede que la prenda ya no esté disponible.</p>
      <Link href="/">VOLVER A LA TIENDA</Link>
    </section>
  )
}
