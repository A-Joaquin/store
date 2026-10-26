import type { Metadata, Viewport } from 'next'
import { Figtree, Pirata_One } from 'next/font/google'
import React from 'react'

import { CajonCarrito } from '@/components/carrito/CajonCarrito'
import { CarritoProvider } from '@/components/carrito/Carrito'
import { VistaRapidaProvider } from '@/components/catalogo/VistaRapida'
import { FavoritosProvider } from '@/components/favoritos/Favoritos'
import { JsonLd } from '@/components/JsonLd'
import { AvisoCookies } from '@/components/sitio/AvisoCookies'
import { BarraLateral } from '@/components/sitio/BarraLateral'
import { Cabecera } from '@/components/sitio/Cabecera'
import { ContrasteAuto } from '@/components/sitio/ContrasteAuto'
import { MenuMovil, MenuMovilProvider } from '@/components/sitio/MenuMovil'
import { Pie } from '@/components/sitio/Pie'
import { getAjustes, getCategorias, getColecciones, getPrendasMenu } from '@/lib/datos'
import { MARCA, SITE_URL } from '@/lib/sitio'

import './globals.css'

// Auto-alojadas por Next: sin petición a Google Fonts y sin salto de texto al cargar.
// Figtree reemplaza a Avenir Next (fuente comercial del tema de referencia):
// es la alternativa libre más parecida en forma y ancho (±1,6 %).
const sans = Figtree({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const display = Pirata_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const DESCRIPCION_BASE =
  'Streetwear boliviano: poleras, manga larga y conjuntos Track de edición limitada.'

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
    icons: { icon: '/logo-ojo-negro.svg', apple: '/apple-touch-icon.png' },
  }
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [ajustes, colecciones, categorias, prendas] = await Promise.all([
    getAjustes(),
    getColecciones(),
    getCategorias(),
    getPrendasMenu(),
  ])
  const whatsapp = ajustes.whatsapp?.replace(/\D/g, '') || null
  const redes = {
    instagram: ajustes.redes?.instagram,
    tiktok: ajustes.redes?.tiktok,
    whatsapp: whatsapp ? `https://wa.me/${whatsapp}` : null,
  }
  const sameAs = [ajustes.redes?.instagram, ajustes.redes?.tiktok, ajustes.redes?.facebook].filter(
    (r): r is string => typeof r === 'string' && r.length > 0,
  )
  const listaColecciones = colecciones.map((c) => ({ nombre: c.nombre, slug: c.slug }))
  // Mismo recuadro inicial que el sitio estático: la chaqueta Track Reliquia.
  const destacada =
    prendas.find((p) => p.slug === 'chaqueta-track-reliquia') ??
    prendas.find((p) => p.imagen) ??
    null

  return (
    <html lang="es-BO" className={`${sans.variable} ${display.variable}`}>
      <body>
        <CarritoProvider>
          <MenuMovilProvider>
            <FavoritosProvider>
              <VistaRapidaProvider>
                <a href="#contenido" className="saltar">
                  Ir al contenido
                </a>
                <Cabecera
                  colecciones={listaColecciones}
                  categorias={categorias}
                  prendas={prendas}
                  destacada={destacada}
                  redes={redes}
                />
                <BarraLateral />
                <MenuMovil
                  colecciones={listaColecciones}
                  categorias={categorias}
                  prendas={prendas}
                  redes={redes}
                />
                <CajonCarrito />

                <main id="contenido">{children}</main>

                <Pie redes={redes} />
                <AvisoCookies />
                <ContrasteAuto />
              </VistaRapidaProvider>
            </FavoritosProvider>
          </MenuMovilProvider>
        </CarritoProvider>

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
                ...(sameAs.length > 0 && { sameAs }),
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
