import { api } from '../api';
import { User } from '../auth/types';

export type RegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export const authApi = {
  me: () => api.get<User>('/api/auth/me'),
  login: (email: string, password: string) =>
    api.post<User>('/api/auth/login', { email, password }),
  register: (payload: RegisterPayload) => api.post('/api/auth/register', payload),
  logout: () => api.post('/api/auth/logout'),
};
