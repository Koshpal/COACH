import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_RETRY_AFTER_MS = 30_000;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  _rateLimitRetryCount?: number;
};

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(error);

    const requestUrl = originalRequest.url ?? '';
    const isAuthEndpoint = /\/auth\/(login|refresh|logout)(?:$|\?)/.test(requestUrl);

    // A failed login must stay on the login screen; never try to refresh it.
    // Refresh is performed with bare axios so it cannot recursively enter this interceptor.
    if (error.response?.status === 401 && !originalRequest._authRetry && !isAuthEndpoint) {
      originalRequest._authRetry = true;
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
          timeout: 15000,
        });
        return api(originalRequest);
      } catch {
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(error);
      }
    }

    // Retrying a mutation after a 429 can create duplicate sessions, notes, or action items.
    // Only retry methods that are safe and idempotent.
    const method = (originalRequest.method ?? 'get').toLowerCase();
    const isSafeMethod = ['get', 'head', 'options'].includes(method);
    if (error.response?.status === 429 && isSafeMethod) {
      const retryCount = originalRequest._rateLimitRetryCount ?? 0;
      if (retryCount < MAX_RETRIES) {
        originalRequest._rateLimitRetryCount = retryCount + 1;
        const retryAfter = Number(error.response.headers?.['retry-after']);
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS)
          : Math.min(RETRY_DELAY * 2 ** retryCount, MAX_RETRY_AFTER_MS);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
