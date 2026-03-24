import axios from "axios";

// שרת ה-Node.js (Auth & Users)
export const authApi = axios.create({
  baseURL: "http://localhost:3000/api",
});

// שרת ה-Python (Data & Kafka)
export const dataApi = axios.create({
  baseURL: "http://localhost:8000",
});

// הזרקת טוקן לשניהם (אם השרת הפייתון ידרוש זאת בעתיד)
const addToken = (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

authApi.interceptors.request.use(addToken);
dataApi.interceptors.request.use(addToken);

// כברירת מחדל נשאיר את authApi
export default authApi;
