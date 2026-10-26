import type { Field, FieldHook } from 'payload'

// "Conjunto Track Ábismo" -> "conjunto-track-abismo"
export const slugify = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const formatearSlug =
  (campoOrigen: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)
    const origen = data?.[campoOrigen]
    if (typeof origen === 'string') return slugify(origen)
    return value
  }

// Es la dirección de la página (/producto/<slug>): cambiarla rompe los enlaces
// ya compartidos e indexados, así que solo se genera si está vacía.
export const slugField = (campoOrigen = 'nombre'): Field => ({
  name: 'slug',
  label: 'Dirección (slug)',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Se genera desde el nombre. Evita cambiarla una vez publicada.',
  },
  hooks: {
    beforeValidate: [formatearSlug(campoOrigen)],
  },
})
