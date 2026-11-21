import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
  resolve: {
    alias: {
      '@': '/src', // 절대경로로 설정 (Vite에선 '/'는 프로젝트 루트)
    },
  },
})
