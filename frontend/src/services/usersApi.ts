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

// Admin-side payload for PUT /api/users/{id} (all fields required by the backend).
export type AdminUserUpdatePayload = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role_id: number;
  is_active: boolean;
};

export const usersApi = {
  updateMe: (payload: ProfilePayload) => api.put<User>('/api/users/me', payload),
  changePassword: (payload: PasswordPayload) => api.post('/api/users/me/password', payload),
  // --- admin ---
  adminList: () => api.get<User[]>('/api/users'),
  adminUpdate: (userId: number, payload: AdminUserUpdatePayload) =>
    api.put<User>(`/api/users/${userId}`, payload),
  adminDelete: (userId: number) => api.delete<{ ok: boolean }>(`/api/users/${userId}`),
};
