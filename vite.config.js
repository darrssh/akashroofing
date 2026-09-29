import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages + custom domain (akashroofingsolution.com)
// base '/' works for custom domain. For project pages change to '/REPO-NAME/'
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
