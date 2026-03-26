import axios from 'axios';

// 1. Node.js Server (Port 3000) - Authentication & Users
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000/api',
});

// 2. Python Server 1 (Port 8000) - Data Ingestion
export const ingestionApi = axios.create({
  baseURL: import.meta.env.VITE_INGESTION_API_URL || 'http://localhost:8000',
});

// 3. Python Server 2 (Port 8001) - Analytics (Insights)
export const insightsApi = axios.create({
  baseURL: import.meta.env.VITE_INSIGHTS_API_URL || 'http://localhost:8001',
});

// Helper function to inject Headers into all requests
const injectHeaders = (config) => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Insights server requires a specific header for user identification
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  
  return config;
};

// Apply Headers to all service instances
authApi.interceptors.request.use(injectHeaders);
ingestionApi.interceptors.request.use(injectHeaders);
insightsApi.interceptors.request.use(injectHeaders);

export default authApi;