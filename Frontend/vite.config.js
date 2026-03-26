import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// ה-proxy של Vite רץ בתוך container של `frontend` ולכן הוא צריך להגיע לשירות הנכון בתוך הקלאסטר.
// ב-OpenShift: `VITE_INSIGHTS_API_URL` מוגדר כ-`/insights` (כלומר משתמשים ב-proxy).
// ב-docker-compose: ברירת המחדל היא URL מלא ל-`http://localhost:8001` (ולכן ה-proxy לא רלוונטי).
const isInsightsProxyMode = (process.env.VITE_INSIGHTS_API_URL || "").startsWith("/");
const insightsDashboardHost =
  process.env.INSIGHTS_DASHBOARD_HOST ||
  (isInsightsProxyMode ? "insights-dashboard" : "insights_dashboard");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    // פתיחת האפשרות לגשת מכתובות חיצוניות ב-OpenShift
    allowedHosts: ['frontend-yosefshoval-dev.apps.rm2.thpm.p1.openshiftapps.com'], 
    proxy: {
      "/api-gw": {
        target: "http://api-gateway:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-gw/, ""),
      },
      "/insights": {
        target: `http://${insightsDashboardHost}:8001`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/insights/, ""),
      },
      "/api": {
        target: "http://backend:3000",
        changeOrigin: true,
      },
    },
  },
});