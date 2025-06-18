import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    global: 'window',
    'process.env.NODE_ENV': '"development"'
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser'
    }
  }
})