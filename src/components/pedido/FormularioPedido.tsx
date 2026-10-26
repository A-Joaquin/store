'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { realizarPedido } from '@/app/(frontend)/pedido/acciones'
import { useCarrito } from '@/components/carrito/Carrito'
import { precioBs } from '@/lib/formato'
import { CIUDADES, HORAS_RESERVA, type MetodoEntrega } from '@/lib/pedidos/estados'

import s from './Pedido.module.css'

type Props = {
  envios: {
    domicilio: number
    encomienda: number
    gratisDesde: number
    ciudadesDomicilio: string[]
    notaEncomienda: string | null
  }
}

export function FormularioPedido({ envios }: Props) {
  const router = useRouter()
  const carrito = useCarrito()
  const [metodo, setMetodo] = useState<MetodoEntrega>('domicilio')
  const [ciudad, setCiudad] = useState(envios.ciudadesDomicilio[0] ?? 'La Paz')
  const [error, setError] = useState<string | null>(null)
  const [enviando, iniciar] = useTransition()

  const subtotal = carrito.subtotal
  const gratis = envios.gratisDesde > 0 && subtotal >= envios.gratisDesde
  const envio = gratis ? 0 : metodo === 'domicilio' ? envios.domicilio : envios.encomienda
  const ciudades = metodo === 'domicilio' ? envios.ciudadesDomicilio : [...CIUDADES]

  if (carrito.items.length === 0) {
    return (
      <div className={s.pagina}>
        <div>
          <h1 className={s.titulo}>Tu pedido</h1>
          <p className={s.vacia}>
            Tu bolsa está vacía. <Link href="/">Volver a la tienda</Link>
          </p>
        </div>
      </div>
    )
  }

  const enviar = (form: FormData) => {
    setError(null)
    const v = (k: string) => String(form.get(k) ?? '')
    iniciar(async () => {
      const r = await realizarPedido({
        items: carrito.items.map((i) => ({ slug: i.slug, talla: i.talla, cantidad: i.cantidad })),
        nombre: v('nombre'),
        telefono: v('telefono'),
        email: v('email'),
        documento: v('documento'),
        razonSocial: v('razonSocial'),
        metodo,
        ciudad,
        direccion: v('direccion'),
        referencia: v('referencia'),
        empresa: v('empresa'),
        recibeNombre: v('recibeNombre'),
        recibeDocumento: v('recibeDocumento'),
        notas: v('notas'),
        web: v('web'),
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      carrito.vaciar()
      router.push(`/pedido/${r.seguimiento}?nuevo=1`)
    })
  }

  return (
    <div className={s.pagina}>
      <form action={enviar}>
        <h1 className={s.titulo}>Tu pedido</h1>
        <p className={s.bajada}>
          Sin pago en línea por ahora: registramos tu pedido, apartamos tus prendas por {HORAS_RESERVA} horas y coordinamos el pago
          y la entrega por WhatsApp.
        </p>

        <fieldset className={s.seccion}>
          <legend>TUS DATOS</legend>
          <div className={s.fila}>
            <label className={s.campo}>
              NOMBRE Y APELLIDO
              <input name="nombre" required minLength={2} maxLength={80} autoComplete="name" />
            </label>
            <label className={s.campo}>
              WHATSAPP
              <input name="telefono" required type="tel" inputMode="tel" placeholder="+591 7…" autoComplete="tel" />
            </label>
            <label className={`${s.campo} ${s.campoAncho}`}>
              CORREO (OPCIONAL)
              <input name="email" type="email" autoComplete="email" />
            </label>
            <label className={s.campo}>
              CI / NIT PARA LA FACTURA (OPCIONAL)
              <input name="documento" maxLength={30} />
            </label>
            <label className={s.campo}>
              RAZÓN SOCIAL (OPCIONAL)
              <input name="razonSocial" maxLength={120} />
            </label>
          </div>
        </fieldset>

        <fieldset className={s.seccion}>
          <legend>ENTREGA</legend>
          <div className={s.opciones}>
            <label className={s.opcion}>
              <input
                type="radio"
                name="metodo"
                value="domicilio"
                checked={metodo === 'domicilio'}
                onChange={() => {
                  setMetodo('domicilio')
                  if (!envios.ciudadesDomicilio.includes(ciudad)) setCiudad(envios.ciudadesDomicilio[0] ?? 'La Paz')
                }}
              />
              <strong>A DOMICILIO</strong>
              <span>
                En {envios.ciudadesDomicilio.join(' y ')} · {gratis ? 'gratis' : precioBs(envios.domicilio)}
              </span>
            </label>
            <label className={s.opcion}>
              <input type="radio" name="metodo" value="encomienda" checked={metodo === 'encomienda'} onChange={() => setMetodo('encomienda')} />
              <strong>POR ENCOMIENDA</strong>
              <span>A todo el país; recoges en la terminal · {gratis ? 'gratis' : precioBs(envios.encomienda)}</span>
            </label>
          </div>

          <div className={s.fila}>
            <label className={`${s.campo} ${s.campoAncho}`}>
              CIUDAD
              <select value={ciudad} onChange={(e) => setCiudad(e.target.value)} required>
                {ciudades.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>

            {metodo === 'domicilio' ? (
              <>
                <label className={`${s.campo} ${s.campoAncho}`}>
                  DIRECCIÓN
                  <input name="direccion" required minLength={5} maxLength={300} autoComplete="street-address" placeholder="Zona, calle y número" />
                </label>
                <label className={`${s.campo} ${s.campoAncho}`}>
                  REFERENCIA (OPCIONAL)
                  <input name="referencia" maxLength={200} placeholder="Color de la casa, cerca de…" />
                </label>
              </>
            ) : (
              <>
                <label className={`${s.campo} ${s.campoAncho}`}>
                  EMPRESA DE TRANSPORTE (OPCIONAL)
                  <input name="empresa" maxLength={80} placeholder="La que prefieras; si no, elegimos nosotros" />
                </label>
                <label className={s.campo}>
                  QUIÉN RECOGE (NOMBRE)
                  <input name="recibeNombre" maxLength={80} placeholder="Si es otra persona" />
                </label>
                <label className={s.campo}>
                  CI DE QUIEN RECOGE
                  <input name="recibeDocumento" required maxLength={20} inputMode="numeric" />
                </label>
                {envios.notaEncomienda && <p className={`${s.ayuda} ${s.campoAncho}`}>{envios.notaEncomienda}</p>}
              </>
            )}

            <label className={`${s.campo} ${s.campoAncho}`}>
              NOTAS (OPCIONAL)
              <textarea name="notas" maxLength={500} />
            </label>
          </div>
        </fieldset>

        {/* Campo trampa para bots: invisible y fuera del orden de tabulación. */}
        <input className={s.trampa} name="web" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={s.boton} disabled={enviando}>
          {enviando ? 'ENVIANDO…' : 'CONFIRMAR PEDIDO'}
        </button>
      </form>

      <aside className={s.resumen} aria-label="Resumen">
        <h2>Resumen</h2>
        <ul>
          {carrito.items.map((i) => (
            <li key={i.clave} className={s.item}>
              {i.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura ya generada por Payload
                <img src={i.imagen} alt="" />
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
            <span>{precioBs(subtotal)}</span>
          </div>
          <div>
            <span>ENVÍO</span>
            <span>{envio ? precioBs(envio) : 'GRATIS'}</span>
          </div>
          <div className={s.total}>
            <span>TOTAL</span>
            <span>{precioBs(subtotal + envio)}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
