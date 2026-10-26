// Datos estructurados para Google (resultados enriquecidos: precio, stock, migas).
export function JsonLd({ datos }: { datos: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Escapar "<" evita que un texto con "</script>" cierre la etiqueta.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, '\\u003c') }}
    />
  )
}
