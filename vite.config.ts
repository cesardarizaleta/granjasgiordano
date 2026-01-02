import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1000, // Aumentar límite de advertencia de chunks a 1000 kB
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar dependencias grandes en chunks separados
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-dropdown-menu"],
          supabase: ["@supabase/supabase-js"],
          charts: ["recharts"],
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Aumentar límite a 5 MiB
        // Configurar estrategias de cache para diferentes tipos de recursos
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
        ],
      },
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "masked-icon.svg",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "logo.jpg"
      ],
      manifest: {
        name: "La Zulianita - Sistema de Gestión",
        short_name: "La Zulianita",
        description: "Sistema de gestión integral para La Zulianita - Inventario, Ventas, Clientes y Cobranza",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        lang: "es",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "favicon.ico",
            sizes: "48x48",
            type: "image/x-icon",
            purpose: "any",
          },
        ],
        screenshots: [
          {
            src: "placeholder.svg",
            sizes: "1280x720",
            type: "image/svg+xml",
            form_factor: "wide",
            label: "Dashboard principal del sistema",
          },
        ],
      },
      devOptions: {
        enabled: mode === "development",
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["zustand", "react", "react-dom"],
  },
}));
