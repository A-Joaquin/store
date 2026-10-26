'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useCarrito } from '@/components/carrito/Carrito'
import { INFORMACION, MENU_PRINCIPAL, PRENDAS, type PrendaMenu } from '@/lib/navegacion'
import { rutaColeccion, rutaProducto } from '@/lib/sitio'
import { useMagnetico } from '@/lib/useMagnetico'

import s from './Cabecera.module.css'
import { Instagram, TikTok, WhatsApp } from './Iconos'
import { useMenuMovil } from './MenuMovil'

type Coleccion = { nombre: string; slug: string }
type Columna = 'colecciones' | 'prendas' | 'whatice'

type Props = {
  colecciones: Coleccion[]
  prendas: PrendaMenu[]
  // Prenda del recuadro del mega menú antes de pasar por ningún enlace.
  destacada: PrendaMenu | null
  redes: { instagram?: string | null; tiktok?: string | null; whatsapp?: string | null }
}

const ESCRITORIO = '(min-width: 813px)'

// Prenda al azar que cumpla el filtro, distinta de la que ya se muestra.
function elegir(prendas: PrendaMenu[], filtro: (p: PrendaMenu) => boolean, actual?: string) {
  let opciones = prendas.filter((p) => filtro(p) && p.imagen)
  if (opciones.length > 1) opciones = opciones.filter((p) => p.slug !== actual)
  return opciones[Math.floor(Math.random() * opciones.length)]
}

