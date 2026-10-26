import type { Metadata } from 'next'

import { ListaFavoritos } from '@/components/favoritos/ListaFavoritos'

export const metadata: Metadata = {
  title: 'Favoritos',
  robots: { index: false, follow: false },
}

export default function PaginaFavoritos() {
  return <ListaFavoritos />
}
