// Enlaces del menú, el mega menú, el menú móvil y el footer. Mismo orden y
// mismos destinos que el sitio estático; las anclas de la portada pasan a
// páginas reales cuando existen.
// TODO: guía de tallas, envíos y contacto aún no existen; apuntan a "#" como
// en el sitio estático.

export type Enlace = { texto: string; href: string }

export const MENU_PRINCIPAL: (Enlace & { columna: 'colecciones' | 'prendas' | 'whatice' })[] = [
  { texto: 'NUEVO', href: '/coleccion/preludio', columna: 'whatice' },
  { texto: 'COLECCIONES', href: '/#colecciones', columna: 'colecciones' },
  { texto: 'PRENDAS', href: '/categoria/poleras', columna: 'prendas' },
  { texto: 'MANIFIESTO', href: '/#manifiesto', columna: 'whatice' },
]

// Categoría (tipo de prenda) para los menús: texto, página y el nombre del tipo
// (con él se elige una prenda al azar para el recuadro del mega menú).
export type CategoriaMenu = { texto: string; href: string; tipo: string }

export const INFORMACION: Enlace[] = [
  { texto: 'MANIFIESTO', href: '/#manifiesto' },
  { texto: 'GUÍA DE TALLAS', href: '#' },
  { texto: 'ENVÍOS Y CAMBIOS', href: '#' },
  { texto: 'CONTACTO', href: '#' },
]

export const PIE_INFO: Enlace[] = [
  { texto: 'NOSOTROS', href: '/#manifiesto' },
  { texto: 'GUÍA DE TALLAS', href: '#' },
  { texto: 'ENVÍOS', href: '#' },
  { texto: 'CONTACTO', href: '#' },
]

export const PIE_LEGAL: Enlace[] = [
  { texto: 'TÉRMINOS Y CONDICIONES', href: '#' },
  { texto: 'PRIVACIDAD', href: '#' },
]

export const TAGLINE = 'Preludio a la ropa en Latinoamérica.'

// Prenda mínima para los menús (recuadro destacado del mega menú y del móvil).
export type PrendaMenu = {
  slug: string
  nombre: string
  precio: number
  coleccion: string | null
  tipo: string | null
  imagen: string | null
}
