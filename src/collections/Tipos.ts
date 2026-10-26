import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { revalidarTodo } from '@/lib/revalidar'
import { NOTA_MEDIDAS } from '@/lib/textos'

import { TALLAS } from './Productos'

// Hasta 4 columnas en la tabla de medidas (hoy se usan 3 en todos los tipos).
export const COLUMNAS = ['c1', 'c2', 'c3', 'c4'] as const

export const Tipos: CollectionConfig = {
  slug: 'tipos',
  typescript: { interface: 'Tipo' },
  labels: { singular: 'Tipo de prenda', plural: 'Tipos de prenda' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'categoria', 'updatedAt'],
    group: 'Catálogo',
    description:
      'Material y tabla de medidas que comparten todas las prendas del mismo tipo (acordeones MATERIAL y TALLA de la ficha).',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'nombre',
          type: 'text',
          required: true,
          unique: true,
          admin: { description: 'Ej.: Polera, Manga Larga, Chaqueta' },
        },
        {
          name: 'categoria',
          label: 'Categoría',
          type: 'text',
          admin: { description: 'En plural, como se muestra en la tienda. Ej.: POLERAS' },
        },
      ],
    },
    // Dirección de la página de categoría: /categoria/<slug> (desde "Categoría").
    slugField('categoria', { requerido: false }),
    {
      name: 'descripcion',
      label: 'Texto de la página de categoría',
      type: 'textarea',
      admin: { description: 'Opcional. Se muestra al final del listado y ayuda en Google (120–250 palabras).' },
    },
    {
      name: 'material',
      type: 'textarea',
      required: true,
      admin: { description: 'Se muestra en MATERIAL si la prenda no tiene uno propio.' },
    },
    {
      name: 'columnas',
      label: 'Columnas de la tabla de medidas',
      type: 'array',
      minRows: 1,
      maxRows: COLUMNAS.length,
      labels: { singular: 'Columna', plural: 'Columnas' },
      admin: { description: 'Ej.: Largo, Ancho pecho, Manga.' },
      fields: [{ name: 'nombre', type: 'text', required: true }],
    },
    {
      name: 'medidas',
      label: 'Medidas por talla (cm)',
      type: 'array',
      labels: { singular: 'Talla', plural: 'Tallas' },
      admin: {
        description:
          'Una fila por talla, con los valores en el mismo orden que las columnas. En la ficha solo se muestran las tallas que tiene cada prenda.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'talla',
              type: 'select',
              required: true,
              options: TALLAS.map((t) => ({ label: t, value: t })),
            },
            ...COLUMNAS.map((c, i) => ({
              name: c,
              label: `Columna ${i + 1}`,
              type: 'number' as const,
              min: 0,
            })),
          ],
        },
      ],
    },
    {
      name: 'nota',
      label: 'Nota bajo la tabla',
      type: 'textarea',
      defaultValue: NOTA_MEDIDAS,
    },
  ],
  hooks: {
    // Lo usan todas las fichas de ese tipo: se regenera todo el sitio.
    afterChange: [() => revalidarTodo()],
    afterDelete: [() => revalidarTodo()],
  },
}
