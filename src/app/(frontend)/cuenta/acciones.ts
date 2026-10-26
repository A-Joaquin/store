'use server'

import { revalidatePath } from 'next/cache'

import { borrarSesion, getCliente, guardarSesion } from '@/lib/clientes'
import { cliente } from '@/lib/datos'

export type Respuesta = { ok: true } | { ok: false; error: string }

const limpiar = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().slice(0, max) : '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --- Registro / ingreso / salida -------------------------------------------

export async function registrar(form: FormData): Promise<Respuesta> {
  if (form.get('web')) return { ok: false, error: 'No se pudo crear la cuenta.' } // campo trampa
  const email = limpiar(form.get('email'), 120).toLowerCase()
  const password = String(form.get('password') ?? '')
  const nombre = limpiar(form.get('nombre'), 80)
  const telefono = limpiar(form.get('telefono'), 20).replace(/[^\d+]/g, '')
  if (nombre.length < 2) return { ok: false, error: 'Escribe tu nombre.' }
  if (!EMAIL.test(email)) return { ok: false, error: 'Escribe un correo válido.' }
  if (password.length < 8) return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }

  const payload = await cliente()
  const existe = await payload.count({ collection: 'clientes', where: { email: { equals: email } } })
  if (existe.totalDocs > 0) return { ok: false, error: 'Ya existe una cuenta con ese correo. Ingresa con tu contraseña.' }

  await payload.create({ collection: 'clientes', data: { email, password, nombre, telefono: telefono || undefined } })
  const r = await payload.login({ collection: 'clientes', data: { email, password } })
  if (!r.token) return { ok: false, error: 'La cuenta se creó, pero no se pudo iniciar sesión. Intenta ingresar.' }
  await guardarSesion(r.token, r.exp)
  revalidatePath('/cuenta')
  return { ok: true }
}

export async function ingresar(form: FormData): Promise<Respuesta> {
  const email = limpiar(form.get('email'), 120).toLowerCase()
  const password = String(form.get('password') ?? '')
  try {
    const r = await (await cliente()).login({ collection: 'clientes', data: { email, password } })
    if (!r.token) throw new Error('sin token')
    await guardarSesion(r.token, r.exp)
    revalidatePath('/cuenta')
    return { ok: true }
  } catch (e) {
    const bloqueada = e instanceof Error && /locked/i.test(e.message)
    return {
      ok: false,
      error: bloqueada
        ? 'Demasiados intentos. La cuenta quedó bloqueada 10 minutos.'
        : 'Correo o contraseña incorrectos.',
    }
  }
}

export async function salir(): Promise<void> {
  await borrarSesion()
  revalidatePath('/cuenta')
}

export async function actualizarDatos(form: FormData): Promise<Respuesta> {
  const c = await getCliente()
  if (!c) return { ok: false, error: 'Tu sesión terminó. Vuelve a ingresar.' }
  const nombre = limpiar(form.get('nombre'), 80)
  const telefono = limpiar(form.get('telefono'), 20).replace(/[^\d+]/g, '')
  if (nombre.length < 2) return { ok: false, error: 'Escribe tu nombre.' }
  await (await cliente()).update({ collection: 'clientes', id: c.id, data: { nombre, telefono } })
  revalidatePath('/cuenta')
  return { ok: true }
}

// --- Favoritos ----------------------------------------------------------------
// Sin sesión los favoritos viven solo en el navegador. Con sesión se guardan
// en la cuenta: al entrar se juntan los del navegador con los de la cuenta.

const idsDe = (favoritos: unknown) =>
  (Array.isArray(favoritos) ? favoritos : []).map((f) => (typeof f === 'object' && f ? (f as { id: number }).id : (f as number)))

async function slugsAIds(slugs: string[]) {
  if (slugs.length === 0) return []
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: { slug: { in: slugs.slice(0, 200) } },
    pagination: false,
    depth: 0,
    select: { slug: true },
    overrideAccess: false,
  })
  return docs.map((d) => d.id)
}

async function idsASlugs(ids: number[]) {
  if (ids.length === 0) return []
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: { id: { in: ids } },
    pagination: false,
    depth: 0,
    select: { slug: true },
    overrideAccess: false,
  })
  return docs.map((d) => d.slug)
}

// Junta los favoritos del navegador con los de la cuenta y devuelve la lista
// final (o null si no hay sesión).
export async function sincronizarFavoritos(slugs: string[]): Promise<string[] | null> {
  const c = await getCliente()
  if (!c) return null
  const ids = [...new Set([...idsDe(c.favoritos), ...(await slugsAIds(slugs))])]
  await (await cliente()).update({ collection: 'clientes', id: c.id, data: { favoritos: ids } })
  return idsASlugs(ids)
}

export async function guardarFavorito(slug: string, activo: boolean): Promise<void> {
  const c = await getCliente()
  if (!c) return
  const [id] = await slugsAIds([slug])
  if (!id) return
  const actuales = idsDe(c.favoritos)
  const ids = activo ? [...new Set([...actuales, id])] : actuales.filter((x) => x !== id)
  await (await cliente()).update({ collection: 'clientes', id: c.id, data: { favoritos: ids } })
}

export async function haySesion(): Promise<{ nombre: string } | null> {
  const c = await getCliente()
  return c ? { nombre: c.nombre } : null
}
