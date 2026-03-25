import axios from 'axios';

// 1. שרת ה-Node.js (פורט 3000) - אימות ומשתמשים
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000/api',
});

// 2. שרת פייתון 1 (פורט 8000) - העלאת נתונים (Ingestion)
export const ingestionApi = axios.create({
  baseURL: import.meta.env.VITE_INGESTION_API_URL || 'http://localhost:8000',
});

// 3. שרת פייתון 2 (פורט 8001) - סטטיסטיקות (Insights)
export const insightsApi = axios.create({
  baseURL: import.meta.env.VITE_INSIGHTS_API_URL || 'http://localhost:8001',
});

// פונקציית עזר להזרקת ה-Headers לכל הבקשות
const injectHeaders = (config) => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // שרת ה-Insights דורש Header ספציפי לזיהוי המשתמש
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  
  return config;
};

// הפעלת ה-Headers על כל השרתים
authApi.interceptors.request.use(injectHeaders);
ingestionApi.interceptors.request.use(injectHeaders);
insightsApi.interceptors.request.use(injectHeaders);

export default authApi;