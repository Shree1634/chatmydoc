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
      } else toast.error(data.message || 'AI service unavailable. Please check API configuration.', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI service unavailable. Please check API configuration.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2 font-semibold text-[#f0f0ff]">
          <Sparkles size={17} className="text-purple-400" />
          AI Summary
        </div>
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <><div className="spinner w-3 h-3" /> Generating...</>
            : <><RefreshCw size={12} /> {summary ? 'Regenerate' : 'Generate'}</>}
        </button>
      </div>

      {/* Content */}
      {summary ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 text-sm text-[#a0a0b8] leading-relaxed whitespace-pre-wrap overflow-y-auto"
        >
          {summary}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
          <FileText size={40} className="text-[#2a2a3a]" />
          <div>
            <h3 className="font-semibold text-[#a0a0b8] mb-1">No summary yet</h3>
            <p className="text-sm text-[#606078]">Click "Generate" to create an AI-powered summary</p>
          </div>
        </div>
      )}
    </div>
  );
}
