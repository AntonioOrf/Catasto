import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
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
