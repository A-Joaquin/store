import type { GlobalConfig } from 'payload'

import { revalidar } from '@/lib/revalidar'

export const Portada: GlobalConfig = {
  slug: 'portada',
  label: 'Portada',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Sitio',
  },
  fields: [
    {
      name: 'hero',
      label: 'Slides del hero',
      type: 'array',
      labels: { singular: 'Slide', plural: 'Slides' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'imagen',
              label: 'Imagen escritorio',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'imagenMovil',
              label: 'Imagen móvil',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Vertical. Si falta se usa la de escritorio.' },
            },
          ],
        },
        { name: 'titulo', type: 'text' },
        { name: 'enlace', type: 'text', admin: { description: 'Ej.: /coleccion/track' } },
      ],
    },
    {
      name: 'manifiesto',
      type: 'textarea',
    },
    {
      name: 'destacados',
      label: 'Productos destacados',
      type: 'relationship',
      relationTo: 'productos',
      hasMany: true,
    },
  ],
  hooks: {
    afterChange: [() => revalidar('/')],
  },
}
