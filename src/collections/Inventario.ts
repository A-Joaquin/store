import type { CollectionConfig } from 'payload'

import { revalidarTodo } from '@/lib/revalidar'

import { TALLAS } from './Productos'
import { lecturaPublica } from '@/lib/acceso'

export const STOCK_BAJO = 2

// Stock disponible por prenda y talla. Vive aparte del producto para que
// editar la ficha en el panel nunca pise el stock que movió un pedido.
// Los pedidos lo descuentan y lo devuelven con UPDATE atómicos
// (lib/pedidos/stock.ts), no por esta colección.
export const Inventario: CollectionConfig = {
  slug: 'inventario',
  typescript: { interface: 'ItemInventario' },
  labels: { singular: 'Stock', plural: 'Inventario' },
  access: lecturaPublica,
  admin: {
    useAsTitle: 'etiqueta',
    defaultColumns: ['etiqueta', 'stock', 'updatedAt'],
    group: 'Ventas',
    description: `Unidades disponibles por talla. Los pedidos pendientes ya están descontados (reservados). Stock bajo: ${STOCK_BAJO} o menos.`,
    listSearchableFields: ['etiqueta'],
  },
  defaultSort: 'etiqueta',
  indexes: [{ fields: ['producto', 'talla'], unique: true }],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'producto',
          type: 'relationship',
          relationTo: 'productos',
          required: true,
          index: true,
        },
        {
          name: 'talla',
          type: 'select',
          required: true,
          options: TALLAS.map((t) => ({ label: t, value: t })),
        },
        {
          name: 'stock',
          label: 'Disponible',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
        },
      ],
    },
    {
      // "Polera Escarcha · M": para buscar y ordenar en la lista.
      name: 'etiqueta',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const id = typeof data.producto === 'object' ? data.producto?.id : data.producto
        if (id && data.talla) {
          const p = await req.payload.findByID({ collection: 'productos', id, depth: 0, draft: true, req })
          data.etiqueta = `${p.nombre} · ${data.talla}`
        }
        return data
      },
    ],
    // El stock sale en fichas, vista rápida y JSON-LD de todas las páginas.
    afterChange: [() => revalidarTodo()],
    afterDelete: [() => revalidarTodo()],
  },
}
