import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, LayoutDashboard, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <FileText size={20} />
          </div>
          <span>ChatMyDoc</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links desktop-only">
          {user ? (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <div className="navbar-user">
                <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                <span className="user-name">{user.username}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="btn btn-ghost btn-sm mobile-only" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="navbar-mobile-menu"
        >
          {user ? (
            <>
              <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <div className="mobile-nav-user">
                <User size={16} /> {user.username}
              </div>
              <button className="mobile-nav-link danger" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </motion.div>
      )}

      <style>{`
        .navbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(10,10,15,.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .navbar-inner {
          display: flex; align-items: center; justify-content: space-between;
          height: 60px;
        }
        .navbar-logo {
          display: flex; align-items: center; gap: .6rem;
          font-weight: 700; font-size: 1.1rem; color: var(--text-primary);
        }
        .logo-icon {
          width: 36px; height: 36px; border-radius: var(--radius-md);
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .navbar-links { display: flex; align-items: center; gap: .75rem; }
        .nav-link {
          display: flex; align-items: center; gap: .4rem;
          font-size: .9rem; font-weight: 500;
          color: var(--text-secondary);
          padding: .4rem .8rem; border-radius: var(--radius-sm);
          transition: var(--transition);
        }
        .nav-link:hover, .nav-link.active { color: var(--text-primary); background: var(--bg-card); }
        .navbar-user { display: flex; align-items: center; gap: .5rem; padding: 0 .5rem; }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: .85rem; color: #fff;
        }
        .user-name { font-size: .9rem; font-weight: 500; color: var(--text-secondary); }
        .desktop-only { display: flex; }
        .mobile-only { display: none; }
        .navbar-mobile-menu {
          padding: .75rem 1rem 1rem;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: .25rem;
        }
        .mobile-nav-link {
          display: flex; align-items: center; gap: .5rem;
          padding: .65rem .75rem; border-radius: var(--radius-md);
          font-size: .9rem; font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          transition: var(--transition);
          text-align: left; width: 100%;
        }
        .mobile-nav-link:hover { background: var(--bg-card); color: var(--text-primary); }
        .mobile-nav-link.danger { color: var(--error); }
        .mobile-nav-user { display: flex; align-items: center; gap: .5rem; padding: .65rem .75rem; color: var(--text-muted); font-size: .85rem; }
        @media (max-width: 640px) {
          .desktop-only { display: none; }
          .mobile-only { display: flex; }
        }
      `}</style>
    </nav>
  );
}
