import axios, { AxiosError } from 'axios';
import { config } from '@/config/app.config';

export const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach auth token ──────────────────────────────────
api.interceptors.request.use((req) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ─── Response interceptor — normalize errors ──────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string }>) => {
    const message =
      err.response?.data?.message ??
      err.message ??
      'An unexpected error occurred';

    if (err.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return Promise.reject(new Error(message));
  }
);
