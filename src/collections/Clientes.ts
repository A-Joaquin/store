import type { CollectionConfig } from 'payload'

import { equipoOElMismo, soloEquipo } from '@/lib/acceso'

// Cuentas de los clientes de la tienda (no entran al panel). Se registran e
// inician sesión desde /cuenta con acciones del servidor; por la API nadie
// puede crear cuentas (evita registros automáticos masivos).
export const Clientes: CollectionConfig = {
  slug: 'clientes',
  typescript: { interface: 'Cliente' },
  labels: { singular: 'Cliente', plural: 'Clientes' },
  auth: {
    // 5 intentos fallidos bloquean la cuenta 10 minutos.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    // 30 días de sesión.
    tokenExpiration: 30 * 24 * 3600,
  },
  access: {
    read: equipoOElMismo,
    update: equipoOElMismo,
    create: soloEquipo,
    delete: soloEquipo,
    // Los clientes nunca entran al panel.
    admin: () => false,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'nombre', 'telefono', 'createdAt'],
    group: 'Ventas',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'nombre', type: 'text', required: true },
        { name: 'telefono', label: 'WhatsApp', type: 'text' },
      ],
    },
    {
      name: 'favoritos',
      type: 'relationship',
      relationTo: 'productos',
      hasMany: true,
    },
  ],
}
