import axiosInstance from '../lib/axiosInstance';

export const uploadPDFApi = (formData: FormData) =>
  axiosInstance.post('/api/pdfs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getAllPDFsApi = () =>
  axiosInstance.get('/api/pdfs/my')

export const getPDFByIdApi = (id: string) =>
  axiosInstance.get(`/api/pdfs/${id}`)

export const deletePDFApi = (id: string) =>
  axiosInstance.delete(`/api/pdfs/${id}`)

export const summarizePDFApi = (id: string) =>
  axiosInstance.post(`/api/pdfs/${id}/summarize`)

export const askQuestionApi = (id: string, question: string) =>
  axiosInstance.post(`/api/pdfs/${id}/ask`, { question })

export const getFlowApi = (id: string) =>
  axiosInstance.get(`/api/pdfs/${id}/flow`)

export const getTablesApi = (id: string, force = false) =>
  axiosInstance.get(`/api/pdfs/${id}/tables${force ? '?force=true' : ''}`)

export const getAnnotationsApi = (id: string, force = false) =>
  axiosInstance.get(`/api/pdfs/${id}/annotations${force ? '?force=true' : ''}`)

export const getPageImagesApi = (id: string, force = false) =>
  axiosInstance.get(`/api/pdfs/${id}/pages${force ? '?force=true' : ''}`)
