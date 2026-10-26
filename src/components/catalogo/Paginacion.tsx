import Link from 'next/link'

import { rutaPagina } from '@/lib/sitio'

import s from './Paginacion.module.css'

// Números a mostrar: primera, última, la actual y sus vecinas; "…" en los saltos.
function numeros(actual: number, total: number): (number | '…')[] {
  const set = new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total))
  const lista = [...set].sort((a, b) => a - b)
  const salida: (number | '…')[] = []
  lista.forEach((n, i) => {
    if (i > 0 && n - lista[i - 1] > 1) salida.push('…')
    salida.push(n)
  })
  return salida
}

type Props = {
  base: string
  pagina: number
  total: number
  // Con alCambiar, cambia de página en el lugar (portada); sin él, son
  // enlaces a /…/pagina/n (páginas de colección y categoría).
  alCambiar?: (n: number) => void
}

export function Paginacion({ base, pagina, total, alCambiar }: Props) {
  if (total <= 1) return null

  const destino = (n: number, contenido: React.ReactNode, props: { className?: string; rel?: string; label?: string } = {}) =>
    alCambiar ? (
      <button type="button" className={`${s.boton} ${props.className ?? ''}`} onClick={() => alCambiar(n)} aria-label={props.label}>
        {contenido}
      </button>
    ) : (
      <Link className={props.className} href={rutaPagina(base, n)} rel={props.rel} aria-label={props.label}>
        {contenido}
      </Link>
    )

  return (
    <nav className={s.paginacion} aria-label="Páginas">
      {pagina > 1 ? (
        destino(pagina - 1, '←', { className: s.flecha, rel: 'prev', label: 'Página anterior' })
      ) : (
        <span className={`${s.flecha} ${s.inactiva}`} aria-hidden="true">
          ←
        </span>
      )}
      <ol>
        {numeros(pagina, total).map((n, i) =>
          n === '…' ? (
            <li key={`s${i}`} className={s.salto}>
              …
            </li>
          ) : (
            <li key={n}>
              {n === pagina ? (
                <span className={s.actual} aria-current="page">
                  {String(n).padStart(2, '0')}
                </span>
              ) : (
                destino(n, String(n).padStart(2, '0'))
              )}
            </li>
          ),
        )}
      </ol>
      {pagina < total ? (
        destino(pagina + 1, '→', { className: s.flecha, rel: 'next', label: 'Página siguiente' })
      ) : (
        <span className={`${s.flecha} ${s.inactiva}`} aria-hidden="true">
          →
        </span>
      )}
    </nav>
  )
}
