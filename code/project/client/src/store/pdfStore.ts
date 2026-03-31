import { create } from 'zustand';
import { uploadPDFApi, getAllPDFsApi, getPDFByIdApi, deletePDFApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

export interface PDFDocument {
  _id: string;
  title: string;
  originalFilename: string;
  url: string;
  size: number;
  summary: string;
  tables: Array<{ headers: string[]; rows: string[][] }>;
  images: string[];
  uploadedAt: string;
  chats: string[];
  chatCount?: number;
}

interface PDFState {
  pdfs: PDFDocument[];
  currentPDF: PDFDocument | null;
  isLoading: boolean;
  isUploading: boolean;
  fetchPDFs: () => Promise<void>;
  fetchPDFById: (id: string) => Promise<void>;
  uploadPDF: (file: File, title?: string) => Promise<PDFDocument | null>;
  deletePDF: (id: string) => Promise<void>;
  setCurrentPDF: (pdf: PDFDocument | null) => void;
}

export const usePDFStore = create<PDFState>()((set, get) => ({
  pdfs: [],
  currentPDF: null,
  isLoading: false,
  isUploading: false,

  fetchPDFs: async () => {
    set({ isLoading: true });
    try {
      const { data } = await getAllPDFsApi();
      if (data.success) {
        set({ pdfs: data.data });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch PDFs');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPDFById: async (id: string) => {
    set({ isLoading: true });
    try {
      const { data } = await getPDFByIdApi(id);
      if (data.success) {
        set({ currentPDF: data.data });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch PDF');
    } finally {
      set({ isLoading: false });
    }
  },

  uploadPDF: async (file: File, title?: string) => {
    set({ isUploading: true });
    const toastId = toast.loading('Uploading PDF...');
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      if (title) formData.append('title', title);

      const { data } = await uploadPDFApi(formData);
      if (data.success) {
        const newPDF = data.data;
        set((state) => ({ pdfs: [newPDF, ...state.pdfs] }));
        toast.success('PDF uploaded successfully!', { id: toastId });
        return newPDF;
      }
      toast.error(data.message || 'Upload failed', { id: toastId });
      return null;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
      return null;
    } finally {
      set({ isUploading: false });
    }
  },

  deletePDF: async (id: string) => {
    const toastId = toast.loading('Deleting PDF...');
    try {
      const { data } = await deletePDFApi(id);
      if (data.success) {
        set((state) => ({ pdfs: state.pdfs.filter(p => p._id !== id) }));
        toast.success('PDF deleted', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete', { id: toastId });
    }
  },

  setCurrentPDF: (pdf) => set({ currentPDF: pdf }),
}));
