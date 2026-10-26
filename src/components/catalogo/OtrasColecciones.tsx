import { cliente, getColecciones } from '@/lib/datos'
import { comoMedia } from '@/lib/imagen'
import { rutaColeccion } from '@/lib/sitio'
import { aFoto } from '@/lib/tarjeta'

import { OtrasColeccionesLista, type ColeccionConFotos } from './OtrasColeccionesLista'

// Hasta cuántas fotos candidatas por colección (de entre ellas se elige una al azar).
const CANDIDATAS = 12

// Al final de una colección: las demás colecciones, cada una con una prenda
// suya al azar.
export async function OtrasColecciones({ actual }: { actual: string }) {
  const otras = (await getColecciones()).filter((c) => c.slug !== actual)
  if (otras.length === 0) return null

  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: { coleccion: { in: otras.map((c) => c.id) } },
    depth: 1,
    pagination: false,
    overrideAccess: false,
    select: { coleccion: true, galeria: true },
  })

  const lista: ColeccionConFotos[] = otras.map((c) => {
    const deEsta = docs.filter((p) => (typeof p.coleccion === 'object' ? p.coleccion?.id : p.coleccion) === c.id)
    return {
      nombre: c.nombre,
      href: rutaColeccion(c.slug),
      total: deEsta.length,
      fotos: deEsta
        .slice(0, CANDIDATAS)
        .flatMap((p) => {
          const m = comoMedia(p.galeria?.[0])
          return m ? [aFoto(m)] : []
        }),
    }
  })

  return <OtrasColeccionesLista colecciones={lista} />
}
