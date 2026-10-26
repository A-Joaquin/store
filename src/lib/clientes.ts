import { cookies, headers } from 'next/headers'

import type { Cliente } from '@/payload-types'

import { cliente } from './datos'

// La sesión es la misma cookie que usa Payload ("payload-token"): así
// payload.auth la reconoce y la API respeta los permisos del cliente.
export const COOKIE_SESION = 'payload-token'

// Cliente con sesión iniciada en esta petición, o null.
export async function getCliente(): Promise<Cliente | null> {
  const payload = await cliente()
  const { user } = await payload.auth({ headers: await headers() })
  return user?.collection === 'clientes' ? (user as Cliente) : null
}

export async function guardarSesion(token: string, expira?: number) {
  ;(await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(expira ? { expires: new Date(expira * 1000) } : {}),
  })
}

export async function borrarSesion() {
  ;(await cookies()).delete(COOKIE_SESION)
}
