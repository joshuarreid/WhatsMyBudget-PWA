/// <reference types="node" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const parseAllowedHosts = (raw: string | undefined): string[] | undefined => {
  if (!raw) return undefined
  const hosts = raw
    .split(/[\s,]+/)
    .map((h) => h.trim())
    .filter(Boolean)

  return hosts.length ? hosts : undefined
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'WMB Budget Tracker',
        short_name: 'WMB',
        description: 'Budget tracking and transaction management',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    // Use env vars so we don't hardcode deployment URLs in source.
    //
    // VITE_PREVIEW_ALLOWED_HOSTS: comma- or whitespace-separated hostnames,
    // e.g. "whatsmybudgetpwa-q9rzb.ondigitalocean.app,example.com"
    //
    // If not set, we allow the usual local hosts only.
    allowedHosts:
      parseAllowedHosts(process.env.VITE_PREVIEW_ALLOWED_HOSTS) ??
      parseAllowedHosts(process.env.VITE_ALLOWED_HOSTS) ??
      ['localhost', '127.0.0.1'],
  },
})
