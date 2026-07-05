import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    
    proxy: {
      "/api": {
        target: "http://api-gateway:8000",
        changeOrigin: true,
      },
    },
    
    hmr: {
      clientPort: 443, // מעולה עבור עבודה תקינה של WebSockets/HMR מאחורי Cloudflare
    },
  },
});