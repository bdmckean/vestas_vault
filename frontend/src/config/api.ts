/**
 * API base URL for axios.
 * In dev we use a relative path so the Vite proxy forwards /api to the backend;
 * no need for the browser to reach the backend port directly.
 */
export const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : `${import.meta.env.VITE_API_URL || 'http://localhost:8005'}/api/v1`;
