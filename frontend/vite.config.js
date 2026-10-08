import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['blink.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: 'com.iop.blink',
        name: 'Blink by IOP',
        short_name: 'Blink',
        description: 'Blink by IOP — fast, practical chat for friends and teams.',
        lang: 'en-US',
        dir: 'ltr',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'tabbed'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['communication', 'social', 'utilities'],
        prefer_related_applications: false,
        launch_handler: {
          client_mode: 'focus-existing',
        },
        edge_side_panel: {
          preferred_width: 400,
        },
        // Local-only quick notes (no backend): see NotesPage + db.notes.
        note_taking: {
          new_note_url: '/notes',
        },
        protocol_handlers: [
          {
            protocol: 'web+blink',
            url: '/protocol?url=%s',
          },
        ],
        file_handlers: [
          {
            action: '/share',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
              'video/*': ['.mp4', '.webm', '.mov'],
            },
          },
        ],
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'files',
                accept: ['image/*', 'video/*'],
              },
            ],
          },
        },
        widgets: [
          {
            name: 'Recent chats',
            description: 'Unread counts and recent conversations in Blink.',
            tag: 'blink-recent',
            template: 'widgets/recent-chats.html',
            data: '/api/widgets/recent',
            type: 'application/json',
            auth: true,
            update: 900,
            screenshots: [
              {
                src: 'widgets/recent-chats-preview.png',
                sizes: '400x300',
                label: 'Recent chats widget',
              },
            ],
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: 'screenshots/chat-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Blink chats on desktop',
          },
          {
            src: 'screenshots/chat-narrow.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Blink chats on mobile',
          },
        ],
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
            src: 'icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Open Chats',
            url: '/',
            icons: [{ src: 'blink.svg', sizes: '192x192' }]
          },
          {
            name: 'Settings',
            url: '/settings',
            icons: [{ src: 'blink.svg', sizes: '192x192' }]
          },
          {
            name: 'New Note',
            url: '/notes',
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
