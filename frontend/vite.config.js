import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80, // Changed to 80 to match docker-compose internal port
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://backend:5000',
        changeOrigin: true
      }
    }
  }
})
