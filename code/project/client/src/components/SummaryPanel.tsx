import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, FileText } from 'lucide-react';
import { summarizePDFApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

interface SummaryPanelProps {
  pdfId: string;
  initialSummary?: string;
}

export default function SummaryPanel({ pdfId, initialSummary }: SummaryPanelProps) {
  const [summary, setSummary] = useState(initialSummary || '');
  const [isLoading, setIsLoading] = useState(false);

  const generateSummary = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Generating summary with AI...');
    try {
      const { data } = await summarizePDFApi(pdfId);
      if (data.success) {
        setSummary(data.data.summary);
        toast.success('Summary generated!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to generate summary', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate summary', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-panel">
      <div className="summary-header">
        <div className="summary-title">
          <Sparkles size={18} className="gradient-icon" />
          <span>AI Summary</span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={generateSummary}
          disabled={isLoading}
        >
          {isLoading ? (
            <><div className="spinner" style={{ width: 14, height: 14 }} /> Generating...</>
          ) : (
            <><RefreshCw size={14} /> {summary ? 'Regenerate' : 'Generate'}</>
          )}
        </button>
      </div>

      {summary ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="summary-content"
        >
          {summary}
        </motion.div>
      ) : (
        <div className="empty-state">
          <FileText size={40} style={{ margin: '0 auto 1rem', opacity: .3 }} />
          <h3>No summary yet</h3>
          <p>Click "Generate" to create an AI-powered summary of this document</p>
        </div>
      )}

      <style>{`
        .summary-panel { height: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .summary-header {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 1rem; border-bottom: 1px solid var(--border);
        }
        .summary-title { display: flex; align-items: center; gap: .5rem; font-weight: 600; font-size: 1rem; }
        .gradient-icon { color: var(--accent-purple); }
        .summary-content {
          flex: 1; font-size: .9rem; line-height: 1.8;
          color: var(--text-secondary); white-space: pre-wrap;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
