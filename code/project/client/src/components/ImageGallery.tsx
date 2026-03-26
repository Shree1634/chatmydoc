import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Download, RefreshCw, ZoomIn, X } from 'lucide-react';
import { getPDFImagesApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

interface ImageGalleryProps {
  pdfId: string;
  initialImages?: string[];
}

export default function ImageGallery({ pdfId, initialImages }: ImageGalleryProps) {
  const [images, setImages] = useState<string[]>(initialImages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Extracting images...');
    try {
      const { data } = await getPDFImagesApi(pdfId);
      if (data.success) {
        setImages(data.data.images || []);
        toast.success(data.data.images?.length ? `Found ${data.data.images.length} image(s)!` : 'No images found', { id: toastId });
      } else toast.error(data.message || 'Failed', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = async (url: string, i: number) => {
    const blob = await (await fetch(url)).blob();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `page-${i + 1}.jpg` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between pb-4 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2 font-semibold text-[#f0f0ff]">
          <Image size={17} className="text-purple-400" />
          Page Images
          {images.length > 0 && (
            <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full font-semibold">{images.length}</span>
          )}
        </div>
        <button
          onClick={fetchImages}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <><div className="spinner w-3 h-3" /> Extracting...</>
            : <><RefreshCw size={12} /> {images.length ? 'Re-extract' : 'Extract Images'}</>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="group relative aspect-[0.707] bg-[#16161f] border border-[#2a2a3a] rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setLightboxUrl(url)}
              >
                <img
                  src={url}
                  alt={`Page ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                  <span className="text-xs font-semibold text-white/80 mb-1.5">Page {i + 1}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={e => { e.stopPropagation(); setLightboxUrl(url); }}
                      className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/30 transition-colors"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); downloadImage(url, i); }}
                      className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/30 transition-colors"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Image size={40} className="text-[#2a2a3a]" />
            <div>
              <h3 className="font-semibold text-[#a0a0b8] mb-1">No images extracted yet</h3>
              <p className="text-sm text-[#606078]">Click "Extract Images" to render PDF pages as images</p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-[90vw] max-h-[88vh] rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
