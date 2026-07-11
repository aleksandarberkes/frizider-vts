import { api } from '../api';
import { User } from '../auth/types';

export type RegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type RegisterResult = {
  status: string;
  message: string;
  email: string;
};

export type AuthMessage = {
  status: string;
  message: string;
};

export const authApi = {
  me: () => api.get<User>('/api/auth/me'),
  login: (email: string, password: string) =>
    api.post<User>('/api/auth/login', { email, password }),
  register: (payload: RegisterPayload) =>
    api.post<RegisterResult>('/api/auth/register', payload),
  logout: () => api.post('/api/auth/logout'),
  activate: (token: string) =>
    api.post<AuthMessage>('/api/auth/activate', { token }),
  forgotPassword: (email: string) =>
    api.post<AuthMessage>('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<AuthMessage>('/api/auth/reset-password', { token, password }),
};
