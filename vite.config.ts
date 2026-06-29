import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this repo at /Bali-Plan/ (case-sensitive, must match the repo
// name exactly). In dev we serve from root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Bali-Plan/' : '/',
}))
