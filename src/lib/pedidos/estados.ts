// Estados del pedido (fase 1: pago y coordinación por WhatsApp).
export const ESTADOS = [
  { valor: 'pendiente', etiqueta: 'Pendiente', cliente: 'Recibido: te escribiremos por WhatsApp para coordinar el pago.' },
  { valor: 'confirmado', etiqueta: 'Confirmado (pagado)', cliente: 'Pago confirmado.' },
  { valor: 'preparando', etiqueta: 'Preparando', cliente: 'Estamos preparando tu pedido.' },
  { valor: 'enviado', etiqueta: 'Enviado / listo para recoger', cliente: 'En camino (o listo para recoger).' },
  { valor: 'entregado', etiqueta: 'Entregado', cliente: 'Entregado. ¡Gracias por tu compra!' },
  { valor: 'cancelado', etiqueta: 'Cancelado', cliente: 'Pedido cancelado.' },
] as const

export type EstadoPedido = (typeof ESTADOS)[number]['valor']

// Estados que cuentan como venta realizada.
export const ESTADOS_VENTA: EstadoPedido[] = ['confirmado', 'preparando', 'enviado', 'entregado']

export const etiquetaEstado = (e: string) => ESTADOS.find((x) => x.valor === e)?.etiqueta ?? e

export const CIUDADES = [
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Sucre',
  'Tarija',
  'Trinidad',
  'Cobija',
] as const

// Horas que el stock queda reservado mientras se coordina el pago.
export const HORAS_RESERVA = 48

// Formas de entrega. Encomienda: se despacha por una empresa de transporte
// y el cliente la recoge en la terminal de su ciudad.
export const METODOS = [
  { valor: 'domicilio', etiqueta: 'A domicilio' },
  { valor: 'encomienda', etiqueta: 'Por encomienda (recoger en terminal)' },
] as const

export type MetodoEntrega = (typeof METODOS)[number]['valor']
export const etiquetaMetodo = (m: string) => METODOS.find((x) => x.valor === m)?.etiqueta ?? m
