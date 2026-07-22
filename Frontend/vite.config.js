import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Derive the API base (strip /api suffix to get origin for the proxy)
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api'
  const proxyTarget = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000'
  const isHttps = proxyTarget.startsWith('https')

  return {
    plugins: [react(), tailwindcss()],

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Vite 8 uses rolldown — manualChunks must be a function
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react';
            }
            if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
              return 'router';
            }
            if (id.includes('node_modules/recharts/')) {
              return 'charts';
            }
            if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/react-icons/')) {
              return 'ui';
            }
          }
        }
      }
    },

    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: isHttps,
        }
      }
    },

    preview: {
      port: 4173,
    }
  }
})