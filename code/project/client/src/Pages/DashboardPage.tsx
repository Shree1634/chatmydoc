import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Trash2, MessageSquare, Calendar, HardDrive, ArrowRight, X } from 'lucide-react';
import { usePDFStore, PDFDocument } from '../store/pdfStore';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import PDFUpload from '../components/PDFUpload';

function PDFCard({ pdf, onDelete }: { pdf: PDFDocument; onDelete: (id: string) => void }) {
  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-5 flex flex-col gap-3 hover:border-purple-500/40 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 bg-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center">
          <FileText size={22} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(pdf._id); }}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-[#606078] hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete PDF"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <h3 className="font-semibold text-sm text-[#f0f0ff] leading-snug line-clamp-2" title={pdf.title}>
        {pdf.title}
      </h3>

      <div className="flex flex-wrap gap-2">
        {[
          { icon: HardDrive, label: formatSize(pdf.size) },
          { icon: Calendar, label: formatDate(pdf.uploadedAt) },
          { icon: MessageSquare, label: `${pdf.chatCount ?? pdf.chats?.length ?? 0} chats` },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1 text-xs text-[#606078]">
            <Icon size={11} />{label}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-1">
        <Link
          to={`/pdf/${pdf._id}`}
          className="flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-colors"
        >
          Open
        </Link>
        <Link
          to={`/pdf/${pdf._id}/chat`}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg btn-gradient text-white"
        >
          Chat <ArrowRight size={12} />
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

  const totalChats = pdfs.reduce((a, p) => a + (p.chatCount ?? p.chats?.length ?? 0), 0);
  const summarized = pdfs.filter(p => p.summary).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0ff]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Documents</h1>
            <p className="text-sm text-[#a0a0b8]">
              Welcome back, <span className="text-purple-400 font-medium">{user?.username}</span>!
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          >
            <Plus size={18} /> Upload PDF
          </button>
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUpload(false)}
            >
              <motion.div
                className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 w-full max-w-md flex flex-col gap-5"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Upload a PDF</h2>
                  <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg text-[#606078] hover:text-[#f0f0ff] hover:bg-[#1e1e2a] transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <PDFUpload onSuccess={() => { setShowUpload(false); fetchPDFs(); }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Documents', value: pdfs.length },
            { label: 'Total Chats', value: totalChats },
            { label: 'Summarized', value: summarized },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-4 text-center">
              <span className="block text-3xl font-extrabold gradient-text">{value}</span>
              <span className="text-xs text-[#606078] font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="spinner w-8 h-8" />
            <p className="text-sm text-[#606078]">Loading your documents...</p>
          </div>
        ) : pdfs.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <FileText size={56} className="text-[#3a3a4a]" />
            <div>
              <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
              <p className="text-sm text-[#606078]">Upload your first PDF to get started</p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            >
              <Plus size={16} /> Upload PDF
            </button>
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" layout>
            <AnimatePresence>
              {pdfs.map(pdf => (
                <PDFCard key={pdf._id} pdf={pdf} onDelete={deletePDF} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
