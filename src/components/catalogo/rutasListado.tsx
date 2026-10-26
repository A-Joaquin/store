import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { cargarListado, metadataListado, todasLasPaginas, type TipoListado } from '@/lib/listados'

import { PaginaListado } from './PaginaListado'

type ParamsBase = Promise<{ slug: string }>
type ParamsPagina = Promise<{ slug: string; n: string }>

// Rutas de listado: /<tipo>/<slug> y /<tipo>/<slug>/pagina/<n>, para
// colecciones y categorías. Todas las páginas se generan al compilar y se
// regeneran al publicar cambios en el panel.
export function rutasListado(tipo: TipoListado) {
  const primera = {
    generateStaticParams: async () => (await todasLasPaginas()).filter((l) => l.tipo === tipo).map((l) => ({ slug: l.slug })),
    generateMetadata: async ({ params }: { params: ParamsBase }): Promise<Metadata> => {
      const l = await cargarListado(tipo, (await params).slug, 1)
      return l ? metadataListado(l) : {}
    },
    Pagina: async ({ params }: { params: ParamsBase }) => {
      const l = await cargarListado(tipo, (await params).slug, 1)
      if (!l) notFound()
      return <PaginaListado listado={l} />
    },
  }

  const numero = (n: string) => (/^\d+$/.test(n) ? Number(n) : NaN)
  const siguientes = {
    generateStaticParams: async () =>
      (await todasLasPaginas())
        .filter((l) => l.tipo === tipo)
        .flatMap((l) => Array.from({ length: l.paginas - 1 }, (_, i) => ({ slug: l.slug, n: String(i + 2) }))),
    generateMetadata: async ({ params }: { params: ParamsPagina }): Promise<Metadata> => {
      const { slug, n } = await params
      const l = await cargarListado(tipo, slug, numero(n))
      return l ? metadataListado(l) : {}
    },
    Pagina: async ({ params }: { params: ParamsPagina }) => {
      const { slug, n } = await params
      // /pagina/1 es la misma que la dirección base.
      if (n === '1') permanentRedirect(`/${tipo}/${slug}`)
      const l = await cargarListado(tipo, slug, numero(n))
      if (!l) notFound()
      return <PaginaListado listado={l} />
    },
  }

  return { primera, siguientes }
}
