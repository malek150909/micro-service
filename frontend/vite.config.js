import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8085,
    host: true,
    allowedHosts: ["plateform.universitaire"],
  }
})
