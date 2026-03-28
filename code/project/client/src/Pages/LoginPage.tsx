import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    try {
      console.log('🔑 Submitting login...');
      await login(email.trim(), password);
      console.log('✅ Login success, navigating to dashboard...');
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('❌ Login error:', err);
      // Fallback message ensures we never show an empty red box
      setServerError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-auth-glow flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-8 flex flex-col gap-7"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-[#f0f0ff]">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <span>ChatMyDoc</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0ff] mb-1">Welcome back</h1>
          <p className="text-sm text-[#a0a0b8]">Sign in to continue to your documents</p>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#a0a0b8]">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                autoComplete="email"
                disabled={isLoading}
                className={`w-full bg-[#111118] border rounded-lg pl-10 pr-4 py-3 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none transition-all focus:ring-2 focus:ring-purple-600/30 disabled:opacity-60
                  ${fieldErrors.email ? 'border-red-500' : 'border-[#2a2a3a] focus:border-purple-600'}`}
              />
            </div>
            {fieldErrors.email && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#a0a0b8]">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                autoComplete="current-password"
                disabled={isLoading}
                className={`w-full bg-[#111118] border rounded-lg pl-10 pr-11 py-3 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none transition-all focus:ring-2 focus:ring-purple-600/30 disabled:opacity-60
                  ${fieldErrors.password ? 'border-red-500' : 'border-[#2a2a3a] focus:border-purple-600'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606078] hover:text-[#f0f0ff] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.password}</span>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gradient flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <><div className="spinner w-4 h-4" /> Signing in...</>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Switch */}
        <p className="text-center text-sm text-[#a0a0b8]">
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-400 font-medium hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
