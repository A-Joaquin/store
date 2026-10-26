import { rutasListado } from '@/components/catalogo/rutasListado'

const { siguientes } = rutasListado('categoria')

export const generateStaticParams = siguientes.generateStaticParams
export const generateMetadata = siguientes.generateMetadata
export default siguientes.Pagina
