// Pasa el catálogo del sitio estático al panel: colecciones, imágenes,
// prendas y portada. Además escribe redirecciones-sitio-anterior.json con
// las direcciones viejas (producto.html?id=...) para las redirecciones 301.
// Se puede volver a ejecutar: actualiza lo que ya existe en vez de duplicarlo.
//   npx payload run scripts/migrar-sitio-anterior.ts
import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Producto } from '@/payload-types'

import {
  CATALOG,
  COLECCIONES,
  HERO,
  MANIFIESTO,
  TAGLINE,
  coleccionDe,
  galeriaDe,
  skuDe,
  tipoDe,
} from './datos-sitio-anterior'

const ASSETS = path.resolve(process.cwd(), '../assets/whatice')

type Talla = NonNullable<Producto['tallas']>[number]['talla']

// Los precios del sitio anterior eran de maqueta (29990 en formato de pesos
// chilenos). Precio de ejemplo en Bs: se reemplaza desde el panel.
const precioEjemplo = (anterior: number) => Math.round(anterior / 100)

const payload = await getPayload({ config })

// --- Imágenes ---------------------------------------------------------------
// Una misma foto se comparte entre prendas (p. ej. el look completo del Track):
// se sube una sola vez y se reutiliza.
const medios = new Map<string, number>()

async function subir(archivo: string, alt: string): Promise<number> {
  const enCache = medios.get(archivo)
  if (enCache) return enCache
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: archivo } },
    limit: 1,
  })
  const id =
    docs[0]?.id ??
    (await payload.create({ collection: 'media', data: { alt }, filePath: path.join(ASSETS, archivo) })).id
  console.log(`${docs[0] ? 'imagen ya estaba' : 'imagen subida  '}  ${archivo}`)
  medios.set(archivo, id)
  return id
}

// Texto alternativo a partir de la prenda. Las fotos del look completo del
// Track (look-track-<color>.jpg) muestran el conjunto, no una sola pieza.
function altDe(archivo: string, nombre: string, color: string, i: number) {
  const look = archivo.match(/^look-track-([a-z]+)\.jpg$/)
  if (look) return `Conjunto Track ${look[1][0].toUpperCase()}${look[1].slice(1)}, look completo`
  return i === 0 ? `${nombre}, color ${color}` : `${nombre}, color ${color}, foto ${i + 1}`
}

// --- Upsert genérico -----------------------------------------------------------
async function guardar<C extends 'colecciones' | 'productos'>(
  collection: C,
  campo: 'slug' | 'sku',
  valor: string,
  data: Record<string, unknown>,
): Promise<number> {
  const { docs } = await payload.find({ collection, where: { [campo]: { equals: valor } }, limit: 1, draft: true })
  if (docs[0]) {
    await payload.update({ collection, id: docs[0].id, data: data as never })
    return docs[0].id
  }
  return (await payload.create({ collection, data: data as never })).id
}

// --- Colecciones -------------------------------------------------------------
const colecciones = new Map<string, { id: number; slug: string }>()
for (const [i, [clave, nombre]] of Object.entries(COLECCIONES).entries()) {
  const slug = slugify(nombre)
  const id = await guardar('colecciones', 'slug', slug, { nombre, slug, orden: i })
  colecciones.set(clave, { id, slug })
  console.log(`colección        ${nombre} -> /coleccion/${slug}`)
}

// --- Tipos (deben existir: scripts/sembrar-tipos.ts) ---------------------------
const tipos = new Map<string, number>()
for (const t of (await payload.find({ collection: 'tipos', limit: 50 })).docs) tipos.set(t.nombre, t.id)

// --- Prendas -----------------------------------------------------------------
const redirecciones: Record<string, string> = {}

for (const [i, [id, p]] of Object.entries(CATALOG).entries()) {
  const tipo = tipos.get(tipoDe(p.name))
  if (!tipo) throw new Error(`Falta el tipo "${tipoDe(p.name)}": ejecuta antes scripts/sembrar-tipos.ts`)

  const archivos = galeriaDe(id)
  const galeria: number[] = []
  for (const [j, archivo] of archivos.entries()) galeria.push(await subir(archivo, altDe(archivo, p.name, p.color, j)))

  const slug = slugify(p.name)
  const sku = skuDe(id)
  await guardar('productos', 'sku', sku, {
    nombre: p.name,
    slug,
    sku,
    tipo,
    color: p.color,
    coleccion: colecciones.get(coleccionDe(id))?.id,
    precio: precioEjemplo(p.price),
    descripcion: p.desc,
    galeria,
    // El stock va en la colección Inventario: después correr scripts/crear-inventario.ts
    tallas: p.sizes.map((talla) => ({ talla: talla as Talla, sku: `${sku}-${talla}` })),
    orden: i,
    _status: 'published',
  })
  redirecciones[id] = slug
  console.log(`prenda           ${sku}  ${p.name} -> /producto/${slug}`)
}

// --- Portada -----------------------------------------------------------------
const hero = []
for (const [i, s] of HERO.entries()) {
  hero.push({
    imagen: await subir(s.imagen, `WHATICE, campaña ${i + 1}`),
    imagenMovil: await subir(s.movil, `WHATICE, campaña ${i + 1} (móvil)`),
    enlace: s.coleccion ? `/coleccion/${colecciones.get(s.coleccion)!.slug}` : '/#colecciones',
  })
}
await payload.updateGlobal({ slug: 'portada', data: { hero, manifiesto: MANIFIESTO } })
console.log(`portada          ${hero.length} slides y manifiesto`)

const ajustes = await payload.findGlobal({ slug: 'ajustes' })
if (!ajustes.descripcion) {
  await payload.updateGlobal({
    slug: 'ajustes',
    data: { descripcion: `Streetwear de Bolivia. ${TAGLINE} Poleras, manga larga y conjuntos Track.` },
  })
}

// --- Redirecciones 301 (las lee next.config.ts) --------------------------------
fs.writeFileSync(
  path.resolve(process.cwd(), 'redirecciones-sitio-anterior.json'),
  JSON.stringify(redirecciones, null, 2) + '\n',
)
console.log(`redirecciones    ${Object.keys(redirecciones).length} -> redirecciones-sitio-anterior.json`)

process.exit(0)
