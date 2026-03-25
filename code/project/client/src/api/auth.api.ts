import axiosInstance from '../lib/axiosInstance';

export const loginApi = (data: { email: string; password: string }) =>
  axiosInstance.post('/api/auth/login', data);

export const registerApi = (data: { username: string; email: string; password: string }) =>
  axiosInstance.post('/api/auth/register', data);

export const logoutApi = () =>
  axiosInstance.post('/api/auth/logout');

export const refreshTokenApi = (refreshToken: string) =>
  axiosInstance.post('/api/auth/refresh', { refreshToken });

export const getProfileApi = () =>
  axiosInstance.get('/api/auth/profile');

export const updateProfileApi = (data: { username?: string; email?: string; currentPassword?: string; newPassword?: string }) =>
  axiosInstance.put('/api/auth/profile', data);
