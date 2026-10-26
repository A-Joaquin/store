'use client'

import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react'

export type ItemCarrito = {
  clave: string
  slug: string
  nombre: string
  precio: number
  imagen: string | null
  talla: string
  cantidad: number
}

type Contexto = {
  items: ItemCarrito[]
  cantidad: number
  subtotal: number
  abierto: boolean
  abrir: () => void
  cerrar: () => void
  alternar: () => void
  agregar: (item: Omit<ItemCarrito, 'clave' | 'cantidad'>) => void
  cambiarCantidad: (clave: string, delta: number) => void
  quitar: (clave: string) => void
  vaciar: () => void
}

// --- Bolsa en localStorage ---------------------------------------------------
// Fase 1: vive en el navegador (como en el sitio estático) y el pedido se
// cierra por WhatsApp. En la fase 2 se valida y se guarda en el servidor.
const CLAVE = 'whatice_bolsa_v1'
const VACIA: ItemCarrito[] = []
const oyentes = new Set<() => void>()
let enMemoria: ItemCarrito[] | null = null

function leer(): ItemCarrito[] {
  if (enMemoria) return enMemoria
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || '[]')
    enMemoria = Array.isArray(guardado) ? guardado : VACIA
  } catch {
    // Bolsa ilegible o almacenamiento bloqueado: se empieza vacía.
    enMemoria = VACIA
  }
  return enMemoria
}

function escribir(items: ItemCarrito[]) {
  enMemoria = items
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items))
  } catch {
    // Sin almacenamiento (modo privado): la bolsa dura lo que dure la pestaña.
  }
  oyentes.forEach((f) => f())
}

function suscribir(f: () => void) {
  oyentes.add(f)
  // Otra pestaña cambió la bolsa: se vuelve a leer.
  const alGuardarEnOtraPestana = (e: StorageEvent) => {
    if (e.key !== CLAVE) return
    enMemoria = null
    f()
  }
  window.addEventListener('storage', alGuardarEnOtraPestana)
  return () => {
    oyentes.delete(f)
    window.removeEventListener('storage', alGuardarEnOtraPestana)
  }
}

const CarritoCtx = createContext<Contexto | null>(null)

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(suscribir, leer, () => VACIA)
  const ruta = usePathname()
  // Se guarda en qué página se abrió: al navegar a otra se cierra sola.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null)
  const abierto = abiertoEn === ruta

  const agregar: Contexto['agregar'] = useCallback((item) => {
    const actuales = leer()
    const clave = `${item.slug}::${item.talla}`
    escribir(
      actuales.some((i) => i.clave === clave)
        ? actuales.map((i) => (i.clave === clave ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...actuales, { ...item, clave, cantidad: 1 }],
    )
  }, [])

  const valor = useMemo<Contexto>(
    () => ({
      items,
      cantidad: items.reduce((n, i) => n + i.cantidad, 0),
      subtotal: items.reduce((n, i) => n + i.cantidad * i.precio, 0),
      abierto,
      abrir: () => setAbiertoEn(ruta),
      cerrar: () => setAbiertoEn(null),
      alternar: () => setAbiertoEn(abierto ? null : ruta),
      agregar,
      cambiarCantidad: (clave, delta) =>
        escribir(
          leer()
            .map((i) => (i.clave === clave ? { ...i, cantidad: i.cantidad + delta } : i))
            .filter((i) => i.cantidad > 0),
        ),
      quitar: (clave) => escribir(leer().filter((i) => i.clave !== clave)),
      vaciar: () => escribir(VACIA),
    }),
    [items, abierto, ruta, agregar],
  )

  return <CarritoCtx.Provider value={valor}>{children}</CarritoCtx.Provider>
}

export function useCarrito() {
  const ctx = useContext(CarritoCtx)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return ctx
}
