import Link from 'next/link'

import { COLUMNAS } from '@/collections/Tipos'
import { CUIDADO, NOTA_MEDIDAS, ORIGEN } from '@/lib/textos'
import { MARCA } from '@/lib/sitio'
import type { Ajustes, Coleccion, Producto, Tipo } from '@/payload-types'

type Props = {
  producto: Producto
  tipo: Tipo | null
  coleccion: Coleccion | null
  ajustes: Ajustes
}

// Los tres acordeones de la ficha del sitio estático: DESCRIPCIÓN (abierto),
// MATERIAL y TALLA. <details> funciona sin JavaScript y con teclado.
export function AcordeonesFicha({ producto, tipo, coleccion, ajustes }: Props) {
  const ficha = ajustes.ficha
  const material = producto.material || tipo?.material
  const cuidado = producto.cuidado || ficha?.cuidado || CUIDADO

  const columnas = (tipo?.columnas ?? []).map((c) => c.nombre).slice(0, COLUMNAS.length)
  // Solo las tallas que tiene esta prenda, en el orden de la tabla del tipo.
  const tallasPrenda = new Set((producto.tallas ?? []).map((t) => t.talla))
  const filas = (tipo?.medidas ?? []).filter((m) => tallasPrenda.size === 0 || tallasPrenda.has(m.talla))

  return (
    <div className="acordeones">
      <details className="acordeon" open>
        <summary>Descripción</summary>
        <p>
          {producto.sku && (
            <>
              <strong>{producto.sku}</strong>
              <br />
            </>
          )}
          {producto.nombre} — {MARCA}
        </p>
        <p>{producto.descripcion}</p>
        <p>
          {coleccion && `Colección ${coleccion.nombre}. `}
          {ficha?.origen || ORIGEN}
        </p>
        {ficha?.enlaceCambios && <Link href={ficha.enlaceCambios}>Cambios y devoluciones</Link>}
      </details>

      <details className="acordeon">
        <summary>Material</summary>
        {material && <p>{material}</p>}
        <p>Color: {producto.color}</p>
        <p>{cuidado}</p>
      </details>

      {columnas.length > 0 && filas.length > 0 && (
        <details className="acordeon" id="guia-tallas">
          <summary>Talla</summary>
          <table className="tabla-medidas">
            <thead>
              <tr>
                <th scope="col">Talla</th>
                {columnas.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.talla}>
                  <th scope="row">{f.talla}</th>
                  {COLUMNAS.slice(0, columnas.length).map((c) => (
                    <td key={c}>{f[c] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tabla-medidas__nota">{tipo?.nota || NOTA_MEDIDAS}</p>
        </details>
      )}
    </div>
  )
}
