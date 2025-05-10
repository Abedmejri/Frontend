import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // Add this server configuration block
    port: 5173,
    // Optional: open: true // Automatically open browser
  }
})
