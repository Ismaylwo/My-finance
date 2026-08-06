import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Finance-2.0/',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'recharts-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'lucide-vendor':   ['lucide-react'],
        },
      },
    },
  },
})
