// Carga los tipos de prenda con el material y las medidas del sitio estático
// (assets/whatice/whatice-shop.js, TIPOS). Si el tipo ya existe lo actualiza,
// así que se puede volver a ejecutar sin duplicar.
//   npx payload run scripts/sembrar-tipos.ts
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Tipo } from '@/payload-types'

type Talla = NonNullable<Tipo['medidas']>[number]['talla']

const TIPOS: {
  nombre: string
  categoria: string
  material: string
  columnas: string[]
  medidas: Partial<Record<Talla, number[]>>
}[] = [
  {
    nombre: 'Manga Larga',
    categoria: 'MANGA LARGA',
    material: '100% algodón, jersey 220 g/m². Estampado serigráfico en pecho y mangas.',
    columnas: ['Largo', 'Ancho pecho', 'Manga'],
    medidas: { XS: [68, 52, 60], S: [70, 54, 62], M: [72, 56, 63], L: [74, 58, 64], XL: [76, 60, 65] },
  },
  {
    nombre: 'Polera',
    categoria: 'POLERAS',
    material: '100% algodón peinado, jersey 240 g/m². Estampado serigráfico.',
    columnas: ['Largo', 'Ancho pecho', 'Manga'],
    medidas: { XS: [68, 52, 20], S: [70, 54, 21], M: [72, 56, 22], L: [74, 58, 23], XL: [76, 60, 24] },
  },
  {
    nombre: 'Chaqueta',
    categoria: 'CHAQUETAS',
    material: '100% poliéster tricot. Forro de malla y cierre metálico frontal.',
    columnas: ['Largo', 'Ancho pecho', 'Manga'],
    medidas: { S: [66, 58, 62], M: [68, 60, 63], L: [70, 62, 64], XL: [72, 64, 65] },
  },
  {
    nombre: 'Pantalón',
    categoria: 'PANTALONES',
    material: '100% poliéster tricot. Pretina elasticada con cordón ajustable.',
    columnas: ['Cintura', 'Largo', 'Tiro'],
    medidas: { S: [72, 100, 30], M: [76, 102, 31], L: [80, 104, 32], XL: [84, 106, 33] },
  },
  {
    nombre: 'Conjunto',
    categoria: 'CONJUNTOS',
    material: 'Chaqueta y pantalón. 100% poliéster tricot con forro de malla.',
    columnas: ['Largo chaqueta', 'Ancho pecho', 'Largo pantalón'],
    medidas: { S: [66, 58, 100], M: [68, 60, 102], L: [70, 62, 104], XL: [72, 64, 106] },
  },
]

const payload = await getPayload({ config })

for (const t of TIPOS) {
  const data = {
    nombre: t.nombre,
    categoria: t.categoria,
    material: t.material,
    columnas: t.columnas.map((nombre) => ({ nombre })),
    medidas: Object.entries(t.medidas).map(([talla, [c1, c2, c3]]) => ({ talla: talla as Talla, c1, c2, c3 })),
  }
  const { docs } = await payload.find({ collection: 'tipos', where: { nombre: { equals: t.nombre } }, limit: 1 })
  if (docs[0]) {
    await payload.update({ collection: 'tipos', id: docs[0].id, data })
    console.log(`actualizado  ${t.nombre}`)
  } else {
    await payload.create({ collection: 'tipos', data })
    console.log(`creado       ${t.nombre}`)
  }
}

process.exit(0)
