import { create } from 'zustand';
import { askQuestionApi, getChatsApi, deleteChatApi } from '../api/chat.api';
import toast from 'react-hot-toast';

export interface ChatMessage {
  _id: string;
  pdfId: string;
  userId: string;
  question: string;
  response: string;
  createdAt: string;
}

interface ChatState {
  chats: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  fetchChats: (pdfId: string) => Promise<void>;
  sendMessage: (pdfId: string, question: string) => Promise<void>;
  deleteChat: (pdfId: string, chatId: string) => Promise<void>;
  clearChats: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  chats: [],
  isLoading: false,
  isSending: false,

  fetchChats: async (pdfId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await getChatsApi(pdfId);
      if (data.success) {
        set({ chats: data.data });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load chats');
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (pdfId: string, question: string) => {
    set({ isSending: true });
    // Optimistically add a placeholder
    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      _id: tempId,
      pdfId,
      userId: '',
      question,
      response: '',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ chats: [...state.chats, tempMsg] }));

    try {
      const { data } = await askQuestionApi(pdfId, question);
      if (data.success) {
        // Replace temp message with real one
        set((state) => ({
          chats: state.chats.map(c => c._id === tempId ? data.data : c),
        }));
      } else {
        // Remove temp on error
        set((state) => ({ chats: state.chats.filter(c => c._id !== tempId) }));
        toast.error(data.message || 'Failed to get answer');
      }
    } catch (err: any) {
      set((state) => ({ chats: state.chats.filter(c => c._id !== tempId) }));
      toast.error(err.response?.data?.message || 'Failed to get answer');
    } finally {
      set({ isSending: false });
    }
  },

  deleteChat: async (pdfId: string, chatId: string) => {
    try {
      const { data } = await deleteChatApi(pdfId, chatId);
      if (data.success) {
        set((state) => ({ chats: state.chats.filter(c => c._id !== chatId) }));
        toast.success('Message deleted');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  },

  clearChats: () => set({ chats: [] }),
}));
