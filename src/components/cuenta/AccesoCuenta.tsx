'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { ingresar, registrar, type Respuesta } from '@/app/(frontend)/cuenta/acciones'
import { useFavoritos } from '@/components/favoritos/Favoritos'
import p from '@/components/pedido/Pedido.module.css'

import s from './Cuenta.module.css'

// Ingresar o crear cuenta. Al entrar, los favoritos de este navegador se
// juntan con los de la cuenta.
export function AccesoCuenta() {
  const router = useRouter()
  const favoritos = useFavoritos()
  const [error, setError] = useState<{ donde: 'ingresar' | 'registrar'; texto: string } | null>(null)
  const [enviando, iniciar] = useTransition()

  const enviar = (donde: 'ingresar' | 'registrar', accion: (f: FormData) => Promise<Respuesta>) => (form: FormData) => {
    setError(null)
    iniciar(async () => {
      const r = await accion(form)
      if (!r.ok) {
        setError({ donde, texto: r.error })
        return
      }
      await favoritos.sincronizar()
      router.refresh()
    })
  }

  return (
    <div className={s.acceso}>
      <form action={enviar('ingresar', ingresar)} className={s.columna}>
        <h1 className={p.titulo}>Ingresar</h1>
        <p className={p.bajada}>Para ver tus pedidos y tener tus favoritos en todos tus dispositivos.</p>
        <div className={s.campos}>
          <label className={p.campo}>
            CORREO
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className={p.campo}>
            CONTRASEÑA
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
        </div>
        {error?.donde === 'ingresar' && (
          <p className={p.error} role="alert">
            {error.texto}
          </p>
        )}
        <button type="submit" className={p.boton} disabled={enviando}>
          {enviando ? '…' : 'INGRESAR'}
        </button>
        <p className={s.ayuda}>¿Olvidaste tu contraseña? Escríbenos por WhatsApp y te ayudamos.</p>
      </form>

      <form action={enviar('registrar', registrar)} className={s.columna}>
        <h2 className={p.titulo}>Crear cuenta</h2>
        <p className={p.bajada}>Tus datos quedan listos para tus próximos pedidos.</p>
        <div className={s.campos}>
          <label className={p.campo}>
            NOMBRE Y APELLIDO
            <input name="nombre" required minLength={2} maxLength={80} autoComplete="name" />
          </label>
          <label className={p.campo}>
            WHATSAPP (OPCIONAL)
            <input name="telefono" type="tel" inputMode="tel" placeholder="+591 7…" autoComplete="tel" />
          </label>
          <label className={p.campo}>
            CORREO
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className={p.campo}>
            CONTRASEÑA (MÍNIMO 8 CARACTERES)
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
        </div>
        {/* Campo trampa para bots. */}
        <input className={p.trampa} name="web" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {error?.donde === 'registrar' && (
          <p className={p.error} role="alert">
            {error.texto}
          </p>
        )}
        <button type="submit" className={p.boton} disabled={enviando}>
          {enviando ? '…' : 'CREAR CUENTA'}
        </button>
      </form>
    </div>
  )
}
