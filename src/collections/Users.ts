import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: {
    useAsTitle: 'email',
    group: 'Administración',
  },
  auth: {
    // Bloquea la cuenta 10 minutos tras 5 intentos fallidos.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
    },
  ],
}
