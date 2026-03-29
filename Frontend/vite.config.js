import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["scanalytics.duckdns.org"], 
    // proxy: {
    //   // תיקון עבור ה-Insights - מזהה את הנתיב שהקוד באמת שולח
    //   "/api/insights": {
    //     target: "http://insights_dashboard:8001",
    //     changeOrigin: true,
    //     // אנחנו מורידים את ה- /api/insights כדי שהשרת הפנימי יקבל נתיב נקי
    //     rewrite: (path) => path.replace(/^\/api\/insights/, ""),
    //   },
    //   // תיקון עבור ה-API Gateway (Ingestion)
    //   "/api/ingestion": {
    //     target: "http://api-gateway:8000",
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api\/ingestion/, ""),
    //   },
    //   // כל שאר בקשות ה-API הולכות ל-Backend (Auth וכו')
    //   "/api": {
    //     target: "http://backend:3000",
    //     changeOrigin: true,
    //     // כאן אנחנו לא עושים rewrite כי כנראה ה-Backend מצפה ל- /api
    //   },
    // },
    hmr: {
      clientPort: 443,
    },
  },
});