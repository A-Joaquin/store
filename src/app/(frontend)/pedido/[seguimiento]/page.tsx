import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import s from '@/components/pedido/Pedido.module.css'
import { cliente, getAjustes } from '@/lib/datos'
import { precioBs } from '@/lib/formato'
import { expirarReservas } from '@/lib/pedidos/crear'
import { ESTADOS, etiquetaMetodo } from '@/lib/pedidos/estados'
import { enlaceWhatsApp, mensajePedido } from '@/lib/pedidos/whatsapp'
import { comoMedia } from '@/lib/imagen'
import { SITE_URL } from '@/lib/sitio'
import type { Producto } from '@/payload-types'

type Props = {
  params: Promise<{ seguimiento: string }>
  searchParams: Promise<{ nuevo?: string }>
}

export const metadata: Metadata = {
  title: 'Seguimiento de pedido',
  robots: { index: false, follow: false },
}

// Siempre al día: el estado cambia desde el panel.
export const dynamic = 'force-dynamic'

// Miniatura de la prenda (si sigue existiendo).
const fotoDe = (producto: number | Producto) => {
  if (typeof producto !== 'object') return null
  const m = comoMedia(producto.galeria?.[0])
  return m?.sizes?.w400?.url ?? null
}

const fecha = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/La_Paz' }).format(new Date(iso))
    : ''

// Página privada del cliente: se entra con el código aleatorio del enlace
// (no con el número de pedido, que es fácil de adivinar).
export default async function Seguimiento({ params, searchParams }: Props) {
  const { seguimiento } = await params
  const { nuevo } = await searchParams
  if (!/^[\w-]{12,40}$/.test(seguimiento)) notFound()

  const payload = await cliente()
  await expirarReservas(payload)
  const { docs } = await payload.find({ collection: 'pedidos', where: { seguimiento: { equals: seguimiento } }, limit: 1, depth: 2 })
  const p = docs[0]
  if (!p) notFound()

  const ajustes = await getAjustes()
  const url = `${SITE_URL}/pedido/${seguimiento}`
  const whatsapp = p.estado === 'pendiente' ? enlaceWhatsApp(ajustes.whatsapp, mensajePedido(p, url)) : null

  // Línea de tiempo: los pasos normales, con su fecha si ya ocurrieron.
  const cuando = new Map((p.historial ?? []).map((h) => [h.estado, h.fecha]))
  const pasos = p.estado === 'cancelado' ? ESTADOS.filter((e) => cuando.has(e.valor)) : ESTADOS.filter((e) => e.valor !== 'cancelado')
  const indiceActual = pasos.findIndex((e) => e.valor === p.estado)

  return (
    <div className={s.pagina}>
      <div>
        <h1 className={s.titulo}>{nuevo ? '¡Pedido recibido!' : `Pedido ${p.numero}`}</h1>
        <p className={s.bajada}>
          {nuevo ? (
            <>
              Tu pedido <strong>{p.numero}</strong> quedó registrado y tus prendas están apartadas hasta el {fecha(p.reservaHasta)}.{' '}
              Envíanos el pedido por WhatsApp para coordinar el pago y la entrega. Guarda este enlace para ver su estado.
            </>
          ) : (
            ESTADOS.find((e) => e.valor === p.estado)?.cliente
          )}
        </p>
        <span className={`${s.estadoActual} ${p.estado === 'cancelado' ? s.cancelado : ''}`}>
          {ESTADOS.find((e) => e.valor === p.estado)?.etiqueta.toUpperCase()}
        </span>

        {whatsapp ? (
          <a className={`${s.boton} ${s.botonWhatsapp}`} href={whatsapp} target="_blank" rel="noopener noreferrer">
            ENVIAR PEDIDO POR WHATSAPP
          </a>
        ) : (
          p.estado === 'pendiente' && <p className={s.error}>Escríbenos por WhatsApp con tu número de pedido {p.numero}.</p>
        )}

        <ol className={s.linea} aria-label="Estado del pedido">
          {pasos.map((e, i) => (
            <li key={e.valor} className={`${s.paso} ${i <= indiceActual ? s.pasoHecho : ''}`}>
              <span className={s.punto} />
              <span>
                {e.etiqueta.toUpperCase()}
                {cuando.get(e.valor) && <small>{fecha(cuando.get(e.valor))}</small>}
              </span>
            </li>
          ))}
        </ol>

        <dl className={s.datos}>
          <dt>ENTREGA</dt>
          <dd>
            {etiquetaMetodo(p.metodo)} · {p.ciudad}
            <br />
            {p.metodo === 'domicilio'
              ? [p.direccion, p.referencia].filter(Boolean).join(' — ')
              : `Recoge: ${p.recibeNombre ?? p.nombre}${p.empresa ? ` · ${p.empresa}` : ''}`}
          </dd>
          {p.guia && (
            <>
              <dt>N.º DE GUÍA</dt>
              <dd>{p.guia}</dd>
            </>
          )}
          <dt>A NOMBRE DE</dt>
          <dd>{p.nombre}</dd>
        </dl>
        <p className={s.bajada}>
          <Link href="/">← Volver a la tienda</Link>
        </p>
      </div>

      <aside className={s.resumen} aria-label="Detalle">
        <h2>{p.numero}</h2>
        <ul>
          {p.items.map((i) => (
            <li key={i.id ?? `${i.nombre}${i.talla}`} className={s.item}>
              {fotoDe(i.producto) ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura ya generada por Payload
                <img src={fotoDe(i.producto)!} alt="" />
              ) : (
                <span className={s.itemFoto} />
              )}
              <span>
                {i.nombre}
                <small>
                  Talla {i.talla} · {i.cantidad} ×
                </small>
              </span>
              <span>{precioBs(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className={s.totales}>
          <div>
            <span>SUBTOTAL</span>
            <span>{precioBs(p.subtotal)}</span>
          </div>
          <div>
            <span>ENVÍO</span>
            <span>{p.envio ? precioBs(p.envio) : 'GRATIS'}</span>
          </div>
          <div className={s.total}>
            <span>TOTAL</span>
            <span>{precioBs(p.total)}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
