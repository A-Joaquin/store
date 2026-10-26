// Datos del sitio estático, copiados tal cual de assets/whatice/whatice-shop.js
// (CATALOG, GALLERIES, COLECCIONES) e index.html (hero y manifiesto).
// Los precios del sitio anterior eran de maqueta (formato pesos chilenos): aquí
// se guardan los originales y migrar-sitio-anterior.ts los convierte a Bs de ejemplo.

export type PrendaAnterior = {
  name: string
  price: number
  img: string
  color: string
  sizes: string[]
  desc: string
}

export const COLECCIONES: Record<string, string> = {
  preludio: 'Preludio',
  track: 'Track Club',
  archivo: 'Archivo',
}

export const CATALOG: Record<string, PrendaAnterior> = {
  'preludio-look1': { name: 'Polera Escarcha', price: 29990, img: 'look-tee-escarcha.jpg', color: 'Hueso', sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'Jersey pesado con estampado escarcha a la espalda.' },
  'preludio-look2': { name: 'Manga Larga Llama Rosa', price: 39990, img: 'look-ls-llama-rosa-modelo.jpg', color: 'Negro', sizes: ['S', 'M', 'L', 'XL'], desc: 'Manga larga de algodón con llama rosa al frente.' },
  'preludio-look3': { name: 'Polera Preludio', price: 29990, img: 'look-tee-preludio.jpg', color: 'Hielo', sizes: ['XS', 'S', 'M', 'L'], desc: 'Pieza insignia de la colección 01.' },
  'preludio-look4': { name: 'Manga Larga Daga Cúbica', price: 39990, img: 'look-ls-daga-cubica-modelo.jpg', color: 'Carbón', sizes: ['S', 'M', 'L', 'XL'], desc: 'Gráfica de daga cúbica en tinta reflectante.' },
  'preludio-look5': { name: 'Polera Daga Cúbica', price: 29990, img: 'look-tee-daga-cubica.jpg', color: 'Negro', sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'Versión polera del gráfico daga cúbica.' },
  'preludio-look6': { name: 'Manga Larga Ojo Iridiscente', price: 42990, img: 'look-ls-ojo-iridiscente.jpg', color: 'Acero', sizes: ['S', 'M', 'L'], desc: 'Estampado ojo con tinta iridiscente.' },
  'preludio-look7': { name: 'Manga Larga Pocket Flame', price: 42990, img: 'look-ls-pocket-flame.jpg', color: 'Negro', sizes: ['S', 'M', 'L', 'XL'], desc: 'Bolsillo frontal con llama bordada.' },

  'track-look1': { name: 'Chaqueta Track Sangre', price: 79990, img: 'look-track-sangre-chaqueta.jpg', color: 'Sangre', sizes: ['S', 'M', 'L', 'XL'], desc: 'Chaqueta del conjunto Track Club, color sangre.' },
  'track-look2': { name: 'Pantalón Track Sangre', price: 69990, img: 'look-track-sangre-pantalon.jpg', color: 'Sangre', sizes: ['S', 'M', 'L', 'XL'], desc: 'Pantalón a juego del conjunto Track Club.' },
  'track-look3': { name: 'Chaqueta Track Abismo', price: 79990, img: 'look-track-abismo-chaqueta.jpg', color: 'Abismo', sizes: ['S', 'M', 'L', 'XL'], desc: 'Chaqueta Track Club en azul abismo.' },
  'track-look4': { name: 'Chaqueta Track Reliquia', price: 79990, img: 'look-track-reliquia-chaqueta.jpg', color: 'Reliquia', sizes: ['S', 'M', 'L', 'XL'], desc: 'Chaqueta Track Club tono reliquia.' },
  'track-look5': { name: 'Pantalón Track Reliquia', price: 69990, img: 'look-track-reliquia-pantalon.jpg', color: 'Reliquia', sizes: ['S', 'M', 'L', 'XL'], desc: 'Pantalón Track Club tono reliquia.' },
  'track-look6': { name: 'Chaqueta Track Hueso', price: 79990, img: 'look-track-hueso-chaqueta.jpg', color: 'Hueso', sizes: ['S', 'M', 'L', 'XL'], desc: 'Chaqueta Track Club en hueso.' },
  'track-look7': { name: 'Pantalón Track Abismo', price: 69990, img: 'look-track-abismo-pantalon.jpg', color: 'Abismo', sizes: ['S', 'M', 'L', 'XL'], desc: 'Pantalón Track Club en azul abismo.' },

  'archivo-look1': { name: 'Polera Cadenas', price: 31990, img: 'look-tee-cadenas.jpg', color: 'Negro', sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'Pieza de archivo con gráfica de cadenas.' },
  'archivo-look2': { name: 'Conjunto Urbano', price: 139990, img: 'look-hero-modelo-urbano.jpg', color: 'Mixto', sizes: ['S', 'M', 'L'], desc: 'Look completo de archivo, edición limitada.' },
  'archivo-look3': { name: 'Polera Contorno Oro', price: 32990, img: 'look-tee-contorno-oro.jpg', color: 'Negro', sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'Contorno en lámina dorada.' },
  'archivo-look4': { name: 'Polera Esmeralda', price: 31990, img: 'look-tee-esmeralda.jpg', color: 'Esmeralda', sizes: ['S', 'M', 'L', 'XL'], desc: 'Tinte esmeralda sobre jersey pesado.' },
  'archivo-look5': { name: 'Polera Ultra', price: 33990, img: 'look-tee-ultra.jpg', color: 'Blanco', sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'Homenaje Ultra, estampado frontal.' },
  'archivo-look6': { name: 'Conjunto Track Hueso', price: 139990, img: 'look-track-hueso.jpg', color: 'Hueso', sizes: ['S', 'M', 'L', 'XL'], desc: 'Conjunto completo Track Club hueso.' },
  'archivo-look7': { name: 'Conjunto Track Abismo', price: 139990, img: 'look-track-abismo.jpg', color: 'Abismo', sizes: ['S', 'M', 'L', 'XL'], desc: 'Conjunto completo Track Club abismo.' },
}

