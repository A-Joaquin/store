import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { revalidar } from '@/lib/revalidar'

export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'] as const

export const Productos: CollectionConfig = {
  slug: 'productos',
  labels: { singular: 'Producto', plural: 'Productos' },
  access: {
    // Sin sesión solo se ven los publicados; los borradores quedan en el panel.
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
  },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'coleccion', 'precio', '_status', 'updatedAt'],
    group: 'Catálogo',
  },
  defaultSort: 'orden',
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'nombre', type: 'text', required: true },
        {
          name: 'tipo',
          label: 'Tipo de prenda',
          type: 'relationship',
          relationTo: 'tipos',
          required: true,
          admin: { description: 'Define el material por defecto y la tabla de medidas.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'color',
          type: 'text',
          required: true,
          admin: { description: 'Ej.: Hueso, Negro, Abismo' },
        },
        {
          name: 'coleccion',
          label: 'Colección',
          type: 'relationship',
          relationTo: 'colecciones',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'precio',
          label: 'Precio (Bs)',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'precioAnterior',
          label: 'Precio anterior (Bs)',
          type: 'number',
          min: 0,
          admin: { description: 'Opcional: se muestra tachado si hay descuento.' },
        },
      ],
    },
    {
      name: 'galeria',
      label: 'Galería',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: { description: 'La primera foto es la principal (tarjeta, ficha y Google).' },
    },
    {
      name: 'fotosDetalle',
      label: 'Fotos de detalle',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Acordeón DESCRIPCIÓN. Única para cada prenda: corte, tela, calce. Google penaliza textos repetidos.',
      },
    },
    {
      name: 'material',
      type: 'textarea',
      admin: { description: 'Acordeón MATERIAL. Opcional: si queda vacío se usa el del tipo de prenda.' },
    },
    {
      name: 'cuidado',
      type: 'textarea',
      admin: { description: 'Opcional: si queda vacío se usa el texto de Ajustes de la tienda.' },
    },
    {
      name: 'tallas',
      type: 'array',
      labels: { singular: 'Talla', plural: 'Tallas' },
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
            { name: 'stock', type: 'number', required: true, min: 0, defaultValue: 0 },
            { name: 'sku', label: 'SKU', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'relacionados',
      label: 'Completa el look',
      type: 'relationship',
      relationTo: 'productos',
      hasMany: true,
      admin: { description: 'Si queda vacío se muestran prendas de la misma colección.' },
    },
    slugField(),
    {
      name: 'sku',
      label: 'SKU',
      type: 'text',
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'destacado',
      type: 'checkbox',
      admin: { position: 'sidebar' },
    },
    {
      name: 'orden',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, previousDoc }) => {
        const rutas = ['/', `/producto/${doc.slug}`, '/sitemap.xml']
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) rutas.push(`/producto/${previousDoc.slug}`)
        revalidar(...rutas)
      },
    ],
    afterDelete: [({ doc }) => revalidar('/', `/producto/${doc.slug}`, '/sitemap.xml')],
  },
}
