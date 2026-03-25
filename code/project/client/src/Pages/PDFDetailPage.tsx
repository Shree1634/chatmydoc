import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Sparkles, GitBranch, Table, Image } from 'lucide-react';
import { usePDFStore } from '../store/pdfStore';
import Navbar from '../components/Navbar';
import ChatWindow from '../components/ChatWindow';
import SummaryPanel from '../components/SummaryPanel';
import FlowPanel from '../components/FlowPanel';
import TableViewer from '../components/TableViewer';
import ImageGallery from '../components/ImageGallery';

type Tab = 'chat' | 'summary' | 'flow' | 'tables' | 'images';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'flow', label: 'Flow', icon: GitBranch },
  { id: 'tables', label: 'Tables', icon: Table },
  { id: 'images', label: 'Images', icon: Image },
];

export default function PDFDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentPDF, isLoading, fetchPDFById } = usePDFStore();
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  useEffect(() => {
    if (id) fetchPDFById(id);
  }, [id, fetchPDFById]);

  if (isLoading) {
    return <div className="page-loader"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  if (!currentPDF) {
    return (
      <div className="page-loader">
        <div className="empty-state">
          <h3>PDF not found</h3>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="detail-page">
      <Navbar />

      <div className="container">
        {/* Page Header */}
        <div className="detail-header">
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="detail-info">
            <h1 className="detail-title">{currentPDF.title}</h1>
            <div className="detail-meta">
              <span>{formatSize(currentPDF.size)}</span>
              <span>•</span>
              <span>{new Date(currentPDF.uploadedAt).toLocaleDateString()}</span>
              <span>•</span>
              <a href={currentPDF.url} target="_blank" rel="noopener noreferrer" className="detail-link">
                Open PDF ↗
              </a>
            </div>
          </div>
          <Link to={`/pdf/${id}/chat`} className="btn btn-primary btn-sm">
            <MessageSquare size={14} /> Full Chat View
          </Link>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .2 }}
          className="tab-content"
        >
          {activeTab === 'chat' && (
            <div className="detail-chat-panel">
              <ChatWindow pdfId={id!} />
            </div>
          )}
          {activeTab === 'summary' && (
            <div className="detail-panel">
              <SummaryPanel pdfId={id!} initialSummary={currentPDF.summary} />
            </div>
          )}
          {activeTab === 'flow' && (
            <div className="detail-panel">
              <FlowPanel pdfId={id!} />
            </div>
          )}
          {activeTab === 'tables' && (
            <div className="detail-panel">
              <TableViewer pdfId={id!} initialTables={currentPDF.tables} />
            </div>
          )}
          {activeTab === 'images' && (
            <div className="detail-panel">
              <ImageGallery pdfId={id!} initialImages={currentPDF.images} />
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        .detail-page { min-height: 100vh; }
        .detail-page .container { padding: 1.5rem; }
        .detail-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
        .detail-info { flex: 1; }
        .detail-title { font-size: 1.3rem; font-weight: 700; margin-bottom: .3rem; }
        .detail-meta { display: flex; align-items: center; gap: .5rem; font-size: .8rem; color: var(--text-muted); flex-wrap: wrap; }
        .detail-link { color: var(--accent-purple); }
        .detail-link:hover { text-decoration: underline; }
        
        .tabs { display: flex; gap: .25rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; overflow-x: auto; }
        .tab-btn {
          display: flex; align-items: center; gap: .4rem;
          padding: .65rem 1rem; font-size: .875rem; font-weight: 500;
          color: var(--text-muted); background: transparent;
          border-bottom: 2px solid transparent; transition: var(--transition);
          white-space: nowrap; flex-shrink: 0;
        }
        .tab-btn:hover { color: var(--text-secondary); }
        .tab-btn.active { color: var(--accent-purple); border-bottom-color: var(--accent-purple); }
        
        .tab-content { min-height: 400px; }
        .detail-chat-panel { height: 65vh; min-height: 400px; }
        .detail-panel { min-height: 400px; max-height: 70vh; overflow-y: auto; }

        @media (max-width: 640px) {
          .detail-header { flex-direction: column; }
          .detail-chat-panel { height: 70vh; }
        }
      `}</style>
    </div>
  );
}
