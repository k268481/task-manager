import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages はサブパス配信になるため base を設定
  base: '/task-manager/',
  plugins: [react()],
})
