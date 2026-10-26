// Pedidos de prueba para ver el sistema funcionando: un caso por cada
// situación (en cola, por vencer, vencido, confirmado, preparando, enviado,
// entregado, cancelado, sin stock) y un historial de ventas de 45 días.
// Todos pasan por la misma lógica que un pedido real (validación, precios
// desde la base, reserva de stock) y quedan marcados como "de prueba".
//
//   npx payload run scripts/simular-pedidos.ts            crea la simulación
//   npx payload run scripts/simular-pedidos.ts --borrar   la borra y devuelve el stock
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'

import { crearPedido, expirarReservas, type EntradaPedido } from '@/lib/pedidos/crear'
import type { EstadoPedido } from '@/lib/pedidos/estados'
import type { Pedido } from '@/payload-types'

const payload = await getPayload({ config })
const db = (payload.db as unknown as { drizzle: { execute: (q: ReturnType<typeof sql>) => Promise<unknown> } }).drizzle

// --- Borrar ---------------------------------------------------------------
if (process.argv.includes('--borrar')) {
  const { docs } = await payload.find({ collection: 'pedidos', where: { simulado: { equals: true } }, pagination: false, depth: 0 })
  for (const d of docs) await payload.delete({ collection: 'pedidos', id: d.id }) // devuelve el stock que tenían
  console.log(`borrados ${docs.length} pedidos de prueba (stock devuelto)`)
  process.exit(0)
}

// --- Datos de prueba (deterministas) --------------------------------------
let semilla = 2026
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648)
const elegir = <T,>(xs: readonly T[]) => xs[Math.floor(azar() * xs.length)]
const NOMBRES = ['María Quispe', 'Juan Mamani', 'Lucía Fernández', 'Diego Choque', 'Valeria Rojas', 'Carlos Vargas', 'Andrea Flores', 'Rodrigo Gutiérrez', 'Camila Torrez', 'Luis Condori', 'Daniela Arce', 'Marco Limachi', 'Sofía Paredes', 'Bruno Ticona', 'Paola Salazar', 'Iván Villca']
const telefono = (i: number) => `+5917000${String(100 + i).padStart(4, '0')}` // números ficticios
const EMPRESAS = ['Trans Copacabana', 'Bolivar', 'El Dorado', '']

const { docs: productos } = await payload.find({ collection: 'productos', pagination: false, depth: 0, select: { slug: true, tallas: true } })
const conTallas = productos.filter((p) => (p.tallas ?? []).length > 0)
const linea = (cantidadMax = 1) => {
  const p = elegir(conTallas)
  return { slug: p.slug, talla: elegir(p.tallas!).talla, cantidad: 1 + Math.floor(azar() * cantidadMax) }
}

let n = 0
function entrada(metodo: 'domicilio' | 'encomienda', items = [linea()]): EntradaPedido {
  const i = n++
  const nombre = NOMBRES[i % NOMBRES.length]
  return metodo === 'domicilio'
    ? { items, nombre, telefono: telefono(i), metodo, ciudad: elegir(['La Paz', 'El Alto']), direccion: `Zona Sopocachi, calle ${10 + i} n.º ${100 + i}`, referencia: 'Portón negro' }
    : { items, nombre, telefono: telefono(i), metodo, ciudad: elegir(['Santa Cruz', 'Cochabamba', 'Sucre', 'Tarija', 'Oruro']), empresa: elegir(EMPRESAS), recibeDocumento: String(4000000 + i * 137) }
}

const haceDias = (d: number, horas = 0) => new Date(Date.now() - d * 86400000 - horas * 3600000)

async function crear(e: EntradaPedido, cuando: Date): Promise<Pedido> {
  const r = await crearPedido(payload, e, { simulado: true })
  if (!r.ok) throw new Error(r.error)
  // Fecha del pedido en el pasado (para el historial de ventas).
  await db.execute(sql`UPDATE pedidos SET created_at = ${cuando.toISOString()}, reserva_hasta = ${new Date(cuando.getTime() + 48 * 3600000).toISOString()} WHERE id = ${r.pedido.id}`)
  await db.execute(sql`UPDATE pedidos_historial SET fecha = ${cuando.toISOString()} WHERE _parent_id = ${r.pedido.id}`)
  return r.pedido
}

// Avanza el pedido por los estados indicados, cada uno unas horas después.
async function avanzar(p: Pedido, desde: Date, pasos: { estado: EstadoPedido; horas: number; nota?: string; guia?: string }[]) {
  let t = desde.getTime()
  for (const paso of pasos) {
    t += paso.horas * 3600000
    await payload.update({
      collection: 'pedidos',
      id: p.id,
      data: { estado: paso.estado, ...(paso.guia ? { guia: paso.guia } : {}) },
      context: { fecha: new Date(Math.min(t, Date.now())).toISOString(), nota: paso.nota ?? 'simulación' },
    })
  }
}

