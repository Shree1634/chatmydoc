import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/85 backdrop-blur-xl border-b border-[#2a2a3a]">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-[#f0f0ff]">
          <div className="w-8 h-8 btn-gradient rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <span className="text-base">ChatMyDoc</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-[#16161f] text-[#f0f0ff]'
                    : 'text-[#a0a0b8] hover:text-[#f0f0ff] hover:bg-[#16161f]'
                }`}
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>

              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#2a2a3a]">
                <div className="w-7 h-7 btn-gradient rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-[#a0a0b8]">{user.username}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#606078] hover:text-[#f0f0ff] hover:bg-[#16161f] transition-colors ml-1"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#a0a0b8] hover:text-[#f0f0ff] hover:bg-[#16161f] transition-colors">
                Login
              </Link>
              <Link to="/register" className="flex items-center gap-1 btn-gradient px-4 py-1.5 rounded-lg text-sm font-semibold text-white">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-1.5 rounded-lg text-[#606078] hover:text-[#f0f0ff] hover:bg-[#16161f] transition-colors"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sm:hidden px-4 pb-3 border-t border-[#2a2a3a] flex flex-col gap-1 pt-2"
          >
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#a0a0b8] hover:text-[#f0f0ff] hover:bg-[#16161f] transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#606078]">
                  <div className="w-6 h-6 btn-gradient rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {user.username[0].toUpperCase()}
                  </div>
                  {user.username}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2.5 rounded-lg text-sm text-[#a0a0b8] hover:bg-[#16161f] transition-colors" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="px-3 py-2.5 rounded-lg text-sm text-[#a0a0b8] hover:bg-[#16161f] transition-colors" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
