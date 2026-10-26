// Genera el cursor del sitio a partir del logo del ojo (public/logo-ojo-negro.svg):
// la espada apunta como un cursor normal (arriba a la izquierda), con un
// contorno blanco fino para verse sobre fotos oscuras.
//   public/cursor-ojo.png / @2x        cursor general (negro)
//   public/cursor-ojo-enlace.png / @2x sobre enlaces y botones (azul hielo)
// Imprime el punto activo (la punta de la espada) para el CSS.
//   node scripts/generar-cursor.mjs
import path from 'path'
import sharp from 'sharp'

const PUBLICO = path.resolve(process.cwd(), 'public')
// En el logo la punta de la espada mira hacia abajo; girando 150° (horario)
// mira arriba a la izquierda, como la flecha del cursor.
const GIRO = 150
const BASE = 32 // tamaño del cursor (el máximo que aceptan todos los navegadores sin recortes)
const COLORES = { '': [0, 0, 0], '-enlace': [93, 135, 173] } // tinta y azul hielo (--ice-dark)

// Logo girado y recortado a su contenido, en alta resolución.
const girado = await sharp(path.join(PUBLICO, 'logo-ojo-negro.svg'), { density: 72 })
  .resize({ height: 1024 })
  .rotate(GIRO, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .trim({ threshold: 1 })
  .png()
  .toBuffer()

async function generar(escala, sufijo) {
  const lado = BASE * escala
  const borde = 2 * escala // contorno blanco
  const util = lado - 2 * borde
  const forma = await sharp(girado).resize(util, util, { fit: 'contain', position: 'northwest', background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = forma.info

  // Silueta en el color pedido (se conserva la transparencia del logo).
  const [r, g, b] = COLORES[sufijo]
  const relleno = Buffer.from(forma.data)
  for (let i = 0; i < w * h; i++) {
    relleno[i * 4] = r
    relleno[i * 4 + 1] = g
    relleno[i * 4 + 2] = b
  }

  // Contorno: la misma silueta engrosada (desenfoque + umbral) en blanco.
  const alfa = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) alfa[i] = forma.data[i * 4 + 3]
  const engrosada = await sharp(alfa, { raw: { width: w, height: h, channels: 1 } })
    .extend({ top: borde, left: borde, bottom: borde, right: borde, background: '#000000' })
    .blur(Math.max(0.6, borde * 0.55))
    .threshold(8)
    .extractChannel(0) // threshold devuelve 3 canales: se queda uno
    .raw()
    .toBuffer()
  const contorno = Buffer.alloc(lado * lado * 4)
  for (let i = 0; i < lado * lado; i++) {
    contorno[i * 4] = contorno[i * 4 + 1] = contorno[i * 4 + 2] = 255
    contorno[i * 4 + 3] = engrosada[i] ?? 0
  }

  const final = await sharp(contorno, { raw: { width: lado, height: lado, channels: 4 } })
    .composite([{ input: relleno, raw: { width: w, height: h, channels: 4 }, left: borde, top: borde }])
    .png()
    .toBuffer()
  await sharp(final).toFile(path.join(PUBLICO, `cursor-ojo${sufijo}${escala === 2 ? '@2x' : ''}.png`))

  // Punto activo: el píxel opaco más lejano en la dirección de la punta.
  if (escala !== 1) return null
  const { data } = await sharp(final).raw().toBuffer({ resolveWithObject: true })
  const rad = (GIRO * Math.PI) / 180
  const dir = [-Math.sin(rad), Math.cos(rad)] // "abajo" (0,1) girado GIRO grados
  let mejor = null
  for (let y = 0; y < lado; y++)
    for (let x = 0; x < lado; x++) {
      if (data[(y * lado + x) * 4 + 3] < 128) continue
      const p = x * dir[0] + y * dir[1]
      if (!mejor || p > mejor.p) mejor = { x, y, p }
    }
  return mejor
}

for (const sufijo of Object.keys(COLORES)) {
  const punta = await generar(1, sufijo)
  await generar(2, sufijo)
  console.log(`cursor-ojo${sufijo}.png  punto activo: ${punta.x} ${punta.y}`)
}
