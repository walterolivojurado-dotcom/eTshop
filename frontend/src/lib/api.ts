import axios from 'axios';
import Cookies from 'js-cookie';

const envApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
// Si no hay variable, estamos en producción/Vercel, o apunta al antiguo servidor de Railway, usamos la API integrada (/api)
const RAW_API_URL = !envApiUrl || envApiUrl.includes('railway.app') || process.env.NODE_ENV === 'production' ? '/api' : envApiUrl;
export const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

// URL base del backend para archivos (sin /api)
const BACKEND_BASE_URL = RAW_API_URL.startsWith('http') 
  ? RAW_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')
  : '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getScopedSlugFromPath(pathname?: string): string | null {
  const path =
    pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (path.startsWith('/b/')) {
    const parts = path.split('/');
    if (parts[2]) return parts[2];
  }
  return null;
}

export function getActiveToken(pathname?: string): string | null {
  if (typeof window === 'undefined') return null;
  const slug = getScopedSlugFromPath(pathname);
  if (slug) {
    return (
      Cookies.get(`etambo_token_${slug}`) ||
      Cookies.get('etambo_token_global') ||
      Cookies.get('etambo_token') ||
      null
    );
  }
  return (
    Cookies.get('etambo_token_global') ||
    Cookies.get('etambo_token') ||
    null
  );
}

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = getActiveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle expired or invalidated sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = error.response.data.message || "";
      const isKicked = message.includes("otro dispositivo");

      // We only want to show this special UX if it's a "Kicked" event
      // and we are not already on the login page
      if (isKicked && !window.location.pathname.includes('/login')) {
        import('sonner').then(({ toast }) => {
          toast.error("Tu sesión ha sido iniciada en otro dispositivo. Se cerrará en 3 segundos.", {
            duration: 3000,
            id: 'session-kicked',
          });
        });

        // Delay redirect by 3 seconds
        setTimeout(() => {
          Cookies.remove('etambo_token');
          window.location.href = '/login';
        }, 3000);
      } else if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
         // Standard 401 (expired)
         Cookies.remove('etambo_token');
         window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      const message = error.response.data.message || "";
      const isDeactivated = message.includes("INACTIVA") || message.includes("DESACTIVADO");

      if (isDeactivated && !window.location.pathname.includes('/login')) {
        import('sonner').then(({ toast }) => {
          toast.error(message, {
            duration: 6000,
            id: 'account-deactivated',
          });
        });

        // Delay redirect to allow reading the message
        setTimeout(() => {
          Cookies.remove('etambo_token');
          window.location.href = '/login';
        }, 5000);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Convierte un path local (ej: uploads/avatar.png) en una URL completa apuntando al backend.
 */
export const getFileUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // Normalizar el path: asegurar que no empiece con slash para evitar dobles slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return BACKEND_BASE_URL ? `${BACKEND_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
};

export default api;
