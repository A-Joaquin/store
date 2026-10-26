import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Clientes } from './collections/Clientes'
import { Colecciones } from './collections/Colecciones'
import { Inventario } from './collections/Inventario'
import { Media } from './collections/Media'
import { Pedidos } from './collections/Pedidos'
import { Productos } from './collections/Productos'
import { Tipos } from './collections/Tipos'
import { Users } from './collections/Users'
import { Ajustes } from './globals/Ajustes'
import { Portada } from './globals/Portada'
import { MARCA, SITE_URL, rutaCategoria, rutaColeccion, rutaProducto } from './lib/sitio'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Sin credenciales de R2 (desarrollo) las imágenes se guardan en ./media.
const usarR2 = Boolean(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID)
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')

const primeraImagen = (galeria: unknown) => {
  const primera = Array.isArray(galeria) ? galeria[0] : undefined
  return primera && typeof primera === 'object' ? primera.id : primera
}

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      // Resumen de ventas en el inicio del panel.
      beforeDashboard: ['@/components/admin/ResumenVentas#ResumenVentas'],
    },
    meta: {
      titleSuffix: ` · ${MARCA}`,
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  collections: [Productos, Colecciones, Tipos, Inventario, Pedidos, Clientes, Media, Users],
  globals: [Portada, Ajustes],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ['productos', 'colecciones', 'tipos'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc, collectionSlug }) =>
        `${collectionSlug === 'tipos' ? (doc?.categoria ?? doc?.nombre ?? '') : (doc?.nombre ?? '')} | ${MARCA}`,
      generateDescription: ({ doc }) => String(doc?.descripcion ?? '').slice(0, 155),
      generateImage: ({ doc }) => primeraImagen(doc?.galeria ?? [doc?.imagen]),
      generateURL: ({ doc, collectionSlug }) =>
        SITE_URL +
        (collectionSlug === 'colecciones'
          ? rutaColeccion(doc?.slug ?? '')
          : collectionSlug === 'tipos'
            ? rutaCategoria(doc?.slug ?? '')
            : rutaProducto(doc?.slug ?? '')),
    }),
    s3Storage({
      enabled: usarR2,
      collections: {
        media: R2_PUBLIC_URL
          ? {
              // Las fotos se sirven directo desde la CDN de Cloudflare, sin pasar por el servidor.
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename, prefix }) =>
                [R2_PUBLIC_URL, prefix, filename].filter(Boolean).join('/'),
            }
          : true,
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: process.env.R2_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
