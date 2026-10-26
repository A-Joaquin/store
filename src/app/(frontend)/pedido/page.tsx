import type { Metadata } from 'next'

import { FormularioPedido } from '@/components/pedido/FormularioPedido'
import { getCliente } from '@/lib/clientes'
import { getAjustes } from '@/lib/datos'
import { ciudadesDomicilio } from '@/lib/pedidos/crear'

export const metadata: Metadata = {
  title: 'Tu pedido',
  robots: { index: false, follow: false },
}

// Depende de la sesión (datos del cliente precargados): nunca estática.
export const dynamic = 'force-dynamic'

export default async function PaginaPedido() {
  const [ajustes, c] = await Promise.all([getAjustes(), getCliente()])
  const e = ajustes.envios
  return (
    <FormularioPedido
      cliente={c ? { nombre: c.nombre, telefono: c.telefono ?? '', email: c.email } : null}
      envios={{
        domicilio: e?.costoLocal ?? 15,
        encomienda: e?.costoNacional ?? 35,
        gratisDesde: e?.gratisDesde ?? 0,
        ciudadesDomicilio: ciudadesDomicilio(ajustes),
        notaEncomienda: e?.recojo || null,
      }}
    />
  )
}
