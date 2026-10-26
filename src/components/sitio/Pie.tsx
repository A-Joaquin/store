import Link from 'next/link'

import { MARCA } from '@/lib/sitio'
import { PIE_INFO, PIE_LEGAL } from '@/lib/navegacion'

import c from './Cabecera.module.css'
import { Instagram, TikTok, WhatsApp } from './Iconos'
import { Newsletter } from './Newsletter'
import s from './Pie.module.css'

type Props = {
  redes: { instagram?: string | null; tiktok?: string | null; whatsapp?: string | null }
}

export function Pie({ redes }: Props) {
  const lista = [
    { texto: 'INSTAGRAM', href: redes.instagram, Icono: Instagram },
    { texto: 'TIKTOK', href: redes.tiktok, Icono: TikTok },
    { texto: 'WHATSAPP', href: redes.whatsapp, Icono: WhatsApp },
  ]
  return (
    <footer className={s.pie}>
      <div className={s.fila}>
        <Newsletter />
        <div className={s.menus}>
          <ul className={s.info}>
            {PIE_INFO.map((e) => (
              <li key={e.texto}>
                <Link href={e.href} className={c.tachado}>
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
          <ul className={s.legal}>
            {PIE_LEGAL.map((e) => (
              <li key={e.texto}>
                <Link href={e.href} className={c.tachado}>
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
          <ul className={s.redes}>
            {lista.map(({ texto, href, Icono }) => (
              <li key={texto}>
                <a href={href || '#'} target="_blank" rel="noopener noreferrer" aria-label={texto}>
                  <Icono />
                  <span className={c.tachado}>{texto}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={s.fila}>
        <Link href="/" className={s.logo} aria-label={`${MARCA}, inicio`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/wordmark-negro.svg" alt={MARCA} width={160} height={48} />
        </Link>
        <p className={s.copy}>
          © {new Date().getFullYear()} {MARCA} STUDIOS
        </p>
      </div>
    </footer>
  )
}
