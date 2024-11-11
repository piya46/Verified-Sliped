import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // เปลี่ยนพอร์ตของ Vite เป็น 5173
    proxy: {
      '/check-slip': {
        target: 'http://localhost:3000', // Backend ยังคงอยู่ที่พอร์ต 3000
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
