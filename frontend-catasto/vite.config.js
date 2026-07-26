// Updated config to force reload
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api/icar-manifest': {
        target: 'https://archiviodigitale-icar.cultura.gov.it',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/icar-manifest\/(.*)/, '/metadata/$1/manifest.json?type=archive')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@catasto/shared': path.resolve(import.meta.dirname, '../packages/shared/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
  },
})