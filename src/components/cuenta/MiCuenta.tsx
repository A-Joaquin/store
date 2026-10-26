'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { actualizarDatos, salir } from '@/app/(frontend)/cuenta/acciones'
import { useFavoritos } from '@/components/favoritos/Favoritos'
import p from '@/components/pedido/Pedido.module.css'
import { precioBs } from '@/lib/formato'
import { etiquetaEstado } from '@/lib/pedidos/estados'

import s from './Cuenta.module.css'

type Props = {
  cliente: { nombre: string; email: string; telefono: string }
  pedidos: { numero: string; estado: string; total: number; fecha: string; seguimiento: string }[]
}

const fecha = (iso: string) =>
  new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeZone: 'America/La_Paz' }).format(new Date(iso))

export function MiCuenta({ cliente, pedidos }: Props) {
  const router = useRouter()
  const favoritos = useFavoritos()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [enviando, iniciar] = useTransition()

  return (
    <div className={s.cuenta}>
      <header className={s.saludo}>
        <h1 className={p.titulo}>Hola, {cliente.nombre.split(' ')[0]}</h1>
        <button
          type="button"
          className={s.salir}
          disabled={enviando}
          onClick={() =>
            iniciar(async () => {
              await salir()
              favoritos.olvidar()
              router.refresh()
            })
          }
        >
          CERRAR SESIÓN
        </button>
      </header>

      <section className={s.seccion} aria-labelledby="mis-pedidos">
        <h2 id="mis-pedidos" className={s.subtitulo}>
          MIS PEDIDOS
        </h2>
        {pedidos.length === 0 ? (
          <p className={p.bajada}>
            Aún no tienes pedidos con esta cuenta. <Link href="/">Ver la tienda</Link>
          </p>
        ) : (
          <ul className={s.pedidos}>
            {pedidos.map((x) => (
              <li key={x.numero}>
                <Link href={`/pedido/${x.seguimiento}`}>
                  <span className={s.numero}>{x.numero}</span>
                  <span>{fecha(x.fecha)}</span>
                  <span className={x.estado === 'cancelado' ? s.cancelado : undefined}>{etiquetaEstado(x.estado)}</span>
                  <span className={s.total}>{precioBs(x.total)}</span>
                  <span className={s.ver}>VER →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.seccion} aria-labelledby="favoritos">
        <h2 id="favoritos" className={s.subtitulo}>
          FAVORITOS
        </h2>
        <p className={p.bajada}>
          {favoritos.cantidad === 0 ? 'Todavía no guardaste prendas.' : `${favoritos.cantidad} prendas guardadas.`}{' '}
          <Link href="/favoritos">Ver favoritos</Link>
        </p>
      </section>

      <section className={s.seccion} aria-labelledby="mis-datos">
        <h2 id="mis-datos" className={s.subtitulo}>
          MIS DATOS
        </h2>
        <form
          action={(form) =>
            iniciar(async () => {
              const r = await actualizarDatos(form)
              setAviso(r.ok ? { ok: true, texto: 'Datos guardados.' } : { ok: false, texto: r.error })
              if (r.ok) router.refresh()
            })
          }
        >
          <div className={p.fila}>
            <label className={p.campo}>
              NOMBRE Y APELLIDO
              <input name="nombre" defaultValue={cliente.nombre} required minLength={2} maxLength={80} autoComplete="name" />
            </label>
            <label className={p.campo}>
              WHATSAPP
              <input name="telefono" defaultValue={cliente.telefono} type="tel" inputMode="tel" autoComplete="tel" />
            </label>
            <label className={`${p.campo} ${p.campoAncho}`}>
              CORREO
              <input value={cliente.email} readOnly disabled />
            </label>
          </div>
          {aviso && (
            <p className={aviso.ok ? s.ok : p.error} role="status">
              {aviso.texto}
            </p>
          )}
          <button type="submit" className={p.boton} disabled={enviando}>
            GUARDAR
          </button>
        </form>
      </section>
    </div>
  )
}
