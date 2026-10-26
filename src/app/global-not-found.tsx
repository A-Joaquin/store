import type { Metadata } from 'next'
import { Figtree, Pirata_One } from 'next/font/google'
import Link from 'next/link'

import s from './(frontend)/not-found.module.css'
import './(frontend)/globals.css'

// 404 para direcciones que no coinciden con ninguna ruta. La app tiene dos
// layouts raíz (tienda y panel), así que esta página no pasa por ninguno:
// carga sus propias fuentes y estilos. Next agrega noindex automáticamente.
const sans = Figtree({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const display = Pirata_One({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Página no encontrada | WHATICE',
}

export default function GlobalNotFound() {
  return (
    <html lang="es-BO" className={`${sans.variable} ${display.variable}`}>
      <body>
        <header className={s.cabecera}>
          <Link href="/" aria-label="WHATICE, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
            <img src="/wordmark-negro.svg" alt="WHATICE" width={190} height={57} />
          </Link>
        </header>
        <main className={s.aviso}>
          <h1>Página no encontrada</h1>
          <p>Puede que la prenda ya no esté disponible.</p>
          <Link href="/">VOLVER A LA TIENDA</Link>
        </main>
      </body>
    </html>
  )
}
