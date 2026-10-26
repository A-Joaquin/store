import type { CollectionConfig } from 'payload'
import { APIError, type Where } from 'payload'

import { liberar } from '@/lib/pedidos/stock'
import { CIUDADES, ESTADOS, METODOS, type EstadoPedido } from '@/lib/pedidos/estados'
import { esEquipo, soloEquipo } from '@/lib/acceso'

const SOLO_BORRABLES: Where = { or: [{ estado: { equals: 'cancelado' } }, { simulado: { equals: true } }] }

// Pedidos de la fase 1: se crean desde la web (sin pago en línea), el stock
// queda reservado y la venta se cierra por WhatsApp. El equipo mueve el
// estado desde el panel; cada cambio queda en el historial.
export const Pedidos: CollectionConfig = {
  slug: 'pedidos',
  typescript: { interface: 'Pedido' },
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  access: {
    // Solo el equipo. La web crea pedidos desde el servidor (lib/pedidos/crear.ts).
    read: soloEquipo,
    create: soloEquipo,
    update: soloEquipo,
    // Solo cancelados o de prueba: borrar una venta devolvería su stock.
    delete: ({ req }) => (esEquipo(req) ? SOLO_BORRABLES : false),
  },
  admin: {
    useAsTitle: 'numero',
    defaultColumns: ['numero', 'nombre', 'telefono', 'total', 'estado', 'createdAt'],
    group: 'Ventas',
    listSearchableFields: ['numero', 'nombre', 'telefono'],
    description:
      'Pendiente = stock reservado, esperando el pago por WhatsApp (48 h). Al pasar a Confirmado es una venta. Cancelar devuelve el stock.',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'numero', label: 'N.º', type: 'text', unique: true, index: true, admin: { readOnly: true } },
        {
          name: 'estado',
          type: 'select',
          required: true,
          defaultValue: 'pendiente',
          options: ESTADOS.map((e) => ({ label: e.etiqueta, value: e.valor })),
          index: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Cliente',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'nombre', type: 'text', required: true },
            { name: 'telefono', label: 'WhatsApp', type: 'text', required: true },
            { name: 'email', type: 'email' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'documento', label: 'CI / NIT (factura)', type: 'text' },
            { name: 'razonSocial', label: 'Razón social', type: 'text' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Entrega',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'metodo',
              label: 'Método',
              type: 'select',
              required: true,
              defaultValue: 'domicilio',
              options: METODOS.map((m) => ({ label: m.etiqueta, value: m.valor })),
            },
            { name: 'ciudad', type: 'select', required: true, options: CIUDADES.map((c) => ({ label: c, value: c })) },
          ],
        },
        {
          type: 'row',
          admin: { condition: (data) => data?.metodo === 'domicilio' },
          fields: [
            { name: 'direccion', label: 'Dirección', type: 'textarea' },
            { name: 'referencia', label: 'Referencia', type: 'text' },
          ],
        },
        {
          type: 'row',
          admin: { condition: (data) => data?.metodo === 'encomienda' },
          fields: [
            { name: 'empresa', label: 'Empresa de transporte', type: 'text' },
            { name: 'recibeNombre', label: 'Recoge (nombre)', type: 'text' },
            { name: 'recibeDocumento', label: 'Recoge (CI)', type: 'text' },
          ],
        },
        {
          name: 'guia',
          label: 'N.º de guía / encomienda',
          type: 'text',
          admin: { description: 'Lo carga el equipo al despachar. El cliente lo ve en su seguimiento.' },
        },
      ],
    },
    {
      name: 'items',
      label: 'Prendas',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'producto', type: 'relationship', relationTo: 'productos', required: true },
            { name: 'nombre', type: 'text', required: true },
            { name: 'talla', type: 'text', required: true },
            { name: 'cantidad', type: 'number', required: true, min: 1 },
            { name: 'precio', label: 'Precio unitario (Bs)', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', label: 'Subtotal (Bs)', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'envio', label: 'Envío (Bs)', type: 'number', defaultValue: 0 },
        { name: 'total', label: 'Total (Bs)', type: 'number', required: true, admin: { readOnly: true } },
      ],
    },
    { name: 'notas', label: 'Notas del cliente', type: 'textarea', admin: { readOnly: true } },
    { name: 'notasInternas', label: 'Notas internas', type: 'textarea' },
    {
      name: 'historial',
      type: 'array',
      admin: { readOnly: true, initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'estado', type: 'text' },
            { name: 'fecha', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'nota', type: 'text' },
          ],
        },
      ],
    },
    // Barra lateral
    {
      // Solo interfaz (no se guarda): enlace de seguimiento para abrir, copiar
      // o mandar al cliente.
      name: 'enlace',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/components/admin/EnlaceSeguimiento#EnlaceSeguimiento' },
      },
    },
    {
      name: 'cliente',
      type: 'relationship',
      relationTo: 'clientes',
      admin: { position: 'sidebar', readOnly: true, description: 'Si el pedido se hizo con sesión iniciada.' },
    },
    {
      name: 'reservaHasta',
      label: 'Reserva hasta',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Si sigue pendiente después de esta hora, se cancela y el stock vuelve.',
      },
    },
    {
      name: 'stockReservado',
      label: 'Stock reservado',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      // Token del enlace de seguimiento que recibe el cliente.
      name: 'seguimiento',
      type: 'text',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'simulado',
      label: 'Pedido de prueba',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req, context }) => {
        if (operation !== 'update' || !originalDoc || data.estado === originalDoc.estado) return data
        const de = originalDoc.estado as EstadoPedido
        const a = data.estado as EstadoPedido
        if (de === 'cancelado') {
          throw new APIError('Un pedido cancelado no se puede reabrir: su stock ya se devolvió. Crea un pedido nuevo.', 400)
        }
        // Cancelar devuelve el stock reservado.
        if (a === 'cancelado' && originalDoc.stockReservado) {
          await liberar(
            req.payload,
            (originalDoc.items ?? []).map((i: { producto: number | { id: number }; talla: string; cantidad: number }) => ({
              productoId: typeof i.producto === 'object' ? i.producto.id : i.producto,
              talla: i.talla,
              cantidad: i.cantidad,
            })),
          )
          data.stockReservado = false
        }
        // Cada cambio de estado queda registrado.
        const nota =
          (context.nota as string | undefined) || (req.user ? `por ${req.user.email}` : 'automático')
        data.historial = [
          ...(originalDoc.historial ?? []),
          { estado: a, fecha: (context.fecha as string | undefined) || new Date().toISOString(), nota },
        ]
        return data
      },
    ],
    afterChange: [
      // Número legible a partir del id (único sin carreras): WI-1001, WI-1002…
      async ({ doc, operation, req }) => {
        if (operation !== 'create' || doc.numero) return doc
        const numero = `WI-${1000 + Number(doc.id)}`
        await req.payload.update({ collection: 'pedidos', id: doc.id, data: { numero }, req, context: { interno: true } })
        return { ...doc, numero }
      },
    ],
    afterDelete: [
      // Borrar un pedido que todavía reservaba stock lo devuelve.
      async ({ doc, req }) => {
        if (!doc.stockReservado) return
        await liberar(
          req.payload,
          (doc.items ?? []).map((i: { producto: number | { id: number }; talla: string; cantidad: number }) => ({
            productoId: typeof i.producto === 'object' ? i.producto.id : i.producto,
            talla: i.talla,
            cantidad: i.cantidad,
          })),
        )
      },
    ],
  },
}
