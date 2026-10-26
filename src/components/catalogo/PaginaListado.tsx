import s from '@/app/(frontend)/coleccion/[slug]/coleccion.module.css'
import { JsonLd } from '@/components/JsonLd'
import { Migas } from '@/components/Migas'
import type { Listado } from '@/lib/listados'
import { SITE_URL, rutaPagina, rutaProducto } from '@/lib/sitio'

import { BloqueColeccion } from './BloqueColeccion'
import { Paginacion } from './Paginacion'

// Página de colección o de categoría (cualquier número de página): mismo
// bloque que la portada, migas, índice de páginas y texto introductorio.
export function PaginaListado({ listado }: { listado: Listado }) {
  const { titulo, base, pagina, totalPaginas, total, prendas, descripcion } = listado
  return (
    <div className={s.pagina}>
      <div className={s.migas}>
        <Migas
          items={[
            { nombre: titulo, ruta: base },
            ...(pagina > 1 ? [{ nombre: `Página ${pagina}`, ruta: rutaPagina(base, pagina) }] : []),
          ]}
        />
      </div>
      <BloqueColeccion titulo={titulo} prendas={prendas} total={total} tituloComoH1 prioridad={3} />
      <Paginacion base={base} pagina={pagina} total={totalPaginas} />
      {descripcion && pagina === 1 && <p className={s.intro}>{descripcion}</p>}

      <JsonLd
        datos={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: titulo,
          numberOfItems: total,
          itemListElement: prendas.map((p, i) => ({
            '@type': 'ListItem',
            position: (pagina - 1) * prendas.length + i + 1,
            url: SITE_URL + rutaProducto(p.slug),
          })),
        }}
      />
    </div>
  )
}
