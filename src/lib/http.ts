import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const http = axios.create({
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
  (response) => response.data, // Return data directly
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      // localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    // You might want to throw a more specific error or handle it differently
    return Promise.reject(error.response?.data || error.message);
  }
);

// Define generic methods
const get = <T>(url: string, params?: object): Promise<T> => http.get<T>(url, { params });

const post = <T>(url: string, data: object, options?: object): Promise<T> => http.post<T>(url, data, options);

const del = <T>(url: string): Promise<T> => http.delete<T>(url);

const postWithFiles = <T>(url: string, data: FormData): Promise<T> => {
  return http.post<T>(url, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export { http, get, post, del, postWithFiles };
