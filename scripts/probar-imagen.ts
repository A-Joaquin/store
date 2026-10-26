// Prueba del pipeline: sube una foto, muestra los tamaños generados y la borra.
import config from '@payload-config'
import { getPayload } from 'payload'

const ruta = process.argv[2]
const payload = await getPayload({ config })
const doc = await payload.create({ collection: 'media', data: { alt: 'prueba' }, filePath: ruta })
const kb = (n?: number | null) => `${Math.round((n ?? 0) / 1024)} KB`
console.log(`original  ${doc.width}x${doc.height} ${doc.mimeType} ${kb(doc.filesize)}`)
for (const [nombre, s] of Object.entries(doc.sizes ?? {})) {
  console.log(`${nombre.padEnd(9)} ${s?.width}x${s?.height} ${s?.mimeType} ${kb(s?.filesize)}`)
}
console.log(`blur      ${doc.blurDataURL?.length ?? 0} caracteres`)
await payload.delete({ collection: 'media', id: doc.id })
process.exit(0)
