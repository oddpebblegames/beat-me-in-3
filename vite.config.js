import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/beat-me-in-3/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/analytics'],
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache' },
          },
        ],
      },
      manifest: {
        name: 'Beat Me in 3',
        short_name: 'BM3',
        description: 'Guess the number in 3 tries. Daily challenge, global leaderboard.',
        theme_color: '#1a3fa8',
        background_color: '#0d0d1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/beat-me-in-3/',
        icons: [
          { src: '/beat-me-in-3/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/beat-me-in-3/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/game/**', 'src/utils/**', 'src/state/**'],
    },
  },
});
