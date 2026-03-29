import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // פותר את השגיאה Blocked request. This host is not allowed
    allowedHosts: ["scanalytics.duckdns.org"], 
    proxy: {
      "/api-gw": {
        target: "http://api-gateway:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-gw/, ""),
      },
      "/insights": {
        target: "http://insights_dashboard:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/insights/, ""),
      },
      "/api": {
        target: "http://backend:3000",
        changeOrigin: true,
      },
    },
    // וודא ש-Vite מבין שהוא רץ מאחורי פרוקסי עבור ה-WebSockets
    hmr: {
      clientPort: 443,
    },
  },
});