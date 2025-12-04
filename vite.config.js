import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically handles SPA routing in dev mode
  // For production, use server configuration files (vercel.json, netlify.toml, _redirects)
})