const casos: string[] = []
const anotar = (p: Pedido | null, caso: string) => casos.push(`${(p?.numero ?? '—').padEnd(8)} ${caso}`)

// 1–2. En cola: pendientes recién llegados (uno a domicilio, otro por encomienda con 2 prendas).
anotar(await crear(entrada('domicilio'), haceDias(0, 2)), 'Pendiente · a domicilio · hace 2 h')
anotar(await crear(entrada('encomienda', [linea(), linea(2)]), haceDias(0, 5)), 'Pendiente · encomienda · 2 prendas · hace 5 h')

// 3. Por vencer: la reserva termina en ~3 horas.
anotar(await crear(entrada('domicilio'), haceDias(1, 21)), 'Pendiente · la reserva vence en ~3 h')

// 4. Vencido: pasaron 48 h sin confirmar → se cancela solo y el stock vuelve.
anotar(await crear(entrada('encomienda'), haceDias(3)), 'Vencido → cancelado automáticamente (stock devuelto)')
await expirarReservas(payload)

// 5–8. En curso.
let p = await crear(entrada('domicilio'), haceDias(0, 8))
await avanzar(p, haceDias(0, 8), [{ estado: 'confirmado', horas: 3, nota: 'Pago QR recibido' }])
anotar(p, 'Confirmado (pagado) · hoy')

p = await crear(entrada('encomienda'), haceDias(1, 4))
await avanzar(p, haceDias(1, 4), [{ estado: 'confirmado', horas: 2, nota: 'Transferencia recibida' }, { estado: 'preparando', horas: 16 }])
anotar(p, 'Preparando')

p = await crear(entrada('domicilio'), haceDias(2))
await avanzar(p, haceDias(2), [{ estado: 'confirmado', horas: 1 }, { estado: 'preparando', horas: 5 }, { estado: 'enviado', horas: 20, nota: 'Sale con el repartidor' }])
anotar(p, 'Enviado · a domicilio')

p = await crear(entrada('encomienda', [linea(2)]), haceDias(3))
await avanzar(p, haceDias(3), [{ estado: 'confirmado', horas: 2 }, { estado: 'preparando', horas: 10 }, { estado: 'enviado', horas: 24, guia: 'TC-558213', nota: 'Despachado por encomienda' }])
anotar(p, 'Enviado · encomienda con n.º de guía')

// 9. Cancelado por el equipo: el cliente desistió (stock devuelto).
p = await crear(entrada('domicilio'), haceDias(4))
await avanzar(p, haceDias(4), [{ estado: 'cancelado', horas: 6, nota: 'El cliente desistió por WhatsApp' }])
anotar(p, 'Cancelado por el equipo (stock devuelto)')

// 10. Historial: ventas entregadas en los últimos 45 días (para el resumen).
let entregados = 0
for (let d = 45; d >= 5; d -= 2) {
  const e = entrada(azar() < 0.55 ? 'domicilio' : 'encomienda', azar() < 0.3 ? [linea(), linea()] : [linea(2)])
  try {
    p = await crear(e, haceDias(d, Math.floor(azar() * 12)))
  } catch {
    continue // sin stock de esa talla: se salta
  }
  await avanzar(p, haceDias(d), [
    { estado: 'confirmado', horas: 2 },
    { estado: 'preparando', horas: 12 },
    { estado: 'enviado', horas: 20, guia: e.metodo === 'encomienda' ? `EN-${Math.floor(azar() * 900000 + 100000)}` : undefined },
    { estado: 'entregado', horas: 30 },
  ])
  entregados++
}
casos.push(`${'(varios)'.padEnd(8)} ${entregados} ventas entregadas en los últimos 45 días`)

// 11. Sin stock: pedir más de lo que queda NO crea el pedido ni toca el stock.
const { docs: inv } = await payload.find({ collection: 'inventario', sort: 'stock', limit: 1, depth: 1 })
const poco = inv[0]
const prod = typeof poco.producto === 'object' ? poco.producto : null
if (prod) {
  const r = await crearPedido(payload, { ...entrada('domicilio'), items: [{ slug: prod.slug, talla: poco.talla, cantidad: Math.min(poco.stock + 1, 10) }] }, { simulado: true })
  casos.push(`${'—'.padEnd(8)} Rechazado por stock (${prod.nombre} ${poco.talla}, quedan ${poco.stock}): "${r.ok ? 'se creó (?)' : r.error}"`)
}

console.log('\nPedidos de prueba creados:\n' + casos.join('\n'))
await resumenStock(payload)
process.exit(0)

async function resumenStock(pl: Payload) {
  const { docs } = await pl.find({ collection: 'inventario', where: { stock: { less_than_equal: 2 } }, depth: 0, pagination: false })
  console.log(`\nStock bajo (≤ 2): ${docs.map((d) => `${d.etiqueta} = ${d.stock}`).join(', ') || 'ninguno'}`)
}
