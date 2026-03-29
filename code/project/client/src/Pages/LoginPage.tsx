import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mail, Lock, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

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
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
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
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
                className="w-full bg-[#111118] border border-[#2a2a3a] focus:border-purple-600 rounded-lg pl-10 pr-4 py-3 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none transition-all focus:ring-2 focus:ring-purple-600/30 disabled:opacity-60"
              />
            </div>
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
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
                className="w-full bg-[#111118] border border-[#2a2a3a] focus:border-purple-600 rounded-lg pl-10 pr-11 py-3 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none transition-all focus:ring-2 focus:ring-purple-600/30 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-gradient flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
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
