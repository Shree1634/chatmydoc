import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { usePDFStore } from '../store/pdfStore';
import { useNavigate } from 'react-router-dom';

interface PDFUploadProps {
  onSuccess?: (pdfId: string) => void;
}

export default function PDFUpload({ onSuccess }: PDFUploadProps) {
  const { uploadPDF, isUploading } = usePDFStore();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setTitle(file.name.replace('.pdf', ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;
    const pdf = await uploadPDF(uploadedFile, title || undefined);
    if (pdf) {
      setUploaded(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(pdf._id);
        } else {
          navigate(`/pdf/${pdf._id}`);
        }
      }, 1000);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setTitle('');
    setUploaded(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="pdf-upload-wrapper">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="dropzone-icon">
              <Upload size={32} />
            </div>
            <h3 className="dropzone-title">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
            </h3>
            <p className="dropzone-sub">or click to browse — max 10MB</p>
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="file-preview"
          >
            <div className="file-info">
              <div className="file-icon"><FileText size={24} /></div>
              <div className="file-meta">
                <p className="file-name">{uploadedFile.name}</p>
                <p className="file-size">{formatSize(uploadedFile.size)}</p>
              </div>
              {!isUploading && !uploaded && (
                <button className="btn btn-ghost btn-sm" onClick={clearFile}>
                  <X size={16} />
                </button>
              )}
              {uploaded && <CheckCircle size={20} color="var(--success)" />}
            </div>

            {!uploaded && (
              <>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Document Title</label>
                  <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for this document"
                  />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <><div className="spinner" style={{ width: 16, height: 16 }} /> Uploading...</>
                  ) : 'Upload PDF'}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .pdf-upload-wrapper { width: 100%; }
        .dropzone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: var(--transition);
          background: var(--bg-secondary);
        }
        .dropzone:hover, .dropzone.active {
          border-color: var(--accent-purple);
          background: rgba(139,92,246,.05);
        }
        .dropzone-icon {
          width: 64px; height: 64px; border-radius: var(--radius-lg);
          background: rgba(139,92,246,.15);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem;
          color: var(--accent-purple);
        }
        .dropzone-title { font-size: 1.1rem; font-weight: 600; margin-bottom: .5rem; }
        .dropzone-sub { font-size: .85rem; color: var(--text-muted); }
        .file-preview {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          background: var(--bg-card);
        }
        .file-info { display: flex; align-items: center; gap: .75rem; }
        .file-icon {
          width: 44px; height: 44px; border-radius: var(--radius-md);
          background: rgba(139,92,246,.15); color: var(--accent-purple);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .file-meta { flex: 1; min-width: 0; }
        .file-name { font-weight: 500; font-size: .9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { font-size: .8rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
