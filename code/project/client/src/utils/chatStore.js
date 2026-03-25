import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

const useChatStore = create((set, get) => ({
  messages: [],
  currentPdf: null,
  pdfs: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,

  setError: (error) => set({ error }),

  // Helper to extract nice error messages
  getErrorMessage: (error) => {
    return error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
  },

  fetchPDFs: async (userId) => {
    try {
      set({ error: null });
      const { data } = await api.get(`/api/pdfs/${userId}/pdfs`);
      set({ pdfs: data.data });
    } catch (error) {
      const message = get().getErrorMessage(error);
      console.error('Failed to fetch PDFs:', message);
      set({ error: message });
    }
  },

  uploadPDF: async (file, userId) => {
    try {
      set({ isUploading: true, error: null, uploadProgress: 0 });
      const formData = new FormData();
      // Change field name to 'pdf' to match server configuration
      formData.append('pdf', file);
      formData.append('userId', userId);
      formData.append('title', file.name);

      const { data } = await api.post('/api/pdfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          const progress = Math.round((event.loaded * 100) / event.total);
          set({ uploadProgress: progress });
        },
      });

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      set(state => ({
        pdfs: [data.data, ...state.pdfs], // Add new PDF to start of list
        currentPdf: data.data
      }));

      return data.data;
    } catch (error) {
      const message = get().getErrorMessage(error);
      console.error('Failed to upload PDF:', message);
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isUploading: false, uploadProgress: 0 });
    }
  },

  deletePDF: async (pdfId) => {
    try {
      set({ error: null });
      await api.delete(`/api/pdfs/${pdfId}`);
      set(state => ({
        pdfs: state.pdfs.filter(pdf => pdf._id !== pdfId),
        currentPdf: state.currentPdf?._id === pdfId ? null : state.currentPdf
      }));
    } catch (error) {
      const message = get().getErrorMessage(error);
      console.error('Failed to delete PDF:', message);
      set({ error: message });
    }
  },

  askQuestion: async (question) => {
    const { currentPdf } = get();
    if (!currentPdf) return;

    try {
      set({ isLoading: true, error: null });
      // Function to add messages safely
      const addMessage = (msg) => set(state => ({ messages: [...state.messages, msg] }));

      addMessage({ type: 'user', content: question });

      const { data } = await api.post(`/api/pdfs/${currentPdf._id}/ask`, { question });

      addMessage({ type: 'bot', content: data.data.response });
    } catch (error) {
      const message = get().getErrorMessage(error);
      console.error('Failed to get answer:', message);
      set({ error: message });

      // Identify if it's a context length error for better user feedback
      let userFriendlyError = message;
      if (message.includes('400') || message.includes('too large')) {
        userFriendlyError = "The document is too large for the AI to process in one go. We're working on optimization.";
      }

      set(state => ({
        messages: [...state.messages, { type: 'error', content: `Error: ${userFriendlyError}` }]
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  generateFlow: async (pdfId) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get(`/api/pdfs/${pdfId}/flow`);
      return data.data.flow;
    } catch (error) {
      const message = get().getErrorMessage(error);
      console.error('Failed to generate flow:', message);
      set({ error: message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentPdf: (pdf) => set({ currentPdf: pdf, messages: [], error: null }),
  clearChat: () => set({ messages: [], currentPdf: null, error: null }),
}));

export default useChatStore;