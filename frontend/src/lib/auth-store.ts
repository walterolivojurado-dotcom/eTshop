import { create } from 'zustand';
import Cookies from 'js-cookie';
import axios from 'axios';
import { API_URL, getActiveToken, getScopedSlugFromPath } from '@/lib/api';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  phoneCode?: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'CASHIER' | 'INVENTORY' | 'CLIENT';
  companyId?: string | null;
  businessId?: string | null;
  avatarUrl?: string;
  isGlobalViewEnabled: boolean;
  roleProfile?: {
    id: string;
    name: string;
    modules: string[];
    isActive: boolean;
    isGlobalViewEnabled: boolean;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
    nit?: string;
    address?: string;
    phone?: string;
    currency?: string;
    logoUrl?: string;
    activeModules?: string[];
    settings?: any;
  };
  business?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    activeModules?: string[];
    settings?: any;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    Cookies.set('etambo_token', token, { expires: 7, sameSite: 'lax' });
    Cookies.set('etambo_role', user.role, { expires: 7, sameSite: 'lax' });
    const slug = user.company?.slug || user.business?.slug || getScopedSlugFromPath();
    if (user.role === 'SUPERADMIN') {
      Cookies.set('etambo_token_global', token, { expires: 7, sameSite: 'lax' });
    }
    if (slug) {
      Cookies.set(`etambo_token_${slug}`, token, { expires: 7, sameSite: 'lax' });
      Cookies.set('etambo_business_slug', slug, { expires: 7, sameSite: 'lax' });
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    const slug = getScopedSlugFromPath();
    try {
      const token = getActiveToken();
      if (token) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch {
      // Silenciar error de red al cerrar sesión
    } finally {
      if (slug) {
        Cookies.remove(`etambo_token_${slug}`);
      } else {
        Cookies.remove('etambo_token_global');
      }
      Cookies.remove('etambo_token');
      Cookies.remove('etambo_role');
      Cookies.remove('etambo_business_slug');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    const token = getActiveToken();
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data.data.user;
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      const slug = getScopedSlugFromPath();
      if (slug) {
        Cookies.remove(`etambo_token_${slug}`);
      } else {
        Cookies.remove('etambo_token_global');
      }
      Cookies.remove('etambo_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
