import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png'],
      manifest: {
        name: 'MusicScan - Hét Muziekplatform',
        short_name: 'MusicScan',
        description: 'Muzieknieuws, verhalen, shop, quiz & smart scanner voor vinyl en CD collecties',
        theme_color: '#8b5cf6',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['music', 'entertainment', 'shopping'],
        lang: 'nl'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ssxbpyqnjfiyubsuonar\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            urlPattern: /^https:\/\/i\.discogs\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'discogs-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/i\.scdn\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'spotify-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI library chunks
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip'
          ],
          // Utility chunks
          'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns'],
          // Animation chunks (loaded on demand)
          'vendor-motion': ['framer-motion'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Charts (heavy, loaded on demand)
          'vendor-charts': ['recharts'],
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : []
      }
    },
    chunkSizeWarningLimit: 600
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: []
  }
}));
