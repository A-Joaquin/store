import type { GlobalConfig } from 'payload'

import { revalidarTodo } from '@/lib/revalidar'

export const Ajustes: GlobalConfig = {
  slug: 'ajustes',
  typescript: { interface: 'Ajustes' },
  label: 'Ajustes de la tienda',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Sitio',
  },
  fields: [
    {
      name: 'descripcion',
      label: 'Descripción del sitio',
      type: 'textarea',
      admin: { description: 'Descripción por defecto para Google (≤ 155 caracteres).' },
    },
    {
      name: 'whatsapp',
      label: 'WhatsApp de ventas',
      type: 'text',
      admin: { description: 'Con código de país y sin espacios. Ej.: 59170000000' },
    },
    { name: 'email', type: 'email' },
    {
      name: 'redes',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'tiktok', label: 'TikTok', type: 'text' },
        { name: 'facebook', type: 'text' },
      ],
    },
  ],
  hooks: {
    // Afecta al layout (JSON-LD de la marca y botón de WhatsApp) en todas las páginas.
    afterChange: [() => revalidarTodo()],
  },
}
