// Íconos propios (trazo simple), del tamaño de los del sitio estático.
type P = { className?: string }

export const Lupa = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6">
    <circle cx="9.6" cy="9.6" r="7.2" />
    <path d="M15 15l7.2 7.2" strokeLinecap="round" />
  </svg>
)

export const Instagram = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.4" />
    <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

export const TikTok = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.4 6.4 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.4 1.3V6.5a4.5 4.5 0 0 1-4.4-4.5z" />
  </svg>
)

export const WhatsApp = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path d="M3.3 20.7l1.3-4.4A9 9 0 1 1 8 19.6z" strokeLinejoin="round" />
    <path
      d="M9 8.2c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.5 2.4.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 .9-.6 1.8-1.7 1.9-1.4.1-3.6-.8-5.3-2.6-1.6-1.7-2.2-3.4-1.9-4.4z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
)

export const Sobre = ({ className }: P) => (
  <svg className={className} viewBox="0 0 17 9" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="0.5" y="0.5" width="16" height="8" />
    <path d="M0.5 0.5l8 5 8-5" />
  </svg>
)

export const BolsaIcono = ({ className }: P) => (
  <svg className={className} viewBox="0 0 30 30" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M7.5 10.5h15l1 15.5h-17z" strokeLinejoin="round" />
    <path d="M11.5 13V8.5a3.5 3.5 0 0 1 7 0V13" />
  </svg>
)

export const Regla = ({ className }: P) => (
  <svg className={className} viewBox="0 0 30 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="3" y="6" width="24" height="9" rx="1" />
    <path d="M7 6v4M11 6v3M15 6v4M19 6v3M23 6v4" />
  </svg>
)

export const Flecha = ({ className }: P) => (
  <svg className={className} viewBox="0 0 15 10" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M0 5h13.5M9.5 1.5L13.5 5l-4 3.5" />
  </svg>
)
