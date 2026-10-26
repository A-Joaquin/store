import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

// overrideAccess: false aplica las reglas de acceso de un visitante: solo
// productos publicados, nunca borradores.
const publico = { overrideAccess: false } as const

export const cliente = () => getPayload({ config })

// cache() evita repetir la consulta entre generateMetadata y la página.
export const getAjustes = cache(async () => (await cliente()).findGlobal({ slug: 'ajustes' }))

export const getPortada = cache(async () =>
  (await cliente()).findGlobal({ slug: 'portada', depth: 2 }),
)

export const getProducto = cache(async (slug: string) => {
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    ...publico,
  })
  return docs[0] ?? null
})

export const getColeccion = cache(async (slug: string) => {
  const { docs } = await (await cliente()).find({
    collection: 'colecciones',
    where: { slug: { equals: slug } },
    limit: 1,
    ...publico,
  })
  return docs[0] ?? null
})

export const getColecciones = cache(async () => {
  const { docs } = await (await cliente()).find({
    collection: 'colecciones',
    limit: 100,
    pagination: false,
    ...publico,
  })
  return docs
})

export async function getProductos(opciones: { coleccion?: number; excluir?: number; limit?: number } = {}) {
  const and = []
  if (opciones.coleccion) and.push({ coleccion: { equals: opciones.coleccion } })
  if (opciones.excluir) and.push({ id: { not_equals: opciones.excluir } })
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: and.length ? { and } : undefined,
    depth: 1,
    limit: opciones.limit ?? 100,
    ...publico,
  })
  return docs
}
