'use client'

import { useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

const SITIO = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

// Apartado del pedido en el panel: enlace de seguimiento del cliente, para
// abrirlo, copiarlo o mandárselo por WhatsApp.
export function EnlaceSeguimiento() {
  const seguimiento = useFormFields(([f]) => f.seguimiento?.value as string | undefined)
  const numero = useFormFields(([f]) => f.numero?.value as string | undefined)
  const nombre = useFormFields(([f]) => f.nombre?.value as string | undefined)
  const telefono = useFormFields(([f]) => f.telefono?.value as string | undefined)
  const [copiado, setCopiado] = useState(false)

  if (!seguimiento) {
    return <p style={{ fontSize: 13, opacity: 0.7 }}>El enlace se genera al crear el pedido desde la web.</p>
  }
  const url = `${SITIO}/pedido/${seguimiento}`
  const tel = telefono?.replace(/\D/g, '')
  const mensaje = `Hola ${nombre ?? ''}, puedes ver el estado de tu pedido ${numero ?? ''} aquí: ${url}`
  const boton: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 10px',
    border: '1px solid var(--theme-elevation-250)',
    borderRadius: 4,
    background: 'var(--theme-elevation-50)',
    color: 'inherit',
    fontSize: 12,
    textDecoration: 'none',
    cursor: 'pointer',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Enlace de seguimiento</p>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, wordBreak: 'break-all' }}>
        {url}
      </a>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={boton}>
          Abrir
        </a>
        <button
          type="button"
          style={boton}
          onClick={async () => {
            await navigator.clipboard.writeText(url)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 1500)
          }}
        >
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
        {tel && (
          <a href={`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer" style={boton}>
            Enviar al cliente por WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
