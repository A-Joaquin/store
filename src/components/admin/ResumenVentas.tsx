import Link from 'next/link'
import type { Payload } from 'payload'

import { STOCK_BAJO } from '@/collections/Inventario'
import { precioBs } from '@/lib/formato'
import { expirarReservas } from '@/lib/pedidos/crear'
import { ESTADOS_VENTA } from '@/lib/pedidos/estados'

// Resumen básico en el inicio del panel: pedidos en cola, por despachar,
// ventas del mes, más vendidos y stock bajo.
export async function ResumenVentas({ payload }: { payload: Payload }) {
  await expirarReservas(payload)
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const hace30 = new Date(ahora.getTime() - 30 * 86400000).toISOString()

  const [pendientes, porDespachar, ventasMes, ventas30, stockBajo] = await Promise.all([
    payload.find({ collection: 'pedidos', where: { estado: { equals: 'pendiente' } }, sort: 'reservaHasta', limit: 6, depth: 0 }),
    payload.count({ collection: 'pedidos', where: { estado: { in: ['confirmado', 'preparando'] } } }),
    payload.find({
      collection: 'pedidos',
      where: { and: [{ estado: { in: ESTADOS_VENTA } }, { createdAt: { greater_than_equal: inicioMes } }] },
      pagination: false,
      depth: 0,
      select: { total: true },
    }),
    payload.find({
      collection: 'pedidos',
      where: { and: [{ estado: { in: ESTADOS_VENTA } }, { createdAt: { greater_than_equal: hace30 } }] },
      pagination: false,
      depth: 0,
      select: { total: true, items: true },
    }),
    payload.find({ collection: 'inventario', where: { stock: { less_than_equal: STOCK_BAJO } }, sort: 'stock', limit: 8, depth: 0 }),
  ])

  const sumar = (docs: { total: number }[]) => docs.reduce((n, d) => n + d.total, 0)
  const ingresosMes = sumar(ventasMes.docs)
  const ticket = ventas30.docs.length ? sumar(ventas30.docs) / ventas30.docs.length : 0

  const unidades = new Map<string, number>()
  for (const p of ventas30.docs) for (const i of p.items ?? []) unidades.set(i.nombre, (unidades.get(i.nombre) ?? 0) + i.cantidad)
  const top = [...unidades].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const hora = (iso?: string | null) =>
    iso ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/La_Paz' }).format(new Date(iso)) : ''

  const tarjeta: React.CSSProperties = {
    padding: '18px 20px',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    background: 'var(--theme-elevation-0)',
  }
  const etiqueta: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6 }
  const cifra: React.CSSProperties = { fontSize: 28, fontWeight: 600, marginTop: 6 }

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ marginBottom: 16 }}>Ventas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Link href="/admin/collections/pedidos?where[estado][equals]=pendiente" style={{ ...tarjeta, textDecoration: 'none', color: 'inherit' }}>
          <div style={etiqueta}>En cola (pendientes)</div>
          <div style={cifra}>{pendientes.totalDocs}</div>
        </Link>
        <Link href="/admin/collections/pedidos?where[estado][in]=confirmado,preparando" style={{ ...tarjeta, textDecoration: 'none', color: 'inherit' }}>
          <div style={etiqueta}>Por despachar</div>
          <div style={cifra}>{porDespachar.totalDocs}</div>
        </Link>
        <div style={tarjeta}>
          <div style={etiqueta}>Ventas del mes</div>
          <div style={cifra}>{precioBs(ingresosMes)}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{ventasMes.docs.length} pedidos</div>
        </div>
        <div style={tarjeta}>
          <div style={etiqueta}>Ticket promedio (30 días)</div>
          <div style={cifra}>{precioBs(Math.round(ticket))}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{ventas30.docs.length} ventas</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={tarjeta}>
          <div style={etiqueta}>Pendientes (vence la reserva)</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
            {pendientes.docs.map((p) => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', fontSize: 13 }}>
                <Link href={`/admin/collections/pedidos/${p.id}`}>
                  {p.numero} · {p.nombre}
                </Link>
                <span style={{ opacity: 0.7 }}>
                  {precioBs(p.total)} · {hora(p.reservaHasta)}
                </span>
              </li>
            ))}
            {pendientes.docs.length === 0 && <li style={{ fontSize: 13, opacity: 0.6 }}>Nada en cola.</li>}
          </ul>
        </div>
        <div style={tarjeta}>
          <div style={etiqueta}>Más vendidos (30 días)</div>
          <ol style={{ padding: '0 0 0 18px', margin: '10px 0 0', fontSize: 13 }}>
            {top.map(([nombre, n]) => (
              <li key={nombre} style={{ padding: '4px 0' }}>
                {nombre} — {n} u.
              </li>
            ))}
            {top.length === 0 && <li style={{ opacity: 0.6 }}>Sin ventas todavía.</li>}
          </ol>
        </div>
        <div style={tarjeta}>
          <div style={etiqueta}>Stock bajo (≤ {STOCK_BAJO})</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', fontSize: 13 }}>
            {stockBajo.docs.map((i) => (
              <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Link href={`/admin/collections/inventario/${i.id}`}>{i.etiqueta}</Link>
                <strong>{i.stock}</strong>
              </li>
            ))}
            {stockBajo.docs.length === 0 && <li style={{ opacity: 0.6 }}>Todo con stock.</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}
