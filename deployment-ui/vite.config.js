import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5279',
        changeOrigin: true
      },
      // The three sample services this portal deploys — proxied under
      // their own path prefix (stripped before forwarding, since each
      // service's own routes already start with /api/...) so the browser
      // never makes a cross-origin request and none of them need CORS
      // configured, same reasoning as the main /api proxy above.
      '/admin-api': {
        target: 'http://localhost:5274',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin-api/, '')
      },
      '/pmscore-api': {
        target: 'http://localhost:5116',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pmscore-api/, '')
      },
      '/security-api': {
        target: 'http://localhost:5159',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/security-api/, '')
      }
    }
  }
})
