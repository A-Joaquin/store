import { cliente, getStock } from '@/lib/datos'
import { aTarjeta } from '@/lib/tarjeta'

// Tarjetas de varias prendas por su slug (?s=a,b,c), en ese orden. La usa la
// página de favoritos, que vive en el navegador.
export async function GET(req: Request) {
  const slugs = (new URL(req.url).searchParams.get('s') ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => /^[a-z0-9-]{1,120}$/.test(x))
    .slice(0, 100)
  if (slugs.length === 0) return Response.json([])
  const { docs } = await (await cliente()).find({
    collection: 'productos',
    where: { slug: { in: slugs } },
    depth: 1,
    pagination: false,
    overrideAccess: false,
  })
  const stock = await getStock(docs.map((p) => p.id))
  const porSlug = new Map(docs.map((p) => [p.slug, aTarjeta(p, stock)]))
  return Response.json(slugs.flatMap((s) => porSlug.get(s) ?? []), { headers: { 'Cache-Control': 'private, max-age=30' } })
}
