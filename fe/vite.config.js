import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: false,
    allowedHosts: ['https://771ccd1db6bc.ngrok-free.app']
  }
})
