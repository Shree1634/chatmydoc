import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Trash2, MessageSquare, Calendar, HardDrive, ArrowRight, X } from 'lucide-react';
import { usePDFStore, PDFDocument } from '../store/pdfStore';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
import PDFUpload from '../components/PDFUpload';

function PDFCard({ pdf, onDelete }: { pdf: PDFDocument; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: .97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: .95 }}
      className="pdf-card card"
    >
      <div className="pdf-card-top">
        <div className="pdf-card-icon"><FileText size={22} /></div>
        <button
          className="btn btn-ghost btn-sm pdf-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(pdf._id); }}
          title="Delete PDF"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <h3 className="pdf-card-title" title={pdf.title}>{pdf.title}</h3>
      <div className="pdf-card-meta">
        <span><HardDrive size={12} /> {formatSize(pdf.size)}</span>
        <span><Calendar size={12} /> {formatDate(pdf.uploadedAt)}</span>
        <span><MessageSquare size={12} /> {pdf.chatCount ?? pdf.chats?.length ?? 0} chats</span>
      </div>
      <div className="pdf-card-actions">
        <Link to={`/pdf/${pdf._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          Open
        </Link>
        <Link to={`/pdf/${pdf._id}/chat`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          Chat <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { pdfs, isLoading, fetchPDFs, deletePDF } = usePDFStore();
  const { user } = useAuthStore();
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { fetchPDFs(); }, [fetchPDFs]);

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="container dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">My Documents</h1>
            <p className="dashboard-sub">Welcome back, <span style={{ color: 'var(--accent-purple)' }}>{user?.username}</span>!</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={18} /> Upload PDF
          </button>
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUpload && (
            <motion.div className="upload-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUpload(false)}>
              <motion.div
                className="upload-modal"
                initial={{ opacity: 0, scale: .95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: .95 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="upload-modal-header">
                  <h2>Upload a PDF</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowUpload(false)}>
                    <X size={18} />
                  </button>
                </div>
                <PDFUpload onSuccess={() => { setShowUpload(false); fetchPDFs(); }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card card">
            <span className="stat-number">{pdfs.length}</span>
            <span className="stat-label">Documents</span>
          </div>
          <div className="stat-card card">
            <span className="stat-number">{pdfs.reduce((a, p) => a + (p.chatCount ?? p.chats?.length ?? 0), 0)}</span>
            <span className="stat-label">Total Chats</span>
          </div>
          <div className="stat-card card">
            <span className="stat-number">{pdfs.filter(p => p.summary).length}</span>
            <span className="stat-label">Summarized</span>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="empty-state" style={{ marginTop: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32 }} />
            <p>Loading your documents...</p>
          </div>
        ) : pdfs.length === 0 ? (
          <motion.div className="empty-docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FileText size={56} style={{ opacity: .2, marginBottom: '1rem' }} />
            <h3>No documents yet</h3>
            <p>Upload your first PDF to get started</p>
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => setShowUpload(true)}>
              <Plus size={16} /> Upload PDF
            </button>
          </motion.div>
        ) : (
          <motion.div className="pdfs-grid" layout>
            <AnimatePresence>
              {pdfs.map(pdf => (
                <PDFCard key={pdf._id} pdf={pdf} onDelete={deletePDF} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <style>{`
        .dashboard-page { min-height: 100vh; }
        .dashboard-main { padding: 2rem 1.5rem; max-width: 1200px; }
        .dashboard-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
        .dashboard-title { font-size: 1.75rem; font-weight: 700; margin-bottom: .25rem; }
        .dashboard-sub { color: var(--text-secondary); font-size: .95rem; }
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { text-align: center; padding: 1.25rem; }
        .stat-number { display: block; font-size: 2rem; font-weight: 800; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-label { font-size: .8rem; color: var(--text-muted); font-weight: 500; }
        .pdfs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
        .pdf-card { display: flex; flex-direction: column; gap: .75rem; cursor: default; }
        .pdf-card:hover { border-color: rgba(139,92,246,.4); box-shadow: var(--shadow-glow); transform: translateY(-2px); }
        .pdf-card-top { display: flex; align-items: center; justify-content: space-between; }
        .pdf-card-icon { width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(139,92,246,.15); color: var(--accent-purple); display: flex; align-items: center; justify-content: center; }
        .pdf-delete-btn { color: var(--text-muted); opacity: 0; transition: var(--transition); }
        .pdf-card:hover .pdf-delete-btn { opacity: 1; }
        .pdf-delete-btn:hover { color: var(--error) !important; }
        .pdf-card-title { font-weight: 600; font-size: .95rem; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .pdf-card-meta { display: flex; flex-wrap: wrap; gap: .5rem; }
        .pdf-card-meta span { display: flex; align-items: center; gap: .3rem; font-size: .75rem; color: var(--text-muted); }
        .pdf-card-actions { display: flex; gap: .5rem; margin-top: .25rem; }
        .empty-docs { text-align: center; padding: 4rem 1rem; margin-top: 2rem; }
        .empty-docs h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: .5rem; }
        .empty-docs p { color: var(--text-muted); }
        
        .upload-modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .upload-modal {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); padding: 1.75rem;
          width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 1.25rem;
        }
        .upload-modal-header { display: flex; align-items: center; justify-content: space-between; }
        .upload-modal-header h2 { font-size: 1.2rem; font-weight: 700; }
        @media (max-width: 640px) {
          .stats-row { grid-template-columns: repeat(3, 1fr); }
          .pdfs-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
