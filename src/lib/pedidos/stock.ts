import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { revalidarTodo } from '@/lib/revalidar'

export type Linea = { productoId: number; talla: string; cantidad: number }

type Db = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: Record<string, unknown>[] }> }
const db = (payload: Payload) => (payload.db as unknown as { drizzle: Db }).drizzle

// Descuenta una línea solo si alcanza el stock, en una sola sentencia: dos
// pedidos simultáneos por la última unidad nunca pueden pasar los dos.
async function descontar(payload: Payload, l: Linea): Promise<boolean> {
  const r = await db(payload).execute(sql`
    UPDATE inventario
       SET stock = stock - ${l.cantidad}, updated_at = now()
     WHERE producto_id = ${l.productoId}
       AND talla::text = ${l.talla}
       AND stock >= ${l.cantidad}
    RETURNING id`)
  return r.rows.length > 0
}

async function devolver(payload: Payload, l: Linea) {
  await db(payload).execute(sql`
    UPDATE inventario
       SET stock = stock + ${l.cantidad}, updated_at = now()
     WHERE producto_id = ${l.productoId}
       AND talla::text = ${l.talla}`)
}

// Reserva todas las líneas o ninguna. Si alguna no alcanza, devuelve lo ya
// descontado y responde cuáles faltaron.
export async function reservar(payload: Payload, lineas: Linea[]): Promise<{ ok: true } | { ok: false; faltan: Linea[] }> {
  const hechas: Linea[] = []
  const faltan: Linea[] = []
  for (const l of lineas) {
    if (await descontar(payload, l)) hechas.push(l)
    else faltan.push(l)
  }
  if (faltan.length > 0) {
    for (const l of hechas) await devolver(payload, l)
    return { ok: false, faltan }
  }
  revalidarTodo()
  return { ok: true }
}

export async function liberar(payload: Payload, lineas: Linea[]) {
  for (const l of lineas) await devolver(payload, l)
  revalidarTodo()
}

// Stock disponible de varias prendas: clave "<productoId>:<talla>".
export async function stockDe(payload: Payload, productoIds: number[]): Promise<Map<string, number>> {
  const mapa = new Map<string, number>()
  if (productoIds.length === 0) return mapa
  const { docs } = await payload.find({
    collection: 'inventario',
    where: { producto: { in: productoIds } },
    pagination: false,
    depth: 0,
    select: { producto: true, talla: true, stock: true },
  })
  for (const d of docs) mapa.set(`${d.producto}:${d.talla}`, d.stock)
  return mapa
}
