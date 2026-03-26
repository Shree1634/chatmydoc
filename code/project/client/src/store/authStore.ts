import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginApi, registerApi, logoutApi } from '../api/auth.api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setToken: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          console.log('🔑 [LOGIN] Attempting login for:', email);
          const { data } = await loginApi({ email, password });
          console.log('🔑 [LOGIN] Server response:', data);
          if (data.success) {
            set({ user: data.user, token: data.token, refreshToken: data.refreshToken });
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            toast.success(`Welcome back, ${data.user.username}!`);
            console.log('🔑 [LOGIN] ✅ Success — redirecting to dashboard');
            return true;
          }
          const msg = data.message || 'Login failed';
          console.warn('🔑 [LOGIN] ❌ Server returned failure:', msg);
          toast.error(msg);
          return false;
        } catch (err: any) {
          const msg = err.response?.data?.message || err.message || 'Login failed';
          console.error('🔑 [LOGIN] ❌ Request error:', {
            status: err.response?.status,
            message: msg,
            url: err.config?.url,
          });
          toast.error(msg);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await registerApi({ username, email, password });
          if (data.success) {
            set({ user: data.user, token: data.token, refreshToken: data.refreshToken });
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            toast.success(`Welcome, ${data.user.username}!`);
            return true;
          }
          toast.error(data.message || 'Registration failed');
          return false;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Registration failed');
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await logoutApi();
        } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, refreshToken: null });
        toast.success('Logged out successfully');
      },

      setToken: (token, refreshToken) => {
        set({ token, refreshToken });
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
    }
  )
);
