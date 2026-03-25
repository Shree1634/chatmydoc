import axiosInstance from '../lib/axiosInstance';

export const uploadPDFApi = (formData: FormData) =>
  axiosInstance.post('/api/pdfs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getAllPDFsApi = () =>
  axiosInstance.get('/api/pdfs');

export const getUserPDFsApi = () =>
  axiosInstance.get('/api/pdfs/my');

export const getPDFByIdApi = (id: string) =>
  axiosInstance.get(`/api/pdfs/${id}`);

export const deletePDFApi = (id: string) =>
  axiosInstance.delete(`/api/pdfs/${id}`);

export const summarizePDFApi = (id: string) =>
  axiosInstance.post(`/api/pdfs/${id}/summarize`);

export const askPDFQuestionApi = (id: string, question: string) =>
  axiosInstance.post(`/api/pdfs/${id}/ask`, { question });

export const getPDFFlowApi = (id: string) =>
  axiosInstance.get(`/api/pdfs/${id}/flow`);

export const getPDFTablesApi = (id: string) =>
  axiosInstance.get(`/api/pdfs/${id}/tables`);

export const getPDFImagesApi = (id: string) =>
  axiosInstance.get(`/api/pdfs/${id}/images`);
