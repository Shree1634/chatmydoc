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
        toast.success(
          data.data.images?.length ? `Found ${data.data.images.length} image(s)!` : 'No images found',
          { id: toastId }
        );
      } else {
        toast.error(data.message || 'Failed to extract images', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to extract images', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = async (url: string, index: number) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `page-${index + 1}.jpg`;
    link.click();
  };

  return (
    <div className="image-gallery">
      <div className="gallery-header">
        <div className="gallery-title">
          <Image size={18} color="var(--accent-purple)" />
          <span>Page Images</span>
          {images.length > 0 && <span className="badge badge-purple">{images.length}</span>}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchImages} disabled={isLoading}>
          {isLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Extracting...</> : <><RefreshCw size={14} /> {images.length ? 'Re-extract' : 'Extract Images'}</>}
        </button>
      </div>

      <div className="gallery-content">
        {images.length > 0 ? (
          <div className="gallery-grid">
            {images.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: .95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * .08 }}
                className="gallery-item"
              >
                <img
                  src={url}
                  alt={`Page ${i + 1}`}
                  className="gallery-image"
                  onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                />
                <div className="gallery-overlay">
                  <span className="page-label">Page {i + 1}</span>
                  <div className="gallery-actions">
                    <button className="gallery-action-btn" onClick={() => setLightboxUrl(url)} title="View full size">
                      <ZoomIn size={16} />
                    </button>
                    <button className="gallery-action-btn" onClick={() => downloadImage(url, i)} title="Download">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Image size={40} style={{ margin: '0 auto 1rem', opacity: .3 }} />
            <h3>No images extracted yet</h3>
            <p>Click "Extract Images" to render PDF pages as images</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="lightbox" onClick={() => setLightboxUrl(null)}>
          <button className="lightbox-close"><X size={24} /></button>
          <img src={lightboxUrl} alt="Full size" className="lightbox-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style>{`
        .image-gallery { height: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .gallery-header {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 1rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .gallery-title { display: flex; align-items: center; gap: .5rem; font-weight: 600; font-size: 1rem; }
        .gallery-content { flex: 1; overflow-y: auto; }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
        .gallery-item {
          position: relative; border-radius: var(--radius-md); overflow: hidden;
          aspect-ratio: 0.707; background: var(--bg-card); border: 1px solid var(--border);
          cursor: pointer; group: true;
        }
        .gallery-image { width: 100%; height: 100%; object-fit: cover; transition: var(--transition); }
        .gallery-item:hover .gallery-image { transform: scale(1.03); }
        .gallery-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 60%);
          opacity: 0; transition: var(--transition);
          display: flex; flex-direction: column; justify-content: flex-end; padding: .75rem;
        }
        .gallery-item:hover .gallery-overlay { opacity: 1; }
        .page-label { font-size: .75rem; font-weight: 600; color: rgba(255,255,255,.8); margin-bottom: .5rem; }
        .gallery-actions { display: flex; gap: .4rem; }
        .gallery-action-btn {
          width: 30px; height: 30px; border-radius: var(--radius-sm);
          background: rgba(255,255,255,.15); color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: var(--transition);
        }
        .gallery-action-btn:hover { background: rgba(255,255,255,.3); }
        .lightbox {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.92); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 2rem;
        }
        .lightbox-close {
          position: absolute; top: 1.5rem; right: 1.5rem;
          background: rgba(255,255,255,.1); color: #fff; border-radius: 50%;
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          transition: var(--transition);
        }
        .lightbox-close:hover { background: rgba(255,255,255,.2); }
        .lightbox-image { max-width: 90vw; max-height: 88vh; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); }
      `}</style>
    </div>
  );
}
