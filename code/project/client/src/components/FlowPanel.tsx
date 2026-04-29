import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, RefreshCw, ChevronRight } from 'lucide-react';
import { getFlowApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

interface FlowPanelProps {
  pdfId: string;
}

// ─── Inline Markdown Renderer ─────────────────────────────
const formatInline = (text: string): React.ReactNode[] => {
  // Capture **bold**, *italic*, `code` spans
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={i} className="italic text-[#c0c0d8]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-black/40 px-1 rounded text-xs font-mono text-green-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// ─── Line Parser ──────────────────────────────────────────
function parseLines(text: string): Array<{ nodes: React.ReactNode[]; type: 'heading' | 'bullet' | 'normal' }> {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => {
      // Markdown headings: #, ##, ###, ####
      if (/^#{1,4}\s/.test(l)) {
        const clean = l.replace(/^#{1,4}\s/, '');
        return { nodes: formatInline(clean), type: 'heading' as const };
      }
      // Numbered list: "1. ", "2. " etc.
      if (/^\d+\.\s/.test(l)) {
        const clean = l.replace(/^\d+\.\s/, '');
        return { nodes: formatInline(clean), type: 'heading' as const };
      }
      // Bullet: "- " or "* " or "• "
      if (/^[-*•]\s/.test(l)) {
        const clean = l.replace(/^[-*•]\s/, '');
        return { nodes: formatInline(clean), type: 'bullet' as const };
      }
      // Lines starting with **Text:** pattern — AI uses these as section headers
      if (/^\*\*[^*]+\*\*/.test(l)) {
        return { nodes: formatInline(l), type: 'heading' as const };
      }
      // Normal line
      return { nodes: formatInline(l), type: 'normal' as const };
    });
}

export default function FlowPanel({ pdfId }: FlowPanelProps) {
  const [flow, setFlow] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateFlow = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Generating document flow...');
    try {
      const { data } = await getFlowApi(pdfId);
      if (data.success) {
        setFlow(data.data.flow);
        toast.success('Flow generated!', { id: toastId });
      } else toast.error(data.message || 'Failed', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const items = flow ? parseLines(flow) : [];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between pb-4 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2 font-semibold text-[#f0f0ff]">
          <GitBranch size={17} className="text-blue-400" />
          Document Flow
        </div>
        <button
          onClick={generateFlow}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <><div className="spinner w-3 h-3" /> Generating...</>
            : <><RefreshCw size={12} /> {flow ? 'Regenerate' : 'Generate'}</>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {items.length > 0 ? (
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className={`text-sm leading-relaxed py-1 flex items-start gap-1.5
                  ${item.type === 'heading' ? 'font-semibold text-[#f0f0ff] pt-2' : ''}
                  ${item.type === 'bullet' ? 'text-[#a0a0b8] pl-2' : ''}
                  ${item.type === 'normal' ? 'text-[#606078] pl-4 text-xs' : ''}
                `}
              >
                {item.type === 'bullet' && <ChevronRight size={13} className="text-purple-400 flex-shrink-0 mt-0.5" />}
                <span className="flex flex-wrap items-baseline gap-x-0.5">{item.nodes}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
            <GitBranch size={40} className="text-[#2a2a3a]" />
            <div>
              <h3 className="font-semibold text-[#a0a0b8] mb-1">No flow generated yet</h3>
              <p className="text-sm text-[#606078]">Click "Generate" to create a structured outline</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
