import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client'],
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
      output: {
         manualChunks: {
           vendor: ['react', 'react-dom', 'react-dom/client'],
           supabase: ['@supabase/supabase-js'],
           ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
           wallet: ['@solana/wallet-adapter-react', '@tonconnect/ui-react'],
           web3: ['@solana/web3.js', 'ethers'],
           utils: ['framer-motion', 'react-router-dom', 'react-hot-toast'],
         },
       },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    cors: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
  },
})
