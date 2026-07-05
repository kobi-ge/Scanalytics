import axios from 'axios';

const gatewayBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const createApiClient = () => {
  const instance = axios.create({
    baseURL: gatewayBaseURL,
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userId) {
      config.headers['X-User-Id'] = userId;
    }

    return config;
  });

  return instance;
};

export const authApi = createApiClient();
export const ingestionApi = createApiClient();
export const insightsApi = createApiClient();
export const apiClient = createApiClient();

export default authApi;