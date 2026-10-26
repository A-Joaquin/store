'use server'

import { getCliente } from '@/lib/clientes'
import { cliente } from '@/lib/datos'
import { crearPedido, type EntradaPedido } from '@/lib/pedidos/crear'

export type RespuestaPedido = { ok: true; seguimiento: string } | { ok: false; error: string }

// Crea el pedido desde el formulario. El servidor revalida todo: precios,
// tallas, stock y datos de entrega.
export async function realizarPedido(entrada: EntradaPedido & { web?: string }): Promise<RespuestaPedido> {
  // Campo trampa: invisible para personas; si viene lleno es un bot.
  if (entrada.web) return { ok: false, error: 'No se pudo enviar el pedido.' }
  try {
    // Con sesión iniciada, el pedido queda en "Mis pedidos" del cliente.
    const c = await getCliente()
    const r = await crearPedido(await cliente(), entrada, { clienteId: c?.id })
    if (!r.ok) return { ok: false, error: r.error }
    return { ok: true, seguimiento: r.pedido.seguimiento! }
  } catch (e) {
    console.error('Error al crear el pedido', e)
    return { ok: false, error: 'No pudimos registrar tu pedido. Intenta de nuevo en un momento.' }
  }
}
