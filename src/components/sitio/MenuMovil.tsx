'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'


import { useCarrito } from '@/components/carrito/Carrito'
import { precioBs } from '@/lib/formato'
import { INFORMACION, MENU_PRINCIPAL, PRENDAS, TAGLINE, type PrendaMenu } from '@/lib/navegacion'
import { rutaColeccion, rutaProducto } from '@/lib/sitio'

import s from './MenuMovil.module.css'

type Estado = { abierto: boolean; semilla: number; abrir: () => void; cerrar: () => void }
const Ctx = createContext<Estado | null>(null)

export function MenuMovilProvider({ children }: { children: React.ReactNode }) {
  const ruta = usePathname()
  // Se guarda en qué página se abrió: al navegar a otra se cierra solo.
  // La semilla elige una prenda destacada distinta en cada apertura.
  const [apertura, setApertura] = useState<{ ruta: string; semilla: number } | null>(null)
  const abierto = apertura?.ruta === ruta
  const valor = useMemo(
    () => ({
      abierto,
      semilla: apertura?.semilla ?? 0,
      abrir: () => setApertura({ ruta, semilla: Math.random() }),
      cerrar: () => setApertura(null),
    }),
    [abierto, apertura, ruta],
  )
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useMenuMovil() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMenuMovil debe usarse dentro de <MenuMovilProvider>')
  return ctx
}

type Props = {
  colecciones: { nombre: string; slug: string }[]
  prendas: PrendaMenu[]
  redes: { instagram?: string | null; tiktok?: string | null; whatsapp?: string | null }
}

export function MenuMovil({ colecciones, prendas, redes }: Props) {
  const { abierto, semilla, cerrar } = useMenuMovil()
  const carrito = useCarrito()

  // Cada apertura trae una semilla nueva: una prenda destacada distinta.
  const conFoto = prendas.filter((p) => p.imagen)
  const destacada = conFoto[Math.floor(semilla * conFoto.length)] ?? null

  useEffect(() => {
    if (!abierto) return
    document.documentElement.style.overflow = 'hidden'
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    const escritorio = window.matchMedia('(min-width: 813px)')
    escritorio.addEventListener('change', cerrar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.documentElement.style.overflow = ''
      document.removeEventListener('keydown', alTeclear)
      escritorio.removeEventListener('change', cerrar)
    }
  }, [abierto, cerrar])

  const tab = abierto ? 0 : -1

  return (
    <div className={`${s.menu} ${abierto ? s.abierto : ''}`} aria-hidden={!abierto} role="dialog" aria-label="Menú">
      <div className={s.arriba}>
        <Link className={s.logo} href="/" tabIndex={tab}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/wordmark-negro.svg" alt="WHATICE" width={130} height={39} />
        </Link>
        <button type="button" className={s.cerrar} onClick={cerrar} aria-label="Cerrar menú" tabIndex={tab}>
          CERRAR<span />
        </button>
      </div>

      <nav className={s.nav} aria-label="Menú móvil">
        <p className={s.titulo} style={{ '--i': 1 } as React.CSSProperties}>
          COLECCIONES
        </p>
        {colecciones.map((c, i) => (
          <Link key={c.slug} className={s.grande} style={{ '--i': i + 2 } as React.CSSProperties} href={rutaColeccion(c.slug)} tabIndex={tab}>
            {c.nombre}
          </Link>
        ))}
        <p className={s.titulo} style={{ '--i': 5 } as React.CSSProperties}>
          PRENDAS
        </p>
        <div className={s.fila} style={{ '--i': 6 } as React.CSSProperties}>
          {PRENDAS.map((e) => (
            <Link key={e.texto} href={e.href} tabIndex={tab}>
              {e.texto}
            </Link>
          ))}
        </div>
      </nav>

      {destacada && (
        <Link className={s.destacado} style={{ '--i': 7 } as React.CSSProperties} href={rutaProducto(destacada.slug)} tabIndex={tab}>
          <span className={s.destacadoImg} style={{ backgroundImage: `url(${destacada.imagen})` }} />
          <span className={s.destacadoTxt}>
            <small>DESTACADO</small>
            <strong>{destacada.nombre}</strong>
            <em>{precioBs(destacada.precio)}</em>
          </span>
        </Link>
      )}

      <ul className={s.enlaces} style={{ '--i': 8 } as React.CSSProperties}>
        <li>
          <Link href={MENU_PRINCIPAL[0].href} tabIndex={tab}>
            NUEVO
          </Link>
        </li>
        {INFORMACION.map((e) => (
          <li key={e.texto}>
            <Link href={e.href} tabIndex={tab}>
              {e.texto}
            </Link>
          </li>
        ))}
      </ul>

      <div className={s.cuenta} style={{ '--i': 9 } as React.CSSProperties}>
        <button
          type="button"
          className={s.bolsa}
          tabIndex={tab}
          onClick={() => {
            cerrar()
            carrito.abrir()
          }}
        >
          BOLSA ({carrito.cantidad})
        </button>
        <a href="#" tabIndex={tab}>
          FAVORITOS
        </a>
        <a href="#" tabIndex={tab}>
          CUENTA
        </a>
      </div>

      <div className={s.pie} style={{ '--i': 10 } as React.CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
        <img src="/logo-ojo-negro.svg" alt="" width={35} height={40} />
        <p>{TAGLINE}</p>
        <div className={s.redes}>
          <a href={redes.instagram || '#'} tabIndex={tab}>
            INSTAGRAM
          </a>
          <a href={redes.tiktok || '#'} tabIndex={tab}>
            TIKTOK
          </a>
          <a href={redes.whatsapp || '#'} tabIndex={tab}>
            WHATSAPP
          </a>
        </div>
      </div>
    </div>
  )
}
