import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ProtectedRoute = () => {
  const { isAuthenticated, token, _hasHydrated } = useAuthStore()

  if (!_hasHydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
