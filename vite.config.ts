import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this repo at /bali-plan/. In dev we serve from root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/bali-plan/' : '/',
}))
