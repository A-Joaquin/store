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

export function Paginacion({ base, pagina, total }: { base: string; pagina: number; total: number }) {
  if (total <= 1) return null
  return (
    <nav className={s.paginacion} aria-label="Páginas">
      {pagina > 1 ? (
        <Link className={s.flecha} href={rutaPagina(base, pagina - 1)} rel="prev" aria-label="Página anterior">
          ←
        </Link>
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
                <Link href={rutaPagina(base, n)}>{String(n).padStart(2, '0')}</Link>
              )}
            </li>
          ),
        )}
      </ol>
      {pagina < total ? (
        <Link className={s.flecha} href={rutaPagina(base, pagina + 1)} rel="next" aria-label="Página siguiente">
          →
        </Link>
      ) : (
        <span className={`${s.flecha} ${s.inactiva}`} aria-hidden="true">
          →
        </span>
      )}
    </nav>
  )
}
