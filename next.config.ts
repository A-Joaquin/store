import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Direcciones del sitio estático -> nuevas (las genera scripts/migrar-sitio-anterior.ts).
// 301 para no perder los enlaces ya compartidos ni lo que Google tenga indexado.
const archivoRedirecciones = path.resolve(dirname, 'redirecciones-sitio-anterior.json')
const anteriores: Record<string, string> = fs.existsSync(archivoRedirecciones)
  ? JSON.parse(fs.readFileSync(archivoRedirecciones, 'utf8'))
  : {}

const nextConfig: NextConfig = {
  // 404 propia para direcciones sin ruta (hay dos layouts raíz: tienda y panel).
  experimental: {
    globalNotFound: true,
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      ...Object.entries(anteriores).map(([id, slug]) => ({
        source: '/producto.html',
        has: [{ type: 'query' as const, key: 'id', value: id }],
        destination: `/producto/${slug}`,
        permanent: true,
      })),
      { source: '/producto.html', destination: '/', permanent: true },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
