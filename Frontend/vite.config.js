import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// ה-proxy של Vite רץ בתוך container של `frontend` ולכן הוא צריך להגיע לשירות הנכון בתוך הקלאסטר.
// ב-docker-compose השירות נקרא `insights_dashboard`, בעוד שב-OpenShift ה-Service נקרא `insights-dashboard`.
const insightsDashboardHost =
  process.env.INSIGHTS_DASHBOARD_HOST ||
  (process.env.KUBERNETES_SERVICE_HOST ? "insights-dashboard" : "insights_dashboard");

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