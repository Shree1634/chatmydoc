import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: string) =>
    setFieldErrors(p => ({ ...p, [field]: '' }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim() || username.trim().length < 3) e.username = 'Username must be at least 3 characters';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email is required';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('📋 [REGISTER PAGE] Submitting:', { username, email });
      await register(username.trim(), email.trim(), password);
      console.log('📋 [REGISTER PAGE] ✅ Redirecting to /dashboard');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-[#111118] border rounded-lg py-3 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none transition-all focus:ring-2 focus:ring-purple-600/30 disabled:opacity-60
    ${fieldErrors[field] ? 'border-red-500' : 'border-[#2a2a3a] focus:border-purple-600'}`;

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
          <h1 className="text-2xl font-bold text-[#f0f0ff] mb-1">Create your account</h1>
          <p className="text-sm text-[#a0a0b8]">Start chatting with your documents today</p>
        </div>

        {serverError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-[#a0a0b8]">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={e => { setUsername(e.target.value); clearError('username'); }}
                autoComplete="username"
                disabled={isSubmitting}
                className={`${inputClass('username')} pl-10 pr-4`}
              />
            </div>
            {fieldErrors.username && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={11} />{fieldErrors.username}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-email" className="text-sm font-medium text-[#a0a0b8]">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                autoComplete="email"
                disabled={isSubmitting}
                className={`${inputClass('email')} pl-10 pr-4`}
              />
            </div>
            {fieldErrors.email && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={11} />{fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-password" className="text-sm font-medium text-[#a0a0b8]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); clearError('password'); }}
                autoComplete="new-password"
                disabled={isSubmitting}
                className={`${inputClass('password')} pl-10 pr-11`}
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
            {fieldErrors.password && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={11} />{fieldErrors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[#a0a0b8]">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                autoComplete="new-password"
                disabled={isSubmitting}
                className={`${inputClass('confirmPassword')} pl-10 pr-4`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={11} />{fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-gradient flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting
              ? <><div className="spinner w-4 h-4" /> Creating account...</>
              : 'Create Account'}
          </button>
        </form>

        {/* Switch */}
        <p className="text-center text-sm text-[#a0a0b8]">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
