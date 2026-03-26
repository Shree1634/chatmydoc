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

  useEffect(() => { if (id) fetchPDFById(id); }, [id, fetchPDFById]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  if (!currentPDF) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-center">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-[#a0a0b8]">PDF not found</h3>
          <Link to="/dashboard" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0ff]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6 flex-wrap">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-[#606078] hover:text-[#f0f0ff] hover:bg-[#16161f] transition-colors flex-shrink-0"
          >
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{currentPDF.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#606078]">
              <span>{formatSize(currentPDF.size)}</span>
              <span>•</span>
              <span>{new Date(currentPDF.uploadedAt).toLocaleDateString()}</span>
              <span>•</span>
              <a href={currentPDF.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                Open PDF ↗
              </a>
            </div>
          </div>
          <Link
            to={`/pdf/${id}/chat`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold btn-gradient text-white flex-shrink-0"
          >
            <MessageSquare size={14} /> Full Chat View
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#2a2a3a] mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all flex-shrink-0
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-[#606078] hover:text-[#a0a0b8]'
                }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={activeTab === 'chat' ? 'h-[65vh]' : 'min-h-[400px] max-h-[70vh] overflow-y-auto'}
        >
          {activeTab === 'chat' && <ChatWindow pdfId={id!} />}
          {activeTab === 'summary' && <SummaryPanel pdfId={id!} initialSummary={currentPDF.summary} />}
          {activeTab === 'flow' && <FlowPanel pdfId={id!} />}
          {activeTab === 'tables' && <TableViewer pdfId={id!} initialTables={currentPDF.tables} />}
          {activeTab === 'images' && <ImageGallery pdfId={id!} initialImages={currentPDF.images} />}
        </motion.div>
      </div>
    </div>
  );
}
