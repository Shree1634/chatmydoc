import axiosInstance from '../lib/axiosInstance';

export const askQuestionApi = (pdfId: string, question: string) =>
  axiosInstance.post(`/api/chats/${pdfId}/chat`, { question });

export const getChatsApi = (pdfId: string) =>
  axiosInstance.get(`/api/chats/${pdfId}/chats`);

export const deleteChatApi = (pdfId: string, chatId: string) =>
  axiosInstance.delete(`/api/chats/${pdfId}/chats/${chatId}`);
