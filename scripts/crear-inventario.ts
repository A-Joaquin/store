// Crea una fila de inventario por prenda y talla. Si la prenda todavía tiene
// el stock dentro de sus tallas (versión anterior del modelo), lo copia; si
// no, usa el stock indicado. No toca filas que ya existen.
//   npx payload run scripts/crear-inventario.ts [stock-por-defecto]
import config from '@payload-config'
import { getPayload } from 'payload'

import type { ItemInventario } from '@/payload-types'

const porDefecto = Number(process.argv[2] ?? 10)
const payload = await getPayload({ config })

const { docs: productos } = await payload.find({ collection: 'productos', pagination: false, depth: 0, draft: true })
const { docs: existentes } = await payload.find({ collection: 'inventario', pagination: false, depth: 0 })
const ya = new Set(existentes.map((e) => `${e.producto}:${e.talla}`))

let creadas = 0
for (const p of productos) {
  for (const t of p.tallas ?? []) {
    if (ya.has(`${p.id}:${t.talla}`)) continue
    const anterior = (t as { stock?: number }).stock
    await payload.create({
      collection: 'inventario',
      data: { producto: p.id, talla: t.talla as ItemInventario['talla'], stock: anterior ?? porDefecto },
    })
    creadas++
  }
}
console.log(`inventario: ${creadas} filas creadas, ${ya.size} ya existían`)
process.exit(0)
