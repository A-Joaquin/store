import type { Access, PayloadRequest } from 'payload'

// Hay dos tipos de sesión: el equipo (colección "users", entra al panel) y los
// clientes de la tienda ("clientes"). Por defecto Payload deja crear, editar y
// borrar a cualquiera con sesión, así que cada colección usa estas reglas
// explícitas: solo el equipo administra.

export const esEquipo = (req: Pick<PayloadRequest, 'user'>) => req.user?.collection === 'users'

export const soloEquipo: Access = ({ req }) => esEquipo(req)

export const publico: Access = () => true

// Equipo: todo. Cliente: solo su propio documento. Sin sesión: nada.
export const equipoOElMismo: Access = ({ req }) => {
  if (esEquipo(req)) return true
  if (req.user?.collection === 'clientes') return { id: { equals: req.user.id } }
  return false
}

// Lectura pública y administración solo del equipo.
export const lecturaPublica = { read: publico, create: soloEquipo, update: soloEquipo, delete: soloEquipo }