export function Cabecera({ colecciones, prendas, destacada, redes }: Props) {
  const ruta = usePathname()
  const carrito = useCarrito()
  const menuMovil = useMenuMovil()
  const [pequena, setPequena] = useState(false)
  // Panel y mega menú guardan la página donde se abrieron: al navegar a otra
  // quedan cerrados sin tener que reaccionar al cambio de ruta.
  const [panelEn, setPanelEn] = useState<string | null>(null)
  const [megaEn, setMegaEn] = useState<{ ruta: string; col: Columna } | null>(null)
  const panel = panelEn === ruta
  const mega = megaEn?.ruta === ruta ? megaEn.col : null
  const setPanel = (abrir: boolean | ((a: boolean) => boolean)) =>
    setPanelEn((typeof abrir === 'function' ? abrir(panel) : abrir) ? ruta : null)
  const setMega = useCallback((col: Columna | null) => setMegaEn(col ? { ruta, col } : null), [ruta])
  const megaRef = useRef<HTMLDivElement>(null)
  const [refIman, zonaIman] = useMagnetico<HTMLSpanElement>()
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Logo grande solo arriba del todo; al bajar se achica.
  useEffect(() => {
    const alDesplazar = () => setPequena(window.scrollY > 0)
    alDesplazar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => window.removeEventListener('scroll', alDesplazar)
  }, [])

  // Con el panel abierto la página no se desplaza.
  useEffect(() => {
    if (!panel) return
    document.body.style.overflow = 'hidden'
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setPanelEn(null)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', alTeclear)
    }
  }, [panel])

  // --- Mega menú ----------------------------------------------------------
  const cancelarCierre = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null
  }, [])
  const abrirMega = (col: Columna) => {
    if (!window.matchMedia(ESCRITORIO).matches) return
    cancelarCierre()
    setMega(col)
  }
  const cerrarMega = useCallback(() => {
    cancelarCierre()
    setMega(null)
  }, [cancelarCierre, setMega])

  // La barra se despliega con clip-path y mientras se abre no recibe el mouse
  // en la parte aún recortada: se decide por la posición del puntero contra su
  // caja completa. Dentro sigue abierta; fuera se cierra con un margen corto
  // para que no parpadee.
  useEffect(() => {
    if (!mega) return
    const alMover = (e: MouseEvent) => {
      const caja = megaRef.current?.getBoundingClientRect()
      if (caja && e.clientY <= caja.bottom) cancelarCierre()
      else if (!temporizador.current) temporizador.current = setTimeout(cerrarMega, 180)
    }
    document.addEventListener('mousemove', alMover)
    document.documentElement.addEventListener('mouseleave', cerrarMega)
    return () => {
      document.removeEventListener('mousemove', alMover)
      document.documentElement.removeEventListener('mouseleave', cerrarMega)
    }
  }, [mega, cancelarCierre, cerrarMega])

  // Recuadro destacado: capas que entran una sobre otra.
  const [capas, setCapas] = useState<{ prenda: PrendaMenu; id: number }[]>(
    destacada ? [{ prenda: destacada, id: 0 }] : [],
  )
  const actual = capas.at(-1)?.prenda
  // Antes de pasar por ningún enlace el recuadro invita a la colección de la
  // prenda inicial ("VER TRACK CLUB →"); después, a cada prenda mostrada.
  const inicial = capas.length === 1 && capas[0].id === 0
  const coleccionInicial = colecciones.find((c) => c.slug === actual?.coleccion)
  const destino = inicial && coleccionInicial ? rutaColeccion(coleccionInicial.slug) : actual && rutaProducto(actual.slug)
  const etiqueta = inicial && coleccionInicial ? `VER ${coleccionInicial.nombre.toUpperCase()}` : actual?.nombre.toUpperCase()
  const mostrar = (filtro: (p: PrendaMenu) => boolean) => {
    const p = elegir(prendas, filtro, actual?.slug)
    if (p) setCapas((c) => [...c, { prenda: p, id: Date.now() }])
  }
  // Al terminar de entrar una capa se quitan solo las que quedaron debajo.
  const alEntrar = (id: number) => setCapas((c) => c.slice(c.findIndex((x) => x.id === id)))

  const clases = [s.cabecera, pequena && s.pequena, panel && s.panelAbierto, mega && s.megaAbierto]
    .filter(Boolean)
    .join(' ')

  const redesLista = [
    { href: redes.instagram, Icono: Instagram, nombre: 'Instagram' },
    { href: redes.tiktok, Icono: TikTok, nombre: 'TikTok' },
    { href: redes.whatsapp, Icono: WhatsApp, nombre: 'WhatsApp' },
  ]

  return (
    <header className={clases}>
      <div className={s.mega} ref={megaRef} aria-hidden={!mega}>
        <div className={s.megaInner}>
          <div className={s.megaMarca}>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
            <img src="/logo-ojo-negro.svg" alt="" width={63} height={72} />
            <p>
              Preludio a la ropa
              <br />
              en Latinoamérica.
            </p>
          </div>
          <div className={`${s.megaCol} ${mega === 'colecciones' ? s.megaColActiva : ''}`}>
            <p className={s.megaTitulo}>COLECCIONES</p>
            {colecciones.map((c) => (
              <Link
                key={c.slug}
                href={rutaColeccion(c.slug)}
                onClick={cerrarMega}
                onMouseEnter={() => mostrar((p) => p.coleccion === c.slug)}
                tabIndex={mega ? 0 : -1}
              >
                {c.nombre}
              </Link>
            ))}
          </div>
          <div className={`${s.megaCol} ${mega === 'prendas' ? s.megaColActiva : ''}`}>
            <p className={s.megaTitulo}>PRENDAS</p>
            {PRENDAS.map((e) => (
              <Link
                key={e.texto}
                href={e.href}
                onClick={cerrarMega}
                onMouseEnter={() => mostrar((p) => p.tipo === e.tipo)}
                tabIndex={mega ? 0 : -1}
              >
                {e.texto}
              </Link>
            ))}
          </div>
          <div className={`${s.megaCol} ${mega === 'whatice' ? s.megaColActiva : ''}`}>
            <p className={s.megaTitulo}>WHATICE</p>
            <Link href={MENU_PRINCIPAL[0].href} onClick={cerrarMega} onMouseEnter={() => mostrar(() => true)} tabIndex={mega ? 0 : -1}>
              Nuevo
            </Link>
            <Link href="/#manifiesto" onClick={cerrarMega} tabIndex={mega ? 0 : -1}>
              Manifiesto
            </Link>
            <Link href={INFORMACION[1].href} onClick={cerrarMega} tabIndex={mega ? 0 : -1}>
              Guía de tallas
            </Link>
            <Link href={INFORMACION[2].href} onClick={cerrarMega} tabIndex={mega ? 0 : -1}>
              Envíos y cambios
            </Link>
          </div>
          {actual && destino && (
            <Link className={s.megaDestacado} href={destino} onClick={cerrarMega} tabIndex={mega ? 0 : -1}>
              {capas.map(({ prenda, id }, i) => (
                <span
                  key={id}
                  className={`${s.megaDestacadoImg} ${i > 0 ? s.megaDestacadoEntrando : ''}`}
                  style={{ backgroundImage: `url(${prenda.imagen})` }}
                  onAnimationEnd={() => alEntrar(id)}
                />
              ))}
              <span className={s.megaDestacadoTag}>{etiqueta} →</span>
            </Link>
          )}
        </div>
      </div>

      <div className={s.cabeza}>
        <Link href="/" className={s.logo} aria-label="WHATICE, inicio">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/wordmark-negro.svg" alt="WHATICE" width={190} height={57} />
        </Link>
        <div className={s.envoltura}>
          <button type="button" className={s.bolsaMovil} onClick={carrito.alternar} aria-label={`Bolsa: ${carrito.cantidad}`}>
            BOLSA <span className={s.burbuja}>{carrito.cantidad}</span>
          </button>
          <nav className={s.nav} aria-label="Principal">
            <ul className={s.menu}>
              {MENU_PRINCIPAL.map((e) => (
                <li key={e.texto} onMouseEnter={() => abrirMega(e.columna)}>
                  <Link href={e.href} className={s.tachado} onClick={cerrarMega} onFocus={() => abrirMega(e.columna)}>
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            className={s.hamburguesa}
            aria-label={panel ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={panel}
            {...zonaIman}
            onClick={() => {
              // En móvil la hamburguesa abre el menú a pantalla completa.
              if (window.matchMedia(ESCRITORIO).matches) setPanel((a) => !a)
              else menuMovil.abrir()
            }}
          >
            <span ref={refIman} className={s.icono}>
              <span className={s.cruz} />
            </span>
          </button>
        </div>
      </div>

      <div className={s.fondo} onClick={() => setPanel(false)} />
      <nav className={s.panel} aria-label="Menú" aria-hidden={!panel}>
        <ul className={s.panelArriba}>
          <li>
            <Link href={MENU_PRINCIPAL[0].href} className={s.tachado} tabIndex={panel ? 0 : -1}>
              NUEVO
            </Link>
          </li>
        </ul>
        <p className={s.panelTitulo}>COLECCIONES</p>
        <ul className={s.panelLista}>
          {colecciones.map((c) => (
            <li key={c.slug}>
              <Link href={rutaColeccion(c.slug)} className={s.tachado} tabIndex={panel ? 0 : -1}>
                {c.nombre.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
        <ul className={s.panelInfo}>
          {INFORMACION.map((e) => (
            <li key={e.texto}>
              <Link href={e.href} className={s.tachado} tabIndex={panel ? 0 : -1}>
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>
        <ul className={s.panelRedes}>
          {redesLista.map(({ href, Icono, nombre }) => (
            <li key={nombre}>
              <a href={href || '#'} aria-label={nombre} target="_blank" rel="noopener noreferrer" tabIndex={panel ? 0 : -1}>
                <Icono />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
