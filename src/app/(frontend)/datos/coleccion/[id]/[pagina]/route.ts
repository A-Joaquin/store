import { cliente } from '@/lib/datos'
import { EN_PORTADA, prendasPaginadas } from '@/lib/listados'

// Página n de una colección para los bloques de la portada, como JSON
// estático: se genera al compilar (o en la primera visita) y se sirve desde
// caché, sin consultar la base en cada clic. Se renueva cada minuto.
export const revalidate = 60

export async function generateStaticParams() {
  const payload = await cliente()
  const { docs } = await payload.find({ collection: 'colecciones', pagination: false, overrideAccess: false, select: { slug: true } })
  const salida: { id: string; pagina: string }[] = []
  for (const c of docs) {
    const total = (await payload.count({ collection: 'productos', where: { coleccion: { equals: c.id } }, overrideAccess: false })).totalDocs
    for (let n = 2; n <= Math.ceil(total / EN_PORTADA); n++) salida.push({ id: String(c.id), pagina: String(n) })
  }
  return salida
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; pagina: string }> }) {
  const { id, pagina } = await params
  const n = Number(pagina)
  if (!/^\d+$/.test(id) || !Number.isInteger(n) || n < 1) return Response.json(null, { status: 404 })
  const r = await prendasPaginadas({ coleccion: Number(id) }, n, EN_PORTADA)
  if (n > r.totalPaginas) return Response.json(null, { status: 404 })
  return Response.json(r)
}
