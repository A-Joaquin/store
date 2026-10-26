import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { revalidarTodo } from '@/lib/revalidar'
import { lecturaPublica } from '@/lib/acceso'

export const Colecciones: CollectionConfig = {
  slug: 'colecciones',
  typescript: { interface: 'Coleccion' },
  labels: { singular: 'Colección', plural: 'Colecciones' },
  access: lecturaPublica,
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'slug', 'orden'],
    group: 'Catálogo',
  },
  defaultSort: 'orden',
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'descripcion',
      label: 'Texto introductorio',
      type: 'textarea',
      admin: {
        description:
          'Se muestra arriba del listado. 120–250 palabras ayudan a posicionar la colección en Google.',
      },
    },
    {
      name: 'imagen',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'orden',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [() => revalidarTodo()],
    afterDelete: [() => revalidarTodo()],
  },
}
