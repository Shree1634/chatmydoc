import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Highlighter, RefreshCw } from 'lucide-react';
import { getAnnotationsApi } from '../api/pdf.api';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker using local bundle via Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface AnnotationsPanelProps {
  pdfId: string;
  url: string;
}

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();

function PDFPage({ pageNum, pdfDoc, sentences }: { pageNum: number, pdfDoc: any, sentences: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let renderTask: any;
    let isMounted = true;
    
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });
        if (isMounted) setDimensions({ w: viewport.width, h: viewport.height });

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          renderTask = page.render({ canvasContext: context, viewport });
          await renderTask.promise;
        }

        const textContent = await page.getTextContent();
        const items = textContent.items as any[];
        
        let fullText = '';
        const charToItem: number[] = [];
        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          const str = item.str + (item.hasEOL ? ' ' : '');
          for (let c = 0; c < str.length; c++) {
            charToItem.push(j);
          }
          fullText += str;
        }

        const pageHighlights: any[] = [];
        const normFullText = normalizeText(fullText);

        for (const sentence of sentences) {
          if (!sentence.trim()) continue;
          
          // Try to match sentence words
          const regexStr = sentence.trim().split(/\s+/).map(w => w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('\\s+');
          const regex = new RegExp(regexStr, 'gi');
          
          let match;
          let matchedAny = false;
          while ((match = regex.exec(fullText)) !== null) {
            matchedAny = true;
            addHighlightsForMatch(match.index, match[0].length);
          }

          // Fallback: match first 8 words if exact match fails
          if (!matchedAny) {
             const words = sentence.trim().split(/\s+/).slice(0, 8);
             if (words.length >= 6) {
               const fallbackRegexStr = words.map(w => w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('\\s+');
               const fallbackRegex = new RegExp(fallbackRegexStr, 'gi');
               let fbMatch;
               while ((fbMatch = fallbackRegex.exec(fullText)) !== null) {
                 addHighlightsForMatch(fbMatch.index, fbMatch[0].length);
               }
             }
          }
        }

        function addHighlightsForMatch(startIndex: number, length: number) {
          const startChar = startIndex;
          const endChar = startIndex + length - 1;
          const startItemIdx = charToItem[startChar];
          const endItemIdx = charToItem[endChar];
          
          if (startItemIdx === undefined || endItemIdx === undefined) return;
          
          for(let idx = startItemIdx; idx <= endItemIdx; idx++) {
            const item = items[idx];
            if (!item || !item.str.trim()) continue;
            
            const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
            const width = item.width * viewport.scale;
            const height = (item.height || Math.abs(item.transform[3])) * viewport.scale;

            pageHighlights.push({
              x: vx,
              y: vy - height * 0.85, 
              w: width,
              h: height * 1.2
            });
          }
        }

        if (isMounted) setHighlights(pageHighlights);
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('[PDFPage] Render error:', err);
        }
      }
    };
    
    renderPage();
    return () => {
      isMounted = false;
      if (renderTask) renderTask.cancel();
    };
  }, [pageNum, pdfDoc, sentences]);

  return (
    <div className="relative mb-6 mx-auto bg-white shadow-md border border-[#2a2a3a]" style={{ width: dimensions.w || 'auto', height: dimensions.h || 'auto', minHeight: 200 }}>
       <canvas ref={canvasRef} className="block" />
       {highlights.map((h, i) => (
         <div key={i} className="absolute pointer-events-none" style={{ left: h.x, top: h.y, width: h.w, height: h.h, backgroundColor: 'rgba(255, 235, 59, 0.4)' }} />
       ))}
    </div>
  )
}

export default function AnnotationsPanel({ pdfId, url }: AnnotationsPanelProps) {
  const [sentences, setSentences] = useState<string[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [progress, setProgress] = useState('');

  const generateAnnotations = async (force = false) => {
    setIsLoading(true);
    setAttempted(true);
    setProgress('Fetching important sentences from AI...');
    const toastId = toast.loading('Generating annotations...');
    
    try {
      const { data } = await getAnnotationsApi(pdfId, force);
      if (data.success && data.data.sentences) {
        setSentences(data.data.sentences);
        if (data.data.sentences.length > 0) {
          toast.success('Annotations generated!', { id: toastId });
          loadPDF();
        } else {
          toast.error('No key sections identified', { id: toastId });
          setIsLoading(false);
        }
      } else {
        toast.error(data.message || 'Failed', { id: toastId });
        setIsLoading(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed', { id: toastId });
      setIsLoading(false);
    }
  };

  const loadPDF = async () => {
    setProgress('Loading PDF document...');
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
    } catch (err) {
      console.error('Failed to load PDF for annotations', err);
      toast.error('Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch if not attempted
  useEffect(() => {
    if (!attempted && !isLoading) {
      generateAnnotations(false);
    }
  }, [attempted]);

  const numPages = pdfDoc ? Math.min(pdfDoc.numPages, 15) : 0;
  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between pb-4 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2 font-semibold text-[#f0f0ff]">
          <Highlighter size={17} className="text-yellow-400" />
          Document Annotations
        </div>
        <div className="flex gap-2">
          {sentences.length > 0 && (
            <button
              onClick={() => generateAnnotations(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#606078] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Force Re-generate
            </button>
          )}
          <button
            onClick={() => generateAnnotations(false)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><div className="spinner w-3 h-3" /> Generating...</>
              : <><RefreshCw size={12} /> {sentences.length ? 'Re-generate' : 'Generate Annotations'}</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#16161f] rounded-xl p-4 border border-[#2a2a3a]">
        {isLoading && !pdfDoc ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="spinner w-8 h-8" />
            <p className="text-sm text-[#a0a0b8]">{progress}</p>
          </div>
        ) : pdfDoc && sentences.length > 0 ? (
          <div className="flex flex-col">
            {pdfDoc.numPages > 15 && (
              <div className="bg-yellow-500/10 text-yellow-400 text-xs px-3 py-2 rounded-lg text-center mb-4">
                Showing annotations for the first 15 pages for performance.
              </div>
            )}
            {pages.map(p => (
              <PDFPage key={p} pageNum={p} pdfDoc={pdfDoc} sentences={sentences} />
            ))}
          </div>
        ) : attempted && sentences.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Highlighter size={40} className="text-[#2a2a3a]" />
            <div>
              <h3 className="font-semibold text-[#a0a0b8] mb-1">No key sections identified in this document</h3>
            </div>
          </div>
        ) : attempted && sentences.length > 0 && !pdfDoc ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Highlighter size={40} className="text-red-500/80" />
            <div>
              <h3 className="font-semibold text-[#a0a0b8] mb-1">Failed to load PDF viewer</h3>
              <p className="text-sm text-[#606078]">Annotations were generated, but the document could not be rendered.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
