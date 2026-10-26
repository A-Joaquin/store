import type { GlobalConfig } from 'payload'

import { revalidarTodo } from '@/lib/revalidar'
import { CUIDADO, ORIGEN } from '@/lib/textos'

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
      name: 'ficha',
      label: 'Textos de la ficha de producto',
      type: 'group',
      fields: [
        {
          name: 'origen',
          label: 'Línea de origen (DESCRIPCIÓN)',
          type: 'text',
          defaultValue: ORIGEN,
          admin: { description: 'Va después de "Colección X."' },
        },
        {
          name: 'cuidado',
          label: 'Cuidado por defecto (MATERIAL)',
          type: 'textarea',
          defaultValue: CUIDADO,
        },
        {
          name: 'enlaceCambios',
          label: 'Enlace "Cambios y devoluciones"',
          type: 'text',
          admin: { description: 'Ej.: /cambios-y-devoluciones. Si queda vacío no se muestra.' },
        },
      ],
    },
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
