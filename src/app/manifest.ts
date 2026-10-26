import type { MetadataRoute } from 'next'

// Para "Agregar a pantalla de inicio" en Android y para que Google tenga el ícono.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WHATICE',
    short_name: 'WHATICE',
    description: 'Streetwear de Bolivia: poleras, manga larga y conjuntos Track.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
