// Genera los cursores del sitio a partir del logo del ojo
// (public/logo-ojo-negro.svg): la espada apunta como un cursor normal (arriba a
// la izquierda). El ojo y la espada se colorean por separado, así hay una
// versión por zona:
//   cursor-ojo.png               normal: todo negro, halo blanco
//   cursor-ojo-enlace.png        enlaces y botones: azul hielo
//   cursor-ojo-oscuro.png        sobre fondos oscuros: todo blanco, halo oscuro
//   cursor-ojo-prenda.png        sobre una prenda: ojo blanco con brillo, espada negra
//   cursor-ojo-prenda-oscuro.png prenda sobre fondo oscuro: ojo con brillo, espada blanca
// Cada uno con su @2x. Imprime el punto activo (la punta de la espada).
//   node scripts/generar-cursor.mjs
import path from 'path'
import sharp from 'sharp'

const PUBLICO = path.resolve(process.cwd(), 'public')
// En el logo la punta de la espada mira hacia abajo; girando 150° (horario)
// mira arriba a la izquierda, como la flecha del cursor.
const GIRO = 150
const BASE = 32 // tamaño del cursor (el máximo que aceptan todos los navegadores sin recortes)

const NEGRO = [10, 10, 11]
const BLANCO = [255, 255, 255]
const HIELO = [93, 135, 173]
const VARIANTES = {
  '': { ojo: NEGRO, espada: NEGRO, halo: [BLANCO, 1] },
  '-enlace': { ojo: HIELO, espada: HIELO, halo: [BLANCO, 1] },
  '-oscuro': { ojo: BLANCO, espada: BLANCO, halo: [NEGRO, 0.55] },
  // Ojo blanco con brillo: contorno oscuro fino para que se lea sobre fotos claras.
  '-prenda': { ojo: BLANCO, espada: NEGRO, halo: [NEGRO, 0.7], brillo: true },
  '-prenda-oscuro': { ojo: BLANCO, espada: BLANCO, halo: [NEGRO, 0.7], brillo: true },
}

// --- Separar ojo y espada --------------------------------------------------
// El logo es una sola figura. Las filas donde es más ancha (las alas) son el
// ojo; se amplía hasta donde el ancho cae por debajo del 12 %. Lo de arriba
// (empuñadura y guarda) y lo de abajo (hoja) es la espada.
const { data: px, info } = await sharp(path.join(PUBLICO, 'logo-ojo-negro.svg'), { density: 72 })
  .resize({ height: 1024 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const W = info.width
const H = info.height
const ancho = []
for (let y = 0; y < H; y++) {
  let n = 0
  for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 128) n++
  ancho.push(n / W)
}
let banda = [0, 0]
for (let y = 0, ini = -1; y <= H; y++) {
  const ancha = y < H && ancho[y] > 0.55
  if (ancha && ini < 0) ini = y
  if (!ancha && ini >= 0) {
    if (y - ini > banda[1] - banda[0]) banda = [ini, y]
    ini = -1
  }
}
while (banda[0] > 0 && ancho[banda[0] - 1] > 0.12) banda[0]--
while (banda[1] < H && ancho[banda[1]] > 0.12) banda[1]++

// Imagen de "capas": R = ojo, G = espada, A = figura completa. Se gira y
// recorta de una sola vez para que ojo y espada queden alineados.
const capas = Buffer.alloc(W * H * 4)
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4
    const a = px[i + 3]
    const esOjo = y >= banda[0] && y < banda[1]
    capas[i] = esOjo ? a : 0
    capas[i + 1] = esOjo ? 0 : a
    capas[i + 3] = a
  }
