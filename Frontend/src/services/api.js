import axios from 'axios';

const api = axios.create({
  // יש לעדכן לכתובת השרת האמיתית כשתקבלו החלטה בצוות
  baseURL: 'http://localhost:3000/api', 
});

// Interceptor שמוסיף אוטומטית את טוקן האימות לכל קריאה
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;