import { api } from '../api';
import { User } from '../auth/types';

export type ProfilePayload = {
  first_name: string;
  last_name: string;
  phone: string;
};

export type PasswordPayload = {
  current_password: string;
  new_password: string;
};

export const usersApi = {
  updateMe: (payload: ProfilePayload) => api.put<User>('/api/users/me', payload),
  changePassword: (payload: PasswordPayload) => api.post('/api/users/me/password', payload),
};
