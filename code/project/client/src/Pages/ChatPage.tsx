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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0ff] flex flex-col">
      <Navbar />

      {/* Sub-header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#2a2a3a] flex-wrap">
        <Link to={`/pdf/${id}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-[#606078] hover:text-[#f0f0ff] hover:bg-[#16161f] transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>
        <h1 className="flex-1 text-sm font-semibold truncate">{currentPDF.title}</h1>
        <a
          href={currentPDF.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16161f] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-colors"
        >
          <ExternalLink size={13} /> Open PDF
        </a>
      </div>

      {/* Split view */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 min-h-0 h-[calc(100vh-110px)]">
        <div className="h-full min-h-[400px]">
          <PDFViewer url={currentPDF.url} title={currentPDF.title} />
        </div>
        <div className="h-full min-h-[400px]">
          <ChatWindow pdfId={id!} />
        </div>
      </div>
    </div>
  );
}
