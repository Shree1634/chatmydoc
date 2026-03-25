import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { usePDFStore } from '../store/pdfStore';
import Navbar from '../components/Navbar';
import PDFViewer from '../components/PDFViewer';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { currentPDF, isLoading, fetchPDFById } = usePDFStore();

  useEffect(() => {
    if (id) fetchPDFById(id);
  }, [id, fetchPDFById]);

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!currentPDF) {
    return (
      <div className="page-loader">
        <div className="empty-state">
          <h3>PDF not found</h3>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <Navbar />

      <div className="chat-page-header container">
        <Link to={`/pdf/${id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back to Document
        </Link>
        <h1 className="chat-page-title">{currentPDF.title}</h1>
        <a href={currentPDF.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          <ExternalLink size={14} /> Open PDF
        </a>
      </div>

      <div className="chat-layout container">
        <div className="chat-pdf-panel">
          <PDFViewer url={currentPDF.url} title={currentPDF.title} />
        </div>
        <div className="chat-panel">
          <ChatWindow pdfId={id!} />
        </div>
      </div>

      <style>{`
        .chat-page { min-height: 100vh; display: flex; flex-direction: column; }
        .chat-page-header {
          display: flex; align-items: center; gap: 1rem; padding: .75rem 1.5rem;
          border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .chat-page-title {
          flex: 1; font-size: 1rem; font-weight: 600;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chat-layout {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1rem; padding: 1rem 1.5rem;
          flex: 1; min-height: 0;
          height: calc(100vh - 120px);
        }
        .chat-pdf-panel, .chat-panel { height: 100%; min-height: 500px; }
        @media (max-width: 768px) {
          .chat-layout { grid-template-columns: 1fr; height: auto; }
          .chat-pdf-panel { height: 50vh; }
          .chat-panel { height: 60vh; }
        }
      `}</style>
    </div>
  );
}
