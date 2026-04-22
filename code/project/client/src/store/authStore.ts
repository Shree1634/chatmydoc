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

// Clear expired tokens on app start
const checkAndClearExpiredToken = () => {
  const stored = localStorage.getItem('auth-storage')
  if (!stored) return
  try {
    const data = JSON.parse(stored)
    const token = data?.state?.token
    if (!token) return
    
    // Decode JWT to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiry = payload.exp * 1000
    if (Date.now() > expiry) {
      console.log('[Auth] Clearing expired token from storage')
      localStorage.removeItem('auth-storage')
    }
  } catch (e) {
    localStorage.removeItem('auth-storage')
  }
}
checkAndClearExpiredToken()
