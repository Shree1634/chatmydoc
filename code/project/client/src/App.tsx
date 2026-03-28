import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import PDFDetailPage from './pages/PDFDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

// ─── Dev: health-check on startup ─────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
fetch(`${BACKEND_URL}/api/health`)
  .then(r => r.json())
  .then(d => console.log('✅ [APP] Backend connected:', d))
  .catch(e => console.error('❌ [APP] Backend unreachable — check server is running on', BACKEND_URL, e));

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161f',
            color: '#f0f0ff',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#16161f' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
          loading: { iconTheme: { primary: '#8b5cf6', secondary: '#16161f' } },
          duration: 4000,
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes - wrapped in single ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/pdf/:id"      element={<PDFDetailPage />} />
          <Route path="/pdf/:id/chat" element={<ChatPage />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
        <Route path="*"     element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
