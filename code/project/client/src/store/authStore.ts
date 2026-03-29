import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { loginApi, registerApi } from '../api/auth.api'

interface AuthState {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setHasHydrated: (val: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      login: async (email, password) => {
        const res = await loginApi({ email, password })
        const { token, user } = res.data
        if (!token || !user) throw new Error('Invalid response from server')
        set({ user, token, isAuthenticated: true })
      },

      register: async (username, email, password) => {
        const res = await registerApi({ username, email, password })
        const { token, user } = res.data
        if (!token || !user) throw new Error('Invalid response from server')
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('auth-storage')
        set({ user: null, token: null, isAuthenticated: false })
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)

export default useAuthStore
