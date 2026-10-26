import type { Metadata, Viewport } from 'next'
import { Pirata_One } from 'next/font/google'
import Link from 'next/link'
import React from 'react'

import { JsonLd } from '@/components/JsonLd'
import { getAjustes, getColecciones } from '@/lib/datos'
import { MARCA, SITE_URL, rutaColeccion } from '@/lib/sitio'

import './globals.css'

// Auto-alojada por Next: sin petición a Google Fonts y sin salto de texto al cargar.
const display = Pirata_One({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-display' })

const DESCRIPCION_BASE = 'Streetwear boliviano: poleras, manga larga y conjuntos Track de edición limitada.'

export async function generateMetadata(): Promise<Metadata> {
  const ajustes = await getAjustes()
  const descripcion = ajustes.descripcion || DESCRIPCION_BASE
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${MARCA} | Streetwear Bolivia`, template: `%s | ${MARCA}` },
    description: descripcion,
    applicationName: MARCA,
    // Sin canonical aquí: lo heredarían todas las páginas y Google las tomaría
    // como copias de la portada. Cada página declara el suyo.
    openGraph: {
      siteName: MARCA,
      locale: 'es_BO',
      type: 'website',
      description: descripcion,
    },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/logo-ojo-negro.svg' },
  }
}

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [ajustes, colecciones] = await Promise.all([getAjustes(), getColecciones()])
  const redes = Object.values(ajustes.redes ?? {}).filter((r): r is string => typeof r === 'string' && r.length > 0)

  return (
    <html lang="es-BO" className={display.variable}>
      <body>
        <a href="#contenido" className="saltar">
          Ir al contenido
        </a>
        <header className="cabecera">
          <Link href="/" className="cabecera__logo" aria-label={`${MARCA}, inicio`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, no necesita optimización */}
            <img src="/wordmark.svg" alt={MARCA} width={190} height={40} />
          </Link>
          <nav aria-label="Colecciones">
            <ul className="cabecera__menu">
              {colecciones.map((c) => (
                <li key={c.id}>
                  <Link href={rutaColeccion(c.slug)}>{c.nombre}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main id="contenido">{children}</main>

        <footer className="pie">
          <p>
            © {new Date().getFullYear()} {MARCA}
          </p>
          {redes.length > 0 && (
            <ul className="pie__redes">
              {redes.map((r) => (
                <li key={r}>
                  <a href={r} rel="noopener noreferrer" target="_blank">
                    {new URL(r).hostname.replace(/^www\./, '')}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </footer>

        <JsonLd
          datos={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organizacion`,
                name: MARCA,
                url: SITE_URL,
                logo: `${SITE_URL}/logo-ojo-negro.svg`,
                ...(ajustes.email && { email: ajustes.email }),
                ...(redes.length > 0 && { sameAs: redes }),
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#sitio`,
                name: MARCA,
                url: SITE_URL,
                inLanguage: 'es-BO',
                publisher: { '@id': `${SITE_URL}/#organizacion` },
              },
            ],
          }}
        />
      </body>
    </html>
  )
}
