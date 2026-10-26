import { rutasListado } from '@/components/catalogo/rutasListado'

const { primera } = rutasListado('coleccion')

export const generateStaticParams = primera.generateStaticParams
export const generateMetadata = primera.generateMetadata
export default primera.Pagina
