import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client and stompjs reference Node's `global` — polyfill for browser
    global: 'globalThis',
  },
})
