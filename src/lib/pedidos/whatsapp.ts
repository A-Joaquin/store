import { precioBs } from '@/lib/formato'
import type { Pedido } from '@/payload-types'

import { etiquetaMetodo } from './estados'

// Mensaje que el cliente envía por WhatsApp al terminar su pedido: con el
// número, el detalle y el enlace de seguimiento, el equipo lo encuentra al
// instante en el panel.
export function mensajePedido(p: Pedido, urlSeguimiento: string) {
  const lineas = [
    `Hola WHATICE, hice el pedido *${p.numero}*:`,
    ...p.items.map((i) => `• ${i.cantidad} × ${i.nombre} — talla ${i.talla} (${precioBs(i.precio * i.cantidad)})`),
    `Envío: ${etiquetaMetodo(p.metodo)} a ${p.ciudad} (${p.envio ? precioBs(p.envio) : 'gratis'})`,
    `*Total: ${precioBs(p.total)}*`,
    '',
    `A nombre de: ${p.nombre}`,
    `Seguimiento: ${urlSeguimiento}`,
    '',
    '¿Cómo hago el pago?',
  ]
  return lineas.join('\n')
}

export const enlaceWhatsApp = (numero: string | null | undefined, mensaje: string) => {
  const n = numero?.replace(/\D/g, '')
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}` : null
}
