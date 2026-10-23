import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ODDLY-ECOMERCE/',
  server: {
    port: 5173
  }
})
