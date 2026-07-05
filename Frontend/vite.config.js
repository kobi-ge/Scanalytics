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
      // 1. ניתוב עבור ה-Insights (שים לב לשם הקונטיינר המדויק עם אותיות גדולות)
      "/api/insights": {
        target: "http://InsightsDashboard:8001", // ודא שהסרוויס מאזין בפנים על 8001
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/insights/, ""),
      },
      
      // 2. ניתוב עבור ה-API Gateway (Ingestion)
      "/api/ingestion": {
        target: "http://api-gateway:8000",
        changeOrigin: true,
        // לא עושים rewrite כדי שה-Gateway ידע שמדובר בבקשת ingestion
      },
      
      // 3. כל שאר בקשות ה-API הולכות ל-Backend (Auth וכו')
      "/api": {
        target: "http://backend:3000",
        changeOrigin: true,
      },
    },
    
    hmr: {
      clientPort: 443, // מעולה עבור עבודה תקינה של WebSockets/HMR מאחורי Cloudflare
    },
  },
});