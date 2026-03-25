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
          error: { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
          loading: { iconTheme: { primary: '#8b5cf6', secondary: '#16161f' } },
          duration: 3500,
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/pdf/:id" element={<ProtectedRoute><PDFDetailPage /></ProtectedRoute>} />
        <Route path="/pdf/:id/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        {/* Fallbacks */}
        <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
