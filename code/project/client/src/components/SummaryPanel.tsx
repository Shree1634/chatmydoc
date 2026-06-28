import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, FileText } from 'lucide-react';
import { summarizePDFApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

interface SummaryPanelProps {
  pdfId: string;
  initialSummary?: string;
}

const formatInline = (text: string) => {
  // Bold: **text** and Inline code: `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} 
          className="bg-black/40 px-1 py-0.5 rounded text-xs 
                     font-mono text-green-400">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

const formatMarkdown = (text: string) => {
  // Split into lines and process each
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('### ')) return (
      <h3 key={i} className="text-sm font-bold text-white mt-2 mb-1">
        {line.replace('### ', '')}
      </h3>
    )
    if (line.startsWith('## ')) return (
      <h2 key={i} className="text-base font-bold text-white mt-3 mb-1">
        {line.replace('## ', '')}
      </h2>
    )
    if (line.startsWith('# ')) return (
      <h1 key={i} className="text-lg font-bold text-white mt-3 mb-2">
        {line.replace('# ', '')}
      </h1>
    )
    // Bullet points
    if (line.startsWith('* ') || line.startsWith('- ')) return (
      <div key={i} className="flex gap-2 my-0.5">
        <span className="text-purple-400 flex-shrink-0">•</span>
        <span>{formatInline(line.replace(/^[*-] /, ''))}</span>
      </div>
    )
    // Numbered list
    if (/^\d+\. /.test(line)) return (
      <div key={i} className="flex gap-2 my-0.5">
        <span className="text-purple-400 flex-shrink-0">
          {line.match(/^\d+/)?.[0]}.
        </span>
        <span>{formatInline(line.replace(/^\d+\. /, ''))}</span>
      </div>
    )
    // Empty line
    if (line.trim() === '') return <div key={i} className="h-1" />
    // Normal paragraph
    return (
      <p key={i} className="my-0.5 leading-relaxed">
        {formatInline(line)}
      </p>
    )
  })
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
          className="flex-1 text-sm text-[#a0a0b8] leading-relaxed overflow-y-auto"
        >
          <div className="space-y-0.5">
            {formatMarkdown(summary)}
          </div>
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
