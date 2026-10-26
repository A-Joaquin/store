'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import s from './Hero.module.css'
import { DURACION_TRANSICION, HeroWebgl } from './heroWebgl'

export type FotoHero = { src: string; srcMovil: string | null; alt: string }
export type SlideHero = { foto: FotoHero; enlace: string | null }

type Props = {
  slides: SlideHero[]
  // Primera foto ya renderizada en el servidor (<picture> prioritario).
  children: React.ReactNode
}

const MOVIL = '(max-width: 812px)'

const cargar = (src: string) =>
  new Promise<HTMLImageElement>((ok, mal) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => ok(img)
    img.onerror = mal
    img.src = src
  })

export function HeroSlider({ slides, children }: Props) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const motor = useRef<HeroWebgl | null>(null)
  const bloqueado = useRef(false)
  const [actual, setActual] = useState(0)
  const [canvasListo, setCanvasListo] = useState(false)
  const [sinWebgl, setSinWebgl] = useState(false)
  // Cambia en cada slide para reiniciar la animación de la barra.
  const [vuelta, setVuelta] = useState(0)
  const [enviado, setEnviado] = useState(false)
  const total = slides.length

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || total === 0) return
    const movil = window.matchMedia(MOVIL).matches
    let m: HeroWebgl
    try {
      m = new HeroWebgl(canvas, movil ? { ancho: 750, alto: 1104 } : { ancho: 2000, alto: 1000 })
    } catch (e) {
      // Navegador sin WebGL: queda el respaldo con fundido simple.
      console.warn('Hero: sin WebGL, se usa el fundido simple.', e)
      queueMicrotask(() => setSinWebgl(true))
      return
    }
    motor.current = m
    let vivo = true

    const fuente = (i: number) => (movil && slides[i].foto.srcMovil) || slides[i].foto.src
    Promise.all([cargar('/mascara-hero.png'), cargar(fuente(0))])
      .then(([mascara, primera]) => {
        if (!vivo) return
        m.ponerMascara(mascara)
        m.ponerFoto(0, primera)
        setCanvasListo(true)
        // El resto de las fotos, después de la primera (no compiten con el LCP).
        slides.slice(1).forEach((_, j) =>
          cargar(fuente(j + 1))
            .then((img) => vivo && m.ponerFoto(j + 1, img))
            .catch(() => {}),
        )
      })
      .catch((e) => {
        console.warn('Hero: no cargaron las imágenes del slider, se usa el fundido simple.', e)
        if (vivo) setSinWebgl(true)
      })

    return () => {
      vivo = false
      m.destruir()
      motor.current = null
    }
  }, [slides, total])

  const ir = (destino: number, haciaAdelante: boolean) => {
    if (bloqueado.current || total < 2) return
    const d = (destino + total) % total
    if (motor.current && !motor.current.listo(d)) return
    bloqueado.current = true
    setTimeout(() => (bloqueado.current = false), DURACION_TRANSICION)
    motor.current?.ir(d, haciaAdelante)
    setActual(d)
    setVuelta((v) => v + 1)
  }
  const siguiente = () => ir(actual + 1, true)
  const anterior = () => ir(actual - 1, false)

  // Como el sitio estático: arrastrar (mouse o dedo) más de 10 px cambia de
  // foto con la transición; un clic sin arrastre lleva al enlace del slide.
  const arrastre = useRef<{ x: number; dx: number } | null>(null)

  if (total === 0) return null
  const enlace = slides[actual].enlace

  return (
    <section className={s.hero} aria-roledescription="carrusel" aria-label="Campaña">
      <div
        className={s.fotos}
        // Foto del slide actual: el header la usa para decidir si va en blanco.
        data-fuente={slides[actual].foto.src}
        data-fuente-movil={slides[actual].foto.srcMovil ?? undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          arrastre.current = { x: e.clientX, dx: 0 }
        }}
        onPointerMove={(e) => {
          if (arrastre.current) arrastre.current.dx = e.clientX - arrastre.current.x
        }}
        onPointerUp={() => {
          const a = arrastre.current
          arrastre.current = null
          if (!a) return
          if (a.dx > 10) anterior()
          else if (a.dx < -10) siguiente()
          else if (enlace) router.push(enlace)
        }}
        onPointerCancel={() => (arrastre.current = null)}
        onPointerLeave={() => (arrastre.current = null)}
      >
        {sinWebgl
          ? slides.map((sl, i) =>
              i === 0 ? (
                <div key={i} className={`${s.respaldo} ${actual === 0 ? s.respaldoActivo : ''}`}>
                  {children}
                </div>
              ) : (
                <picture key={i} className={`${s.respaldo} ${actual === i ? s.respaldoActivo : ''}`}>
                  {sl.foto.srcMovil && <source media={MOVIL} srcSet={sl.foto.srcMovil} />}
                  <img src={sl.foto.src} alt={sl.foto.alt} loading="lazy" />
                </picture>
              ),
            )
          : children}
        <canvas ref={canvasRef} className={`${s.canvas} ${canvasListo ? s.canvasListo : ''}`} aria-hidden="true" />
      </div>

      <div className={s.news}>
        {enviado ? (
          <p className={s.newsGracias}>¡Gracias!</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setEnviado(true)
            }}
          >
            <input type="email" name="email" placeholder="Únete a la lista" aria-label="Tu correo" required autoComplete="email" />
            <button type="submit">ENTRAR</button>
          </form>
        )}
      </div>

      <div className={s.herramientas}>
        <div className={s.barra}>
          <div key={vuelta} className={`${s.barraRelleno} ${canvasListo || sinWebgl ? s.barraCorriendo : ''}`} onAnimationEnd={siguiente} />
        </div>
        <div className={s.contador} aria-live="polite">
          <div className={s.contadorVentana}>
            <div className={s.contadorLista} style={{ transform: `translateY(${-12 * actual}px)` }}>
              {slides.map((_, i) => (
                <span key={i}>{String(i + 1).padStart(2, '0')}</span>
              ))}
            </div>
          </div>
          <span className={s.contadorBarra}>/</span>
          <span>{String(total).padStart(2, '0')}</span>
        </div>
        <button type="button" className={`${s.flecha} ${s.anterior}`} onClick={anterior} aria-label="Slide anterior">
          <span />
        </button>
        <button type="button" className={`${s.flecha} ${s.siguiente}`} onClick={siguiente} aria-label="Slide siguiente">
          <span />
        </button>
      </div>
    </section>
  )
}
