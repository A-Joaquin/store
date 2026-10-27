'use client'

import { useEffect } from 'react'

import { urlCors } from '@/lib/imagen'

// Header y barra lateral legibles sobre cualquier fondo: cada elemento con
// [data-contraste] mide el brillo real de lo que tiene debajo y, si es
// oscuro, recibe [data-oscuro] (el CSS lo pasa a blanco).
//
// Qué se mira debajo de cada elemento (de arriba hacia abajo, saltando la
// propia interfaz fija marcada con [data-contraste-ignorar]):
//   - una foto (<img>): los píxeles de esa zona de la imagen;
//   - un elemento con [data-fuente] (el hero): la foto del slide actual;
//   - un fondo de color opaco: ese color.
// Sin nada de eso, se asume fondo blanco.

const OSCURO = 0.42 // por debajo, texto blanco
const CLARO = 0.5 // por encima, texto negro (entre ambos se mantiene: sin parpadeo)
const LADO = 48 // resolución de la grilla de brillo por imagen

type Grilla = { lum: Float32Array; alfa: Float32Array; ancho: number; alto: number }
const grillas = new Map<string, Grilla | 'cargando' | 'error'>()
// Alguna foto de la última medición todavía se estaba analizando.
let faltanFotos = false

// Brillo de una imagen en una grilla de 48×48 (se calcula una vez por imagen).
function grillaDe(src: string): Grilla | null {
  const g = grillas.get(src)
  if (g && g !== 'cargando' && g !== 'error') return g
  if (g) return null
  grillas.set(src, 'cargando')
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    try {
      const c = document.createElement('canvas')
      c.width = LADO
      c.height = LADO
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0, LADO, LADO)
      const d = ctx.getImageData(0, 0, LADO, LADO).data
      const lum = new Float32Array(LADO * LADO)
      const alfa = new Float32Array(LADO * LADO)
      for (let i = 0; i < LADO * LADO; i++) {
        // Luminancia relativa aproximada (sRGB).
        lum[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255
        alfa[i] = d[i * 4 + 3] / 255
      }
      grillas.set(src, { lum, alfa, ancho: img.naturalWidth, alto: img.naturalHeight })
    } catch {
      // Imagen de otro dominio sin CORS: no se puede leer, se ignora.
      grillas.set(src, 'error')
    }
  }
  img.onerror = () => grillas.set(src, 'error')
  img.src = urlCors(src)
  return null
}

// Punto (u, v) de la imagen (0–1) que se ve en (x, y) según object-fit.
function aImagen(rect: DOMRect, ancho: number, alto: number, ajuste: string, posicion: string, x: number, y: number) {
  const [px, py] = posicion.split(' ').map((p) => (p.endsWith('%') ? parseFloat(p) / 100 : 0.5))
  if (ajuste === 'fill' || !ancho || !alto) return { u: (x - rect.left) / rect.width, v: (y - rect.top) / rect.height }
  const escala = ajuste === 'contain' ? Math.min(rect.width / ancho, rect.height / alto) : Math.max(rect.width / ancho, rect.height / alto)
  const w = ancho * escala
  const h = alto * escala
  const ox = rect.left + (rect.width - w) * (px ?? 0.5)
  const oy = rect.top + (rect.height - h) * (py ?? 0.5)
  return { u: (x - ox) / w, v: (y - oy) / h }
}

function muestra(g: Grilla, u: number, v: number) {
  if (u < 0 || u > 1 || v < 0 || v > 1) return null
  const i = Math.min(LADO - 1, Math.floor(v * LADO)) * LADO + Math.min(LADO - 1, Math.floor(u * LADO))
  return { lum: g.lum[i], alfa: g.alfa[i] }
}

const colorRgba = (c: string) => {
  const m = c.match(/[\d.]+/g)
  if (!m || m.length < 3) return null
  const [r, gr, b, a = '1'] = m.map(Number) as unknown as [number, number, number, number?]
  return { lum: (0.2126 * r + 0.7152 * gr + 0.0722 * b) / 255, alfa: Number(a) }
}

