import { randomBytes } from 'crypto'
import type { Payload } from 'payload'

import type { Ajustes, Pedido } from '@/payload-types'

import { CIUDADES, HORAS_RESERVA } from './estados'
import { reservar, liberar, type Linea } from './stock'

export type EntradaPedido = {
  items: { slug: string; talla: string; cantidad: number }[]
  nombre: string
  telefono: string
  email?: string
  documento?: string
  razonSocial?: string
  metodo: 'envio' | 'recojo'
  ciudad?: string
  direccion?: string
  notas?: string
}

export type ResultadoPedido =
  | { ok: true; pedido: Pedido }
  | { ok: false; error: string; agotados?: { nombre: string; talla: string }[] }

const MAX_LINEAS = 20
const MAX_POR_LINEA = 10

export function costoEnvio(ajustes: Ajustes, metodo: string, ciudad: string | undefined, subtotal: number) {
  if (metodo !== 'envio') return 0
  const e = ajustes.envios
  if (e?.gratisDesde && subtotal >= e.gratisDesde) return 0
  const locales = e?.ciudadesLocales ?? ['La Paz', 'El Alto']
  return ciudad && locales.includes(ciudad as (typeof locales)[number]) ? (e?.costoLocal ?? 15) : (e?.costoNacional ?? 35)
}

const limpiar = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().slice(0, max) : '')

// Cancela los pedidos pendientes cuya reserva venció y devuelve su stock.
export async function expirarReservas(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'pedidos',
    where: { and: [{ estado: { equals: 'pendiente' } }, { reservaHasta: { less_than: new Date().toISOString() } }] },
    pagination: false,
    depth: 0,
    select: { estado: true },
  })
  for (const d of docs) {
    await payload.update({
      collection: 'pedidos',
      id: d.id,
      data: { estado: 'cancelado' },
      context: { nota: `Reserva vencida (${HORAS_RESERVA} h sin confirmar)` },
    })
  }
  return docs.length
}

// Crea un pedido desde la web: valida, toma precios de la base (nunca del
// navegador), reserva el stock y guarda el pedido como pendiente.
export async function crearPedido(
  payload: Payload,
  entrada: EntradaPedido,
  opciones: { simulado?: boolean } = {},
): Promise<ResultadoPedido> {
  await expirarReservas(payload)

  // --- Validación -----------------------------------------------------------
  const nombre = limpiar(entrada.nombre, 80)
  const telefono = limpiar(entrada.telefono, 20).replace(/[^\d+]/g, '')
  const metodo = entrada.metodo === 'recojo' ? 'recojo' : 'envio'
  const ciudad = limpiar(entrada.ciudad, 30)
  const direccion = limpiar(entrada.direccion, 300)
  if (nombre.length < 2) return { ok: false, error: 'Escribe tu nombre.' }
  if (telefono.replace(/\D/g, '').length < 7) return { ok: false, error: 'Escribe un número de WhatsApp válido.' }
  if (metodo === 'envio') {
    if (!CIUDADES.includes(ciudad as (typeof CIUDADES)[number])) return { ok: false, error: 'Elige la ciudad de envío.' }
    if (direccion.length < 5) return { ok: false, error: 'Escribe la dirección de envío.' }
  }
  const pedidas = (entrada.items ?? []).filter((i) => Number.isInteger(i.cantidad) && i.cantidad > 0)
  if (pedidas.length === 0) return { ok: false, error: 'Tu bolsa está vacía.' }
  if (pedidas.length > MAX_LINEAS || pedidas.some((i) => i.cantidad > MAX_POR_LINEA))
    return { ok: false, error: `Máximo ${MAX_POR_LINEA} unidades por prenda y talla.` }

  // --- Precios y tallas desde la base ---------------------------------------
  const { docs: productos } = await payload.find({
    collection: 'productos',
    where: { slug: { in: pedidas.map((i) => i.slug) } },
    overrideAccess: false,
    pagination: false,
    depth: 0,
    select: { slug: true, nombre: true, precio: true, tallas: true },
  })
  const porSlug = new Map(productos.map((p) => [p.slug, p]))
  const items: { producto: number; nombre: string; talla: string; cantidad: number; precio: number }[] = []
  for (const i of pedidas) {
    const p = porSlug.get(i.slug)
    if (!p) return { ok: false, error: 'Una de las prendas de tu bolsa ya no está disponible. Quítala y vuelve a intentar.' }
    const tallas = (p.tallas ?? []).map((t) => t.talla)
    const talla = tallas.length > 0 ? i.talla : 'Única'
    if (tallas.length > 0 && !tallas.includes(i.talla as (typeof tallas)[number]))
      return { ok: false, error: `La talla ${i.talla} de ${p.nombre} no existe.` }
    items.push({ producto: p.id, nombre: p.nombre, talla, cantidad: i.cantidad, precio: p.precio })
  }

  // --- Reserva de stock (todo o nada) --------------------------------------
  const lineas: Linea[] = items.map((i) => ({ productoId: i.producto, talla: i.talla, cantidad: i.cantidad }))
  const reserva = await reservar(payload, lineas)
  if (!reserva.ok) {
    const agotados = reserva.faltan.map((f) => ({
      nombre: items.find((i) => i.producto === f.productoId)?.nombre ?? '',
      talla: f.talla,
    }))
    return {
      ok: false,
      error: 'No alcanza el stock de: ' + agotados.map((a) => `${a.nombre} (${a.talla})`).join(', ') + '.',
      agotados,
    }
  }

  // --- Pedido -------------------------------------------------------------
  try {
    const ajustes = await payload.findGlobal({ slug: 'ajustes' })
    const subtotal = items.reduce((n, i) => n + i.precio * i.cantidad, 0)
    const envio = costoEnvio(ajustes, metodo, ciudad, subtotal)
    const ahora = new Date()
    const pedido = await payload.create({
      collection: 'pedidos',
      data: {
        estado: 'pendiente',
        nombre,
        telefono,
        email: limpiar(entrada.email, 120) || undefined,
        documento: limpiar(entrada.documento, 30) || undefined,
        razonSocial: limpiar(entrada.razonSocial, 120) || undefined,
        metodo,
        ciudad: metodo === 'envio' ? (ciudad as Pedido['ciudad']) : undefined,
        direccion: metodo === 'envio' ? direccion : undefined,
        notas: limpiar(entrada.notas, 500) || undefined,
        items,
        subtotal,
        envio,
        total: subtotal + envio,
        reservaHasta: new Date(ahora.getTime() + HORAS_RESERVA * 3600_000).toISOString(),
        stockReservado: true,
        seguimiento: randomBytes(12).toString('base64url'),
        simulado: Boolean(opciones.simulado),
        historial: [{ estado: 'pendiente', fecha: ahora.toISOString(), nota: 'Pedido desde la web' }],
      },
    })
    return { ok: true, pedido }
  } catch (e) {
    // Si no se pudo guardar, el stock vuelve.
    await liberar(payload, lineas)
    throw e
  }
}
