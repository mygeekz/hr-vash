import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // اینجا می‌توانید مدیریت خطاهای سراسری را انجام دهید
    // مثلاً اگر توکن منقضی شده بود، کاربر را به صفحه لاگین هدایت کنید
    if (error.response?.status === 401) {
      // localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
