import { defineConfig } from 'vite';
import { VitePWA }     from 'vite-plugin-pwa';
import mkcert          from 'vite-plugin-mkcert';
 
export default defineConfig({
  publicDir: 'public',
 
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('src/modules/map.js'))     return 'map';
          if (id.includes('src/modules/camera.js'))  return 'camera';
          if (id.includes('src/modules/storage.js')) return 'storage';
        },
      },
    },
  },
 
  server: {
    https: true,  // mkcert genera el certificat automàticament
    host:  true,  // Exposa a la xarxa local per provar al mòbil
    port:  3000,
  },
 
  plugins: [
    mkcert(), // Certificat SSL de confiança per a HTTPS local
 
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
 
      manifest: {
        name:             'On he aparcat?',
        short_name:       'Parking',
        description:      'Guarda on has aparcat el cotxe amb ubicació i foto',
        start_url:        '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#0a0f1e',
        theme_color:      '#0a0f1e',
        lang:             'ca',
        icons: [
          {
            src:     'icons/icon-192.png',
            sizes:   '192x192',
            type:    'image/png',
            purpose: 'any maskable',
          },
          {
            src:     'icons/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name:        'Guardar aparcament',
            short_name:  'Aparcar',
            description: 'Guarda la ubicació actual',
            url:         '/?tab=map',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        categories: ['navigation', 'utilities'],
        screenshots: [
          {
            src:         'images/screenshot.png',
            type:        'image/png',
            sizes:       '1280x720',
            form_factor: 'wide',
            label:       'Mapa amb aparcament guardat',
          },
        ],
      },
 
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Tiles de OpenStreetMap → Cache First (funciona offline!)
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: {
                maxEntries:    500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dies
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Leaflet CSS/JS des de CDN
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler:    'StaleWhileRevalidate',
            options: {
              cacheName: 'leaflet-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler:    'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
 
      devOptions: {
        enabled: true,
        type:    'module',
      },
    }),
  ],
});