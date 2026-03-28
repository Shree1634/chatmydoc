import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      // ─── Login ──────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          console.log('🔑 [AUTH STORE] Calling login API for:', email);
          const response = await loginApi({ email, password });
          const { data } = response;

          if (!data.success) {
            const msg = data.message || 'Login failed';
            console.warn('🔑 [AUTH STORE] Login rejected by server:', msg);
            throw new Error(msg);
          }

          set({ 
            user: data.user, 
            token: data.token, 
            refreshToken: data.refreshToken,
            isAuthenticated: true 
          });

          console.log('🔑 [AUTH STORE] ✅ Login success, user saved to state:', data.user.email);
          toast.success(`Welcome back, ${data.user.username}!`);

        } catch (err: any) {
          if (err.message && !err.response) throw err;
          const msg = err.response?.data?.message || err.message || 'Login failed — check your connection';
          console.error('🔑 [AUTH STORE] Login error:', msg);
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      // ─── Register ────────────────────────────────────────
      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          console.log('📋 [AUTH STORE] Registering:', { username, email });
          const response = await registerApi({ username, email, password });
          const { data } = response;

          if (!data.success) {
            const msg = data.message || 'Registration failed';
            console.warn('📋 [AUTH STORE] Register rejected by server:', msg);
            throw new Error(msg);
          }

          set({ 
            user: data.user, 
            token: data.token, 
            refreshToken: data.refreshToken,
            isAuthenticated: true
          });

          console.log('📋 [AUTH STORE] ✅ Register success:', data.user.username);
          toast.success(`Welcome, ${data.user.username}!`);

        } catch (err: any) {
          if (err.message && !err.response) throw err;
          const msg = err.response?.data?.message || err.message || 'Registration failed — check your connection';
          console.error('📋 [AUTH STORE] Register error:', msg);
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      // ─── Logout ──────────────────────────────────────────
      logout: async () => {
        try { await logoutApi(); } catch { /* ignore */ }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },

      // ─── Set Token ───────────────────────────────────────
      setToken: (token, refreshToken) => {
        set({ token, refreshToken, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
