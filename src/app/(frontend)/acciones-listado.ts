'use server'

import { EN_PORTADA, prendasPaginadas } from '@/lib/listados'

// Página n de una colección para los bloques de la portada (paginación en el lugar).
export async function paginaDeColeccion(coleccionId: number, pagina: number) {
  if (!Number.isInteger(coleccionId) || !Number.isInteger(pagina) || pagina < 1) return null
  return prendasPaginadas({ coleccion: coleccionId }, pagina, EN_PORTADA)
}
