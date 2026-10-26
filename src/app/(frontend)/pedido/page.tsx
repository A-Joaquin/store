import type { Metadata } from 'next'

import { FormularioPedido } from '@/components/pedido/FormularioPedido'
import { getAjustes } from '@/lib/datos'
import { ciudadesDomicilio } from '@/lib/pedidos/crear'

export const metadata: Metadata = {
  title: 'Tu pedido',
  robots: { index: false, follow: false },
}

export default async function PaginaPedido() {
  const ajustes = await getAjustes()
  const e = ajustes.envios
  return (
    <FormularioPedido
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
