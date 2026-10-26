import { revalidatePath } from 'next/cache'

// Las páginas públicas son estáticas; al publicar en el panel se regeneran solo
// las afectadas.
export function revalidar(...rutas: string[]): void {
  for (const ruta of rutas) {
    try {
      revalidatePath(ruta)
    } catch {
      // Fuera de Next.js (scripts de migración, seed) no hay caché que invalidar.
    }
  }
}

// Para cambios que salen en el layout (y por lo tanto en todas las páginas).
export function revalidarTodo(): void {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // Igual que arriba: fuera de Next.js no hay nada que invalidar.
  }
}
