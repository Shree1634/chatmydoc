import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, RefreshCw, Download } from 'lucide-react';
import { getPageImagesApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

interface PagesPanelProps {
  pdfId: string;
}

export default function PagesPanel({ pdfId }: PagesPanelProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const generatePages = async (force = false) => {
    setIsLoading(true);
    setAttempted(true);
    const toastId = toast.loading('Rendering pages (this may take a moment)...');
    
    try {
      const { data } = await getPageImagesApi(pdfId, force);
      if (data.success && data.data.pages) {
        setPages(data.data.pages);
        if (data.data.pages.length > 0) {
          toast.success('Pages rendered!', { id: toastId });
        } else {
          toast.error('No pages could be rendered', { id: toastId });
        }
      } else {
        toast.error(data.message || 'Failed', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!attempted && !isLoading) {
      generatePages(false);
    }
  }, [attempted]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between pb-4 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2 font-semibold text-[#f0f0ff]">
          <ImageIcon size={17} className="text-blue-400" />
          Document Pages
        </div>
        <div className="flex gap-2">
          {pages.length > 0 && (
            <button
              onClick={() => generatePages(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#606078] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Force Re-generate
            </button>
          )}
          <button
            onClick={() => generatePages(false)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><div className="spinner w-3 h-3" /> Rendering...</>
              : <><RefreshCw size={12} /> {pages.length ? 'Re-generate' : 'Generate Pages'}</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#16161f] rounded-xl p-4 border border-[#2a2a3a]">
        {isLoading && pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="spinner w-8 h-8" />
            <p className="text-sm text-[#a0a0b8]">Rendering pages...</p>
          </div>
        ) : pages.length > 0 ? (
          <div className="flex flex-col gap-4">
             {pages.length === 15 && (
              <div className="bg-yellow-500/10 text-yellow-400 text-xs px-3 py-2 rounded-lg text-center">
                Showing first 15 pages for performance.
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {pages.map((pageUrl, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-[#2a2a3a] bg-[#1a1a24] aspect-[1/1.4] flex items-center justify-center">
                  <img
                    src={pageUrl}
                    alt={`Page ${i + 1}`}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <a
                      href={pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                      title="Open full size"
                    >
                      <ImageIcon size={20} />
                    </a>
                    <a
                      href={pageUrl}
                      download={`page-${i + 1}.png`}
                      className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                      title="Download"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-medium text-white/80">
                    Pg {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : attempted ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <ImageIcon size={40} className="text-[#2a2a3a]" />
            <div>
              <h3 className="font-semibold text-[#a0a0b8] mb-1">No pages rendered yet</h3>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
