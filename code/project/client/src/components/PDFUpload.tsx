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
        if (onSuccess) onSuccess(pdf._id);
        else navigate(`/pdf/${pdf._id}`);
      }, 800);
    }
  };

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const clearFile = () => { setUploadedFile(null); setTitle(''); setUploaded(false); };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
              ${isDragActive
                ? 'border-purple-500 bg-purple-500/5'
                : 'border-[#2a2a3a] bg-[#111118] hover:border-purple-500/50 hover:bg-purple-500/5'
              }`}
          >
            <input {...getInputProps()} />
            <div className="w-14 h-14 bg-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Upload size={28} />
            </div>
            <h3 className="font-semibold text-[#f0f0ff] mb-1">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
            </h3>
            <p className="text-sm text-[#606078]">or click to browse — max 10MB</p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-4 flex flex-col gap-4"
          >
            {/* File info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/15 text-purple-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f0f0ff] truncate">{uploadedFile.name}</p>
                <p className="text-xs text-[#606078]">{formatSize(uploadedFile.size)}</p>
              </div>
              {!isUploading && !uploaded && (
                <button onClick={clearFile} className="p-1 rounded text-[#606078] hover:text-[#f0f0ff] transition-colors">
                  <X size={16} />
                </button>
              )}
              {uploaded && <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />}
            </div>

            {!uploaded && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#a0a0b8]">Document Title</label>
                  <input
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter a title for this document"
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full btn-gradient py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? <><div className="spinner w-4 h-4" /> Uploading...</> : 'Upload PDF'}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
