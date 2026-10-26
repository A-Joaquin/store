import Link from 'next/link'

import { SITE_URL } from '@/lib/sitio'

import { JsonLd } from './JsonLd'

export type Miga = { nombre: string; ruta: string }

// BreadcrumbList para Google (Inicio › … › página actual).
export function MigasDatos({ items }: { items: Miga[] }) {
  const todas = [{ nombre: 'Inicio', ruta: '/' }, ...items]
  return (
    <JsonLd
      datos={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: todas.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: m.nombre,
          item: SITE_URL + m.ruta,
        })),
      }}
    />
  )
}

// Migas visibles + BreadcrumbList.
export function Migas({ items }: { items: Miga[] }) {
  const todas = [{ nombre: 'Inicio', ruta: '/' }, ...items]
  return (
    <>
      <nav aria-label="Migas de pan" className="migas">
        <ol>
          {todas.map((m, i) => (
            <li key={m.ruta}>
              {i < todas.length - 1 ? <Link href={m.ruta}>{m.nombre}</Link> : <span aria-current="page">{m.nombre}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <MigasDatos items={items} />
    </>
  )
}
