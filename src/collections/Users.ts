import type { CollectionConfig } from 'payload'
import { soloEquipo } from '@/lib/acceso'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: {
    useAsTitle: 'email',
    group: 'Administración',
  },
  // Solo el equipo ve y administra a los usuarios del panel.
  access: { read: soloEquipo, create: soloEquipo, update: soloEquipo, delete: soloEquipo },
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
