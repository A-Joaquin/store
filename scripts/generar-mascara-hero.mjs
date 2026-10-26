// Genera public/mascara-hero.png: mapa de desplazamiento propio para la
// transición del hero (pinceladas diagonales en grises, 512×410).
// Determinista: la misma semilla produce siempre la misma imagen.
//   node scripts/generar-mascara-hero.mjs
import path from 'path'
import sharp from 'sharp'

const ANCHO = 512
const ALTO = 410
let semilla = 20261026
const azar = () => ((semilla = (semilla * 1664525 + 1013904223) >>> 0) / 2 ** 32)
const gris = (v) => {
  const n = Math.round(Math.max(0, Math.min(255, v)))
  return `rgb(${n},${n},${n})`
}

const trazos = []
// Manchas grandes y suaves de fondo (zonas claras y oscuras)
for (let i = 0; i < 14; i++) {
  const x = azar() * ANCHO
  const y = azar() * ALTO
  trazos.push(`<ellipse cx="${x}" cy="${y}" rx="${80 + azar() * 140}" ry="${50 + azar() * 90}" fill="${gris(40 + azar() * 180)}" opacity="0.55"/>`)
}
// Pinceladas largas inclinadas ~35° (como trazos de espátula)
for (let i = 0; i < 140; i++) {
  const x = azar() * ANCHO * 1.2 - ANCHO * 0.1
  const y = azar() * ALTO * 1.2 - ALTO * 0.1
  const largo = 60 + azar() * 220
  const grosor = 4 + azar() * 22
  const angulo = -35 + (azar() - 0.5) * 30
  trazos.push(
    `<ellipse cx="${x}" cy="${y}" rx="${largo / 2}" ry="${grosor / 2}" transform="rotate(${angulo} ${x} ${y})" fill="${gris(30 + azar() * 200)}" opacity="${0.45 + azar() * 0.5}"/>`,
  )
}
// Grano fino en algunas zonas
for (let i = 0; i < 900; i++) {
  const x = azar() * ANCHO
  const y = azar() * ALTO
  if (Math.sin(x / 70) + Math.cos(y / 55) < 0.6) continue
  trazos.push(`<circle cx="${x}" cy="${y}" r="${0.6 + azar() * 1.4}" fill="${gris(azar() * 255)}"/>`)
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
  <rect width="100%" height="100%" fill="${gris(128)}"/>
  <g filter="url(#b)">${trazos.join('')}</g>
  <defs><filter id="b"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
</svg>`

const salida = path.resolve(process.cwd(), 'public/mascara-hero.png')
// -24: el gris medio queda en ~119, como el mapa de referencia, para que la
// deformación no empuje toda la foto hacia un lado.
await sharp(Buffer.from(svg)).grayscale().linear(1, -24).png({ compressionLevel: 9 }).toFile(salida)
console.log('creado', salida)
