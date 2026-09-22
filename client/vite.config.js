import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      strategies: "injectManifest",

      srcDir: "src",

      filename: "sw.js",

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      devOptions: {
        enabled: false,
      },

      manifest: {
        name: "Imagify",
        short_name: "Imagify",
        description: "Image processing and optimization platform",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#111827",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  server: {
    host: "0.0.0.0",

    hmr: {
      protocol: "wss",
      host: "imagify.com",
      clientPort: 443,
    },
  },
});
