import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB — large dictionary chunk
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Poetry Assistant',
        short_name: 'Poetry',
        description: 'A fully offline poetry toolkit: rhyme finder, syllable counter, poetic thesaurus, and poem workshop.',
        theme_color: '#1a1209',
        background_color: '#f5f0e8',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        id: 'poetry-assistant',
        categories: ['education', 'productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          {
            src: 'pwa-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-1.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Rhyme Finder'
          },
          {
            src: 'screenshot-2.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Poetic Thesaurus'
          }
        ],
        shortcuts: [
          {
            name: 'Rhyme Finder',
            short_name: 'Rhymes',
            description: 'Find perfect, near, and slant rhymes',
            url: './?tab=rhymes',
            icons: [{ src: 'pwa-96.png', sizes: '96x96' }]
          },
          {
            name: 'Syllable Counter',
            short_name: 'Syllables',
            description: 'Count syllables in your verses',
            url: './?tab=syllables',
            icons: [{ src: 'pwa-96.png', sizes: '96x96' }]
          },
          {
            name: 'Poetic Thesaurus',
            short_name: 'Thesaurus',
            description: 'Find poetic synonyms',
            url: './?tab=thesaurus',
            icons: [{ src: 'pwa-96.png', sizes: '96x96' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 20000, // suppress warning for large dictionary chunk
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put the big 60K-word dictionary in its own lazy-loadable chunk
          if (id.includes('dictionary-data')) return 'dictionary'
          // Bundle React and other heavy vendor libs together
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
});
