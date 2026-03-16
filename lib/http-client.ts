import axios, { AxiosError } from 'axios';
import { config } from '@/config/app.config';

export const httpClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach auth token if present ──────────────────────
httpClient.interceptors.request.use((req) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ─── Response interceptor — normalize errors ─────────────────────────────────
httpClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';

    // Redirect to login on 401
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return Promise.reject(new Error(message));
  }
);