const girado = await sharp(capas, { raw: { width: W, height: H, channels: 4 } })
  .rotate(GIRO, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .trim({ threshold: 1 })
  .png()
  .toBuffer()

// Máscara (un canal) engrosada (desenfoque + umbral) o solo difuminada.
const ampliar = (alfa, w, h, extra) =>
  sharp(alfa, { raw: { width: w, height: h, channels: 1 } }).extend({
    top: extra,
    left: extra,
    bottom: extra,
    right: extra,
    background: '#000000',
  })
const engrosar = (alfa, w, h, extra, radio) =>
  ampliar(alfa, w, h, extra)
    .blur(Math.max(0.6, radio))
    .threshold(8)
    .extractChannel(0) // threshold devuelve 3 canales: se queda uno
    .raw()
    .toBuffer()
const difuminar = (alfa, w, h, extra, radio) => ampliar(alfa, w, h, extra).blur(radio).extractChannel(0).raw().toBuffer()

async function generar(escala, sufijo) {
  const v = VARIANTES[sufijo]
  const lado = BASE * escala
  const borde = 2 * escala
  const util = lado - 2 * borde
  const { data: c, info: ci } = await sharp(girado)
    .resize(util, util, { fit: 'contain', position: 'northwest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const w = ci.width
  const h = ci.height
  const total = Buffer.alloc(w * h)
  const ojo = Buffer.alloc(w * h)
  const espada = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) {
    total[i] = c[i * 4 + 3]
    // Reparte la transparencia de los bordes según la capa dominante.
    const suma = c[i * 4] + c[i * 4 + 1] || 1
    ojo[i] = Math.round((c[i * 4 + 3] * c[i * 4]) / suma)
    espada[i] = Math.round((c[i * 4 + 3] * c[i * 4 + 1]) / suma)
  }

  const halo = await engrosar(total, w, h, borde, borde * 0.55)
  const brillo = v.brillo ? await difuminar(ojo, w, h, borde, borde * 1.1) : null

  // Composición píxel a píxel (sobre transparente): brillo → halo → espada → ojo.
  const out = Buffer.alloc(lado * lado * 4)
  const pintar = (i, [r, g, b], a) => {
    if (a <= 0) return
    const ab = out[i * 4 + 3] / 255
    const ar = a + ab * (1 - a)
    out[i * 4] = Math.round((r * a + out[i * 4] * ab * (1 - a)) / ar)
    out[i * 4 + 1] = Math.round((g * a + out[i * 4 + 1] * ab * (1 - a)) / ar)
    out[i * 4 + 2] = Math.round((b * a + out[i * 4 + 2] * ab * (1 - a)) / ar)
    out[i * 4 + 3] = Math.round(ar * 255)
  }
  for (let y = 0; y < lado; y++)
    for (let x = 0; x < lado; x++) {
      const i = y * lado + x
      const dentro = x >= borde && y >= borde && x < borde + w && y < borde + h
      const j = (y - borde) * w + (x - borde)
      if (brillo) pintar(i, BLANCO, Math.min(1, (brillo[i] / 255) * 1.6) * 0.85)
      pintar(i, v.halo[0], (halo[i] / 255) * v.halo[1])
      if (dentro) {
        pintar(i, v.espada, espada[j] / 255)
        pintar(i, v.ojo, ojo[j] / 255)
      }
    }
  await sharp(out, { raw: { width: lado, height: lado, channels: 4 } })
    .png()
    .toFile(path.join(PUBLICO, `cursor-ojo${sufijo}${escala === 2 ? '@2x' : ''}.png`))

  // Punto activo: el píxel opaco de la figura más lejano en la dirección de la punta.
  if (escala !== 1) return null
  const rad = (GIRO * Math.PI) / 180
  const dir = [-Math.sin(rad), Math.cos(rad)] // "abajo" (0,1) girado GIRO grados
  let mejor = null
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (total[y * w + x] < 128) continue
      const p = x * dir[0] + y * dir[1]
      if (!mejor || p > mejor.p) mejor = { x: x + borde, y: y + borde, p }
    }
  return mejor
}

for (const sufijo of Object.keys(VARIANTES)) {
  const punta = await generar(1, sufijo)
  await generar(2, sufijo)
  console.log(`cursor-ojo${sufijo}.png  punto activo: ${punta.x} ${punta.y}`)
}
