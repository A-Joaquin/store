// Sube a R2 las fotos guardadas en ./media (originales y versiones WebP) con el
// mismo nombre, que es el que ya tiene la base. Salta las que ya están en el
// bucket, así que se puede volver a correr sin duplicar nada.
//   node --env-file=.env scripts/subir-media-a-r2.mjs
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import fs from 'fs/promises'
import path from 'path'

const { R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
if (!R2_BUCKET || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Faltan variables R2_* en .env')
  process.exit(1)
}

const cliente = new S3Client({
  endpoint: R2_ENDPOINT,
  region: 'auto',
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const TIPOS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

const carpeta = path.resolve('media')
const archivos = (await fs.readdir(carpeta)).filter((f) => TIPOS[path.extname(f).toLowerCase()])

let subidas = 0
let saltadas = 0
for (const nombre of archivos) {
  try {
    await cliente.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: nombre }))
    saltadas++
    continue
  } catch (e) {
    if (e?.$metadata?.httpStatusCode !== 404) throw e
  }
  await cliente.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: nombre,
      Body: await fs.readFile(path.join(carpeta, nombre)),
      ContentType: TIPOS[path.extname(nombre).toLowerCase()],
    }),
  )
  subidas++
  console.log(`↑ ${nombre}`)
}

console.log(`Listo: ${subidas} subidas, ${saltadas} ya estaban en R2.`)
