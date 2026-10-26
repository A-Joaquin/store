import type { CollectionConfig, ImageSize } from 'payload'
import sharp from 'sharp'

import { ANCHOS } from '@/lib/imagen'
import { lecturaPublica } from '@/lib/acceso'

// Cada tamaño necesita su propio formatOptions: sin él Payload conserva el
// formato original y un PNG de 2 MB seguiría saliendo PNG.
const webp = { format: 'webp', options: { quality: 80 } } as const

const ancho = (name: string, width: number): ImageSize => ({
  name,
  width,
  withoutEnlargement: true,
  formatOptions: webp,
})

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  access: lecturaPublica,
  admin: {
    group: 'Catálogo',
  },
  fields: [
    {
      name: 'alt',
      label: 'Texto alternativo',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe la foto para Google y lectores de pantalla. Ej.: "Polera oversize Escarcha negra, vista de espalda".',
      },
    },
    {
      // Miniatura de 16 px en base64: se muestra borrosa mientras carga la foto.
      name: 'blurDataURL',
      type: 'text',
      admin: { hidden: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, data }) => {
        if (req.file?.data && req.file.mimetype?.startsWith('image/')) {
          const mini = await sharp(req.file.data).resize(16).webp({ quality: 40 }).toBuffer()
          data.blurDataURL = `data:image/webp;base64,${mini.toString('base64')}`
        }
        return data
      },
    ],
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    crop: true,
    adminThumbnail: 'w400',
    imageSizes: [
      ...ANCHOS.map(({ name, width }) => ancho(name, width)),
      // Vista previa al compartir en WhatsApp, Instagram y Facebook.
      {
        name: 'og',
        width: 1200,
        height: 630,
        formatOptions: { format: 'jpeg', options: { quality: 82 } },
      },
    ],
  },
}
