import { randomBytes } from 'crypto'
import type { Payload } from 'payload'

import type { Ajustes, Pedido } from '@/payload-types'

import { CIUDADES, HORAS_RESERVA, type MetodoEntrega } from './estados'
import { reservar, liberar, type Linea } from './stock'

export type EntradaPedido = {
  items: { slug: string; talla: string; cantidad: number }[]
  nombre: string
  telefono: string
  email?: string
  documento?: string
  razonSocial?: string
  metodo: MetodoEntrega
  ciudad?: string
  // A domicilio
  direccion?: string
  referencia?: string
  // Por encomienda
  empresa?: string
  recibeNombre?: string
  recibeDocumento?: string
  notas?: string
}

export type ResultadoPedido =
  | { ok: true; pedido: Pedido }
  | { ok: false; error: string; agotados?: { nombre: string; talla: string }[] }

const MAX_LINEAS = 20
const MAX_POR_LINEA = 10

export const ciudadesDomicilio = (ajustes: Ajustes): string[] => ajustes.envios?.ciudadesLocales ?? ['La Paz', 'El Alto']

// A domicilio: costo local. Por encomienda: costo nacional. Gratis desde un monto.
export function costoEnvio(ajustes: Ajustes, metodo: string, subtotal: number) {
  const e = ajustes.envios
  if (e?.gratisDesde && subtotal >= e.gratisDesde) return 0
  return metodo === 'domicilio' ? (e?.costoLocal ?? 15) : (e?.costoNacional ?? 35)
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
  const metodo: MetodoEntrega = entrada.metodo === 'encomienda' ? 'encomienda' : 'domicilio'
  const ciudad = limpiar(entrada.ciudad, 30)
  const direccion = limpiar(entrada.direccion, 300)
  const referencia = limpiar(entrada.referencia, 200)
  const empresa = limpiar(entrada.empresa, 80)
  const recibeNombre = limpiar(entrada.recibeNombre, 80) || nombre
  const recibeDocumento = limpiar(entrada.recibeDocumento, 20)
  const ajustes = await payload.findGlobal({ slug: 'ajustes' })
  const locales = ciudadesDomicilio(ajustes)
  if (nombre.length < 2) return { ok: false, error: 'Escribe tu nombre.' }
  if (telefono.replace(/\D/g, '').length < 7) return { ok: false, error: 'Escribe un número de WhatsApp válido.' }
  if (!CIUDADES.includes(ciudad as (typeof CIUDADES)[number])) return { ok: false, error: 'Elige tu ciudad.' }
  if (metodo === 'domicilio') {
    if (!locales.includes(ciudad))
      return { ok: false, error: `El envío a domicilio es solo en ${locales.join(' y ')}. Para ${ciudad} elige encomienda.` }
    if (direccion.length < 5) return { ok: false, error: 'Escribe la dirección de entrega.' }
  } else if (recibeDocumento.replace(/\D/g, '').length < 5) {
    return { ok: false, error: 'Escribe el CI de quien recogerá la encomienda (lo piden en la terminal).' }
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
    const subtotal = items.reduce((n, i) => n + i.precio * i.cantidad, 0)
    const envio = costoEnvio(ajustes, metodo, subtotal)
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
        ciudad: ciudad as Pedido['ciudad'],
        ...(metodo === 'domicilio'
          ? { direccion, referencia: referencia || undefined }
          : { empresa: empresa || undefined, recibeNombre, recibeDocumento }),
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
