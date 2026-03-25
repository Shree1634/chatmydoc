import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Home } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function NotFoundPage() {
  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontSize: '7rem', fontWeight: 800, lineHeight: 1,
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: '1rem'
          }}>
            404
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '.5rem' }}>Page Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/" className="btn btn-primary"><Home size={16} /> Go Home</Link>
            <Link to="/dashboard" className="btn btn-secondary"><FileText size={16} /> Dashboard</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
