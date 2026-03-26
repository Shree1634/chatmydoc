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

  const inputClass = (field: string) =>
    `w-full bg-[#111118] border rounded-lg py-3 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none transition-all focus:ring-2 focus:ring-purple-600/30 ${
      errors[field] ? 'border-red-500' : 'border-[#2a2a3a] focus:border-purple-600'
    }`;

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#a0a0b8]">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                type="text"
                placeholder="johndoe"
                value={form.username}
                onChange={update('username')}
                autoComplete="username"
                className={`${inputClass('username')} pl-10 pr-4`}
              />
            </div>
            {errors.username && <span className="text-xs text-red-400">{errors.username}</span>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#a0a0b8]">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                className={`${inputClass('email')} pl-10 pr-4`}
              />
            </div>
            {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#a0a0b8]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                className={`${inputClass('password')} pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606078] hover:text-[#f0f0ff] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="text-xs text-red-400">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#a0a0b8]">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606078] pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                autoComplete="new-password"
                className={`${inputClass('confirmPassword')} pl-10 pr-4`}
              />
            </div>
            {errors.confirmPassword && <span className="text-xs text-red-400">{errors.confirmPassword}</span>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gradient flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white mt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <div className="spinner w-4 h-4" />
                Creating account...
              </>
            ) : 'Create Account'}
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