// Brillo de lo que hay en (x, y), sin contar la interfaz fija.
function brilloEn(x: number, y: number): number {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest('[data-contraste-ignorar]')) continue
    const cs = getComputedStyle(el)
    if (Number(cs.opacity) < 0.3 || cs.visibility === 'hidden') continue

    const fuente = el instanceof HTMLElement ? (window.innerWidth <= 812 && el.dataset.fuenteMovil) || el.dataset.fuente : undefined
    const src = fuente || (el instanceof HTMLImageElement && el.complete ? el.currentSrc || el.src : null)
    if (src) {
      const g = grillaDe(src)
      if (!g && grillas.get(src) === 'cargando') faltanFotos = true
      if (g) {
        const ajuste = fuente ? 'cover' : cs.objectFit
        const pos = fuente ? '50% 50%' : cs.objectPosition
        const { u, v } = aImagen(el.getBoundingClientRect(), g.ancho, g.alto, ajuste, pos, x, y)
        const p = muestra(g, u, v)
        // Zonas transparentes (logos SVG): se mira lo que hay detrás.
        if (p && p.alfa > 0.5) return p.lum
      }
      if (fuente) return 0.5 // foto del hero aún sin analizar: neutro
    }

    const fondo = colorRgba(cs.backgroundColor)
    if (fondo && fondo.alfa > 0.5) return fondo.lum
  }
  return 1
}

// Promedio de 4 puntos del elemento (no solo el centro).
function brilloDe(el: Element) {
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return null
  let suma = 0
  for (const fx of [0.25, 0.75]) for (const fy of [0.3, 0.7]) suma += brilloEn(r.left + r.width * fx, r.top + r.height * fy)
  return suma / 4
}

export function ContrasteAuto() {
  useEffect(() => {
    const raiz = document.documentElement
    // El primer color se pone sin transición; las transiciones se activan un
    // cuadro después (si fuera en el mismo, el cambio inicial también se animaría).
    let animando = 0
    const activarTransiciones = () => {
      if (animando) return
      animando = window.setTimeout(() => (raiz.dataset.contrasteAnimado = ''), 50)
    }
    // Respaldo por si una foto tarda mucho o nunca llega a analizarse.
    const respaldo = window.setTimeout(activarTransiciones, 3000)

    let cuadro = 0
    const revisar = () => {
      cuadro = 0
      faltanFotos = false
      // Con el mega menú abierto el header queda sobre blanco.
      const megaAbierto = document.querySelector('[data-mega-abierto]')
      document.querySelectorAll<HTMLElement>('[data-contraste]').forEach((el) => {
        if (megaAbierto && el.closest('header')) {
          delete el.dataset.oscuro
          return
        }
        const b = brilloDe(el)
        if (b === null) return
        if (b < OSCURO) el.dataset.oscuro = ''
        else if (b > CLARO) delete el.dataset.oscuro
      })
      if (!faltanFotos) activarTransiciones()
    }
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(revisar)
    }

    // Cursor: el mismo detector mide bajo el mouse y marca html[data-cursor-oscuro]
    // (el CSS cambia el cursor a su versión blanca). Una medición por cuadro.
    let mouse: { x: number; y: number } | null = null
    let cuadroCursor = 0
    const revisarCursor = () => {
      cuadroCursor = 0
      if (!mouse) return
      const b = brilloEn(mouse.x, mouse.y)
      if (b < OSCURO) raiz.dataset.cursorOscuro = ''
      else if (b > CLARO) delete raiz.dataset.cursorOscuro
    }
    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouse = { x: e.clientX, y: e.clientY }
      if (!cuadroCursor) cuadroCursor = requestAnimationFrame(revisarCursor)
    }
    const pedirCursor = () => {
      if (mouse && !cuadroCursor) cuadroCursor = requestAnimationFrame(revisarCursor)
    }
    window.addEventListener('pointermove', alMover, { passive: true })
    window.addEventListener('scroll', pedirCursor, { passive: true })

    pedir()
    window.addEventListener('scroll', pedir, { passive: true })
    window.addEventListener('resize', pedir)
    document.addEventListener('load', pedir, true) // cada imagen que termina de cargar
    // Cambios de slide en el hero y aperturas del mega menú.
    const obs = new MutationObserver(pedir)
    obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-fuente', 'data-mega-abierto'] })
    // Respaldo: fotos que se analizan en segundo plano, animaciones, etc.
    const intervalo = window.setInterval(() => document.visibilityState === 'visible' && pedir(), 700)

    return () => {
      cancelAnimationFrame(cuadro)
      cancelAnimationFrame(cuadroCursor)
      window.removeEventListener('pointermove', alMover)
      window.removeEventListener('scroll', pedirCursor)
      delete raiz.dataset.cursorOscuro
      window.clearTimeout(animando)
      window.clearTimeout(respaldo)
      delete raiz.dataset.contrasteAnimado
      window.removeEventListener('scroll', pedir)
      window.removeEventListener('resize', pedir)
      document.removeEventListener('load', pedir, true)
      obs.disconnect()
      window.clearInterval(intervalo)
    }
  }, [])
  return null
}
