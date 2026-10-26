import type { Metadata } from 'next'

import { AccesoCuenta } from '@/components/cuenta/AccesoCuenta'
import { MiCuenta } from '@/components/cuenta/MiCuenta'
import { getCliente } from '@/lib/clientes'
import { cliente } from '@/lib/datos'

export const metadata: Metadata = {
  title: 'Mi cuenta',
  robots: { index: false, follow: false },
}

// Depende de la sesión: nunca estática.
export const dynamic = 'force-dynamic'

export default async function PaginaCuenta() {
  const c = await getCliente()
  if (!c) return <AccesoCuenta />

  const { docs: pedidos } = await (await cliente()).find({
    collection: 'pedidos',
    where: { cliente: { equals: c.id } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
    select: { numero: true, estado: true, total: true, createdAt: true, seguimiento: true },
  })

  return (
    <MiCuenta
      cliente={{ nombre: c.nombre, email: c.email, telefono: c.telefono ?? '' }}
      pedidos={pedidos.map((p) => ({
        numero: p.numero ?? '',
        estado: p.estado,
        total: p.total,
        fecha: p.createdAt,
        seguimiento: p.seguimiento ?? '',
      }))}
    />
  )
}
