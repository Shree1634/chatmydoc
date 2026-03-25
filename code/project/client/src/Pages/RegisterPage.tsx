import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const success = await register(form.username, form.email, form.password);
    if (success) navigate('/dashboard', { replace: true });
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/" className="auth-logo">
          <div className="logo-icon"><FileText size={20} /></div>
          <span>ChatMyDoc</span>
        </Link>

        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Start chatting with your documents today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrap">
              <User size={16} className="input-icon" />
              <input className={`input input-with-icon ${errors.username ? 'input-error' : ''}`} type="text" placeholder="johndoe" value={form.username} onChange={update('username')} autoComplete="username" />
            </div>
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label>Email address</label>
            <div className="input-wrap">
              <Mail size={16} className="input-icon" />
              <input className={`input input-with-icon ${errors.email ? 'input-error' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} autoComplete="email" />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input className={`input input-with-icon ${errors.password ? 'input-error' : ''}`} type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={update('password')} autoComplete="new-password" />
              <button type="button" className="toggle-pass" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input className={`input input-with-icon ${errors.confirmPassword ? 'input-error' : ''}`} type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={form.confirmPassword} onChange={update('confirmPassword')} autoComplete="new-password" />
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 2rem 1rem;
          background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,.1), transparent);
        }
        .auth-card {
          width: 100%; max-width: 420px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); padding: 2.5rem;
          display: flex; flex-direction: column; gap: 1.75rem;
        }
        .auth-logo { display: flex; align-items: center; gap: .6rem; font-weight: 700; font-size: 1.1rem; }
        .auth-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: .35rem; }
        .auth-header p { color: var(--text-secondary); font-size: .9rem; }
        .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .input-wrap { position: relative; }
        .input-icon { position: absolute; left: .9rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .input-with-icon { padding-left: 2.5rem; }
        .toggle-pass { position: absolute; right: .9rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); background: none; transition: var(--transition); }
        .toggle-pass:hover { color: var(--text-primary); }
        .input-error { border-color: var(--error) !important; }
        .auth-submit { width: 100%; justify-content: center; padding: .8rem; }
        .auth-switch { text-align: center; font-size: .875rem; color: var(--text-secondary); }
        .auth-switch a { color: var(--accent-purple); font-weight: 500; }
        .auth-switch a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
