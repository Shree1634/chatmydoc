import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated, token, _hasHydrated } = useAuthStore();
  const location = useLocation();

  // Wait for zustand to rehydrate from localStorage before deciding to redirect
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner w-6 h-6 border-purple-500" />
          <div className="text-[#a0a0b8] text-sm">Loading session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    console.warn('🔒 [PROTECTED ROUTE] Access denied, missing user/token. Redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
