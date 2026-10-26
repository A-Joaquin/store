'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'

import { guardarFavorito, sincronizarFavoritos } from '@/app/(frontend)/cuenta/acciones'

// --- Favoritos en localStorage (como la bolsa) -----------------------------
const CLAVE = 'whatice_favoritos_v1'
const VACIA: string[] = []
const oyentes = new Set<() => void>()
let enMemoria: string[] | null = null

function leer(): string[] {
  if (enMemoria) return enMemoria
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || '[]')
    enMemoria = Array.isArray(g) ? g.filter((x) => typeof x === 'string') : VACIA
  } catch {
    enMemoria = VACIA
  }
  return enMemoria
}

function escribir(slugs: string[]) {
  enMemoria = slugs
  try {
    localStorage.setItem(CLAVE, JSON.stringify(slugs))
  } catch {
    // Sin almacenamiento: duran lo que dure la pestaña.
  }
  oyentes.forEach((f) => f())
}

function suscribir(f: () => void) {
  oyentes.add(f)
  const otraPestana = (e: StorageEvent) => {
    if (e.key !== CLAVE) return
    enMemoria = null
    f()
  }
  window.addEventListener('storage', otraPestana)
  return () => {
    oyentes.delete(f)
    window.removeEventListener('storage', otraPestana)
  }
}

type Ctx = {
  slugs: string[]
  cantidad: number
  es: (slug: string) => boolean
  alternar: (slug: string) => void
  // Junta los favoritos del navegador con los de la cuenta (al iniciar sesión).
  sincronizar: () => Promise<void>
  // Al cerrar sesión: los favoritos eran de la cuenta, se quitan del navegador.
  olvidar: () => void
}
const FavoritosCtx = createContext<Ctx | null>(null)

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const slugs = useSyncExternalStore(suscribir, leer, () => VACIA)
  // Si hay sesión (se sabe al sincronizar), cada cambio también va a la cuenta.
  const conSesion = useRef(false)

  const sincronizar = useCallback(async () => {
    const r = await sincronizarFavoritos(leer()).catch(() => null)
    conSesion.current = r !== null
    if (r) escribir(r)
  }, [])

  // Una vez por carga: si hay sesión, se juntan con los de la cuenta.
  useEffect(() => {
    void sincronizar()
  }, [sincronizar])

  const valor = useMemo<Ctx>(() => {
    const set = new Set(slugs)
    return {
      slugs,
      cantidad: slugs.length,
      es: (slug) => set.has(slug),
      alternar: (slug) => {
        const activo = !set.has(slug)
        escribir(activo ? [slug, ...leer().filter((s) => s !== slug)] : leer().filter((s) => s !== slug))
        if (conSesion.current) void guardarFavorito(slug, activo).catch(() => {})
      },
      sincronizar,
      olvidar: () => {
        conSesion.current = false
        escribir(VACIA)
      },
    }
  }, [slugs, sincronizar])

  return <FavoritosCtx.Provider value={valor}>{children}</FavoritosCtx.Provider>
}

export function useFavoritos() {
  const ctx = useContext(FavoritosCtx)
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>')
  return ctx
}
