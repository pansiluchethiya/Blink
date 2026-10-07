import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['blink.svg', 'icon-192.png', 'icon-512.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        id: 'com.iop.blink',
        name: 'Blink by IOP',
        short_name: 'Blink',
        description: 'Blink by IOP — fast, practical chat for friends and teams.',
        theme_color: '#00D4FF',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['communication', 'social', 'utilities'],
        icons: [
          {
            src: 'blink.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'blink.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'blink.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Open Chats',
            url: '/',
            icons: [{ src: 'blink.svg', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          }
        ]
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    minify: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
