// src/lib/http.ts

const API_BASE_URL = 'http://192.168.11.115:3001/api';

/**
 * ساخت هدر برای درخواست‌ها
 * @param isFormData آیا اطلاعات به صورت FormData است یا نه
 */
const getHeaders = (isFormData = false): HeadersInit => {
  const headers: HeadersInit = {};
  const token = localStorage.getItem('authToken');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

/**
 * ارسال درخواست GET
 */
export const get = async (endpoint: string) => {
  checkEndpoint(endpoint);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * ارسال درخواست POST / PUT / PATCH
 */
export const post = async (
  endpoint: string,
  body: any,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
) => {
  checkEndpoint(endpoint);
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(isFormData),
    body: isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    throw new Error(errorData.message || 'Failed to submit data');
  }

  return response.json();
};

/**
 * ارسال فرم‌دیتا
 */
export const postWithFiles = async (endpoint: string, formData: FormData) => {
  return post(endpoint, formData, 'POST');
};

/**
 * حذف داده‌ها
 */
export const del = async (endpoint: string) => {
  checkEndpoint(endpoint);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    throw new Error(errorData.message || 'Failed to delete data');
  }

  return response.json();
};

/**
 * بررسی تکراری نبودن `/api` در endpoint
 */
function checkEndpoint(endpoint: string) {
  if (endpoint.startsWith('/api')) {
    console.warn(`❌ مسیر "${endpoint}" تکراری است. "/api" به صورت خودکار به baseURL اضافه شده است.`);
  }
}