// Galerías de los conjuntos Track (chaqueta + look + pantalón).
export const GALLERIES: Record<string, string[]> = {
  'track-look1': ['look-track-sangre-chaqueta.jpg', 'look-track-sangre.jpg', 'look-track-sangre-pantalon.jpg'],
  'track-look2': ['look-track-sangre-pantalon.jpg', 'look-track-sangre.jpg', 'look-track-sangre-chaqueta.jpg'],
  'track-look3': ['look-track-abismo-chaqueta.jpg', 'look-track-abismo.jpg', 'look-track-abismo-pantalon.jpg'],
  'track-look4': ['look-track-reliquia-chaqueta.jpg', 'look-track-reliquia.jpg', 'look-track-reliquia-pantalon.jpg'],
  'track-look5': ['look-track-reliquia-pantalon.jpg', 'look-track-reliquia.jpg', 'look-track-reliquia-chaqueta.jpg'],
  'track-look6': ['look-track-hueso-chaqueta.jpg', 'look-track-hueso.jpg', 'look-track-hueso-pantalon.jpg'],
  'track-look7': ['look-track-abismo-pantalon.jpg', 'look-track-abismo.jpg', 'look-track-abismo-chaqueta.jpg'],
  'archivo-look6': ['look-track-hueso.jpg', 'look-track-hueso-chaqueta.jpg', 'look-track-hueso-pantalon.jpg'],
  'archivo-look7': ['look-track-abismo.jpg', 'look-track-abismo-chaqueta.jpg', 'look-track-abismo-pantalon.jpg'],
}

export const galeriaDe = (id: string) => GALLERIES[id] ?? [CATALOG[id].img]

// Mismo criterio que tipoDe() del sitio estático: el primer tipo cuyo nombre
// aparece en el de la prenda; si ninguno coincide, Polera.
export const TIPOS_ORDEN = ['Manga Larga', 'Polera', 'Chaqueta', 'Pantalón', 'Conjunto']
export const tipoDe = (nombre: string) => TIPOS_ORDEN.find((t) => nombre.includes(t)) ?? 'Polera'

export const coleccionDe = (id: string) => id.split('-')[0]

// "preludio-look1" -> "WI-PRE-001", igual que skuDe() del sitio estático.
export function skuDe(id: string) {
  const [col, n] = id.split('-look')
  return `WI-${col.slice(0, 3).toUpperCase()}-${n.padStart(3, '0')}`
}

// Hero de index.html: slide de escritorio, su versión móvil y a dónde lleva
// (las anclas del sitio anterior pasan a páginas de colección).
export const HERO = [
  { imagen: 'hero-1.jpg', movil: 'hero-m1.jpg', coleccion: 'track' },
  { imagen: 'hero-2.jpg', movil: 'hero-m2.jpg', coleccion: 'preludio' },
  { imagen: 'hero-3.jpg', movil: 'hero-m3.jpg', coleccion: 'archivo' },
  { imagen: 'hero-4.jpg', movil: 'hero-m4.jpg', coleccion: 'preludio' },
  { imagen: 'hero-5.jpg', movil: 'hero-m5.jpg', coleccion: null },
]

export const MANIFIESTO =
  'WHATICE nace de una pregunta. La espada corta lo que sobra, el ojo mira lo que nadie ve y el cubo guarda lo que todavía no sabemos.'

export const TAGLINE = 'Preludio a la ropa en Latinoamérica.'
