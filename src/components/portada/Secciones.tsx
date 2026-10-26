import s from './Secciones.module.css'

/* eslint-disable @next/next/no-img-element -- todas son SVG estáticos */

export function Divisor({ numero, nombre }: { numero: number; nombre: string }) {
  return (
    <div className={s.divisor} aria-hidden="true">
      <span className={s.divisorTexto}>{String(numero).padStart(2, '0')}</span>
      <span className={s.divisorLinea} />
      <img className={s.divisorMarca} src="/logo-cubo-negro.svg" alt="" width={11} height={34} />
      <span className={s.divisorLinea} />
      <span className={s.divisorTexto}>{nombre.toUpperCase()}</span>
    </div>
  )
}

export function Manifiesto({ texto }: { texto: string }) {
  return (
    <section className={s.manifiesto} id="manifiesto" aria-labelledby="titulo-manifiesto">
      <img className={s.manifiestoFondo} src="/logo-ojo-negro.svg" alt="" width={424} height={486} />
      <p>{texto}</p>
      <h2 id="titulo-manifiesto">MANIFIESTO</h2>
    </section>
  )
}

export function Interludio() {
  return (
    <div className={s.interludio} aria-hidden="true">
      <div className={s.marco}>
        <img className={s.ojo} src="/logo-ojo.svg" alt="" width={312} height={357} />
        <span className={`${s.etiqueta} ${s.arribaIzq}`}>WHATICE STUDIOS</span>
        <span className={`${s.etiqueta} ${s.arribaDer}`}>AW 2026</span>
        <span className={`${s.etiqueta} ${s.abajoIzq}`}>N° 01 — PRELUDIO</span>
        <span className={`${s.etiqueta} ${s.abajoDer}`}>
          <img src="/logo-cubo.svg" alt="" width={6} height={16} />
          LATINOAMÉRICA
        </span>
      </div>
    </div>
  )
}
