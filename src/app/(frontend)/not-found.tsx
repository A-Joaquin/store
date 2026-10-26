import Link from 'next/link'

export default function NoEncontrado() {
  return (
    <section className="no-encontrado">
      <h1>No encontramos esta página</h1>
      <p>Puede que la prenda ya no esté disponible.</p>
      <Link href="/" className="boton">
        Volver a la tienda
      </Link>
    </section>
  )
}
