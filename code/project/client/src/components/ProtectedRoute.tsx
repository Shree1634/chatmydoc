import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'

const ProtectedRoute = () => {
  const { isAuthenticated, token, _hasHydrated } = useAuthStore()
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!_hasHydrated) return

    if (!token) {
      setIsTokenValid(false)
      return
    }

    // Validate token expiry locally — no API call needed
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const isExpired = Date.now() > payload.exp * 1000
      if (isExpired) {
        console.log('[ProtectedRoute] Token expired, clearing session')
        useAuthStore.getState().logout()
        setIsTokenValid(false)
      } else {
        setIsTokenValid(true)
      }
    } catch {
      // Malformed token
      useAuthStore.getState().logout()
      setIsTokenValid(false)
    }
  }, [_hasHydrated, token])

  // Wait for hydration + local check before rendering anything
  if (!_hasHydrated || isTokenValid === null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1rem'
      }}>
        Loading...
      </div>
    )
  }

  if (!isTokenValid || !isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute

