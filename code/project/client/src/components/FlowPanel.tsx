import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, RefreshCw, ChevronRight } from 'lucide-react';
import { getPDFFlowApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

interface FlowPanelProps {
  pdfId: string;
}

function parseFlowItems(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
}

function renderFlowLine(line: string, index: number) {
  const isHeading = /^#{1,4}\s/.test(line) || /^\d+\.\s/.test(line) || /^[A-Z][^a-z]/.test(line);
  const isBullet = /^[-*•]\s/.test(line);
  const cleanLine = line.replace(/^#{1,4}\s/, '').replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '');

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flow-item ${isHeading ? 'flow-heading' : isBullet ? 'flow-bullet' : 'flow-text'}`}
    >
      {isBullet && <ChevronRight size={14} className="flow-chevron" />}
      <span>{cleanLine}</span>
    </motion.div>
  );
}

export default function FlowPanel({ pdfId }: FlowPanelProps) {
  const [flow, setFlow] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateFlow = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Generating document flow...');
    try {
      const { data } = await getPDFFlowApi(pdfId);
      if (data.success) {
        setFlow(data.data.flow);
        toast.success('Flow generated!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to generate flow', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate flow', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const flowItems = flow ? parseFlowItems(flow) : [];

  return (
    <div className="flow-panel">
      <div className="flow-header">
        <div className="flow-title">
          <GitBranch size={18} color="var(--accent-blue)" />
          <span>Document Flow</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={generateFlow} disabled={isLoading}>
          {isLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Generating...</> : <><RefreshCw size={14} /> {flow ? 'Regenerate' : 'Generate'}</>}
        </button>
      </div>

      <div className="flow-content">
        {flowItems.length > 0 ? (
          <AnimatePresence>
            {flowItems.map((line, i) => renderFlowLine(line, i))}
          </AnimatePresence>
        ) : (
          <div className="empty-state">
            <GitBranch size={40} style={{ margin: '0 auto 1rem', opacity: .3 }} />
            <h3>No flow generated yet</h3>
            <p>Click "Generate" to create a structured outline of this document</p>
          </div>
        )}
      </div>

      <style>{`
        .flow-panel { height: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .flow-header {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 1rem; border-bottom: 1px solid var(--border);
        }
        .flow-title { display: flex; align-items: center; gap: .5rem; font-weight: 600; font-size: 1rem; }
        .flow-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .3rem; }
        .flow-item { display: flex; align-items: flex-start; gap: .5rem; padding: .3rem 0; font-size: .9rem; line-height: 1.6; }
        .flow-heading { font-weight: 600; color: var(--text-primary); font-size: .95rem; padding: .5rem 0 .2rem; }
        .flow-bullet { color: var(--text-secondary); padding-left: .5rem; }
        .flow-text { color: var(--text-muted); padding-left: 1rem; font-size: .85rem; }
        .flow-chevron { color: var(--accent-purple); flex-shrink: 0; margin-top: 3px; }
      `}</style>
    </div>
  );
}
