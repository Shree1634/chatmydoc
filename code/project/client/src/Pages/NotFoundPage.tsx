import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Home } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0ff]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4"
        >
          <div className="text-8xl font-extrabold gradient-text leading-none">404</div>
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-[#a0a0b8] max-w-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-3 mt-2">
            <Link to="/" className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white">
              <Home size={16} /> Go Home
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#16161f] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-colors"
            >
              <FileText size={16} /> Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
