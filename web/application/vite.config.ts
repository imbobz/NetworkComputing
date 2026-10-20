import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Caméra',
        short_name: 'Caméra',
        description: 'Aperçu de caméra en direct',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0b0d12',
        theme_color: '#0b0d12',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Permet de tester l'installation avec `npm run dev`.
      devOptions: { enabled: true },
    }),
  ],
  server: {
    host: true, // accessible depuis le téléphone sur le réseau local
    allowedHosts: true, // nécessaire derrière un tunnel (cloudflared, ngrok)
  },
})
