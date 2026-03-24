import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
});

const isFormDataPayload = (data: unknown): boolean =>
  typeof FormData !== 'undefined' && data instanceof FormData;

const isPlainObjectPayload = (data: unknown): boolean =>
  data !== null && typeof data === 'object' && !Array.isArray(data) && !isFormDataPayload(data);

const isJsonStringPayload = (data: unknown): boolean => {
  if (typeof data !== 'string') return false;
  const trimmed = data.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

const setHeader = (headers: any, key: string, value: string) => {
  if (!headers) return;
  if (typeof headers.set === 'function') {
    headers.set(key, value);
    return;
  }
  headers[key] = value;
};

const deleteHeader = (headers: any, key: string) => {
  if (!headers) return;
  if (typeof headers.delete === 'function') {
    headers.delete(key);
    return;
  }
  delete headers[key];
};

const hasHeader = (headers: any, key: string): boolean => {
  if (!headers) return false;
  if (typeof headers.has === 'function') return headers.has(key);
  return Boolean(headers[key]);
};

const removeContentTypeHeader = (headers: any) => {
  if (!headers) return;

  deleteHeader(headers, 'Content-Type');
  deleteHeader(headers, 'content-type');

  ['common', 'post', 'put', 'patch'].forEach((scope) => {
    if (headers[scope]) {
      deleteHeader(headers[scope], 'Content-Type');
      deleteHeader(headers[scope], 'content-type');
    }
  });

  if (typeof headers === 'object') {
    Object.keys(headers).forEach((key) => {
      if (key.toLowerCase() === 'content-type') delete headers[key];
    });

    ['common', 'post', 'put', 'patch'].forEach((scope) => {
      const scopedHeaders = headers[scope];
      if (scopedHeaders && typeof scopedHeaders === 'object') {
        Object.keys(scopedHeaders).forEach((key) => {
          if (key.toLowerCase() === 'content-type') delete scopedHeaders[key];
        });
      }
    });
  }
};

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      // Use helper to support AxiosHeaders and plain objects
      setHeader(config.headers, 'Authorization', `Bearer ${token}`);
    }

    // HARD RULE: never allow Content-Type to be set for FormData
    if (isFormDataPayload(config.data)) {
      removeContentTypeHeader(config.headers);

      if (import.meta.env.DEV) {
        const stillHasContentType =
          hasHeader(config.headers, 'Content-Type') || hasHeader(config.headers, 'content-type');
        console.debug('[api] FormData request prepared', {
          url: config.url,
          method: config.method,
          hasContentType: stillHasContentType,
        });
      }
      return config;
    }

    // Only set JSON Content-Type when there IS data and it's JSON-like
    if (config.data !== undefined && config.data !== null) {
      if (isPlainObjectPayload(config.data) || isJsonStringPayload(config.data)) {
        if (!hasHeader(config.headers, 'Content-Type') && !hasHeader(config.headers, 'content-type')) {
          setHeader(config.headers, 'Content-Type', 'application/json');
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;