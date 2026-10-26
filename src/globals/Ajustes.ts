import type { GlobalConfig } from 'payload'

import { CIUDADES } from '@/lib/pedidos/estados'
import { revalidarTodo } from '@/lib/revalidar'
import { CUIDADO, ORIGEN } from '@/lib/textos'
import { publico, soloEquipo } from '@/lib/acceso'

export const Ajustes: GlobalConfig = {
  slug: 'ajustes',
  typescript: { interface: 'Ajustes' },
  label: 'Ajustes de la tienda',
  access: { read: publico, update: soloEquipo },
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
      name: 'envios',
      label: 'Envíos',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'costoLocal',
              label: 'Envío a domicilio (Bs)',
              type: 'number',
              defaultValue: 15,
              min: 0,
              admin: { description: 'Solo en las ciudades de abajo.' },
            },
            {
              name: 'costoNacional',
              label: 'Encomienda (Bs)',
              type: 'number',
              defaultValue: 35,
              min: 0,
              admin: { description: 'A cualquier ciudad; se recoge en la terminal.' },
            },
            {
              name: 'gratisDesde',
              label: 'Envío gratis desde (Bs)',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: { description: '0 = nunca gratis.' },
            },
          ],
        },
        {
          name: 'ciudadesLocales',
          label: 'Ciudades con envío a domicilio',
          type: 'select',
          hasMany: true,
          defaultValue: ['La Paz', 'El Alto'],
          options: CIUDADES.map((c) => ({ label: c, value: c })),
        },
        {
          // (Se llama "recojo" por la versión anterior; hoy es la nota de encomiendas.)
          name: 'recojo',
          label: 'Nota para encomiendas',
          type: 'text',
          admin: { description: 'Se muestra al elegir encomienda. Ej.: "Despachamos al día hábil siguiente por la empresa que elijas."' },
        },
      ],
    },
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
