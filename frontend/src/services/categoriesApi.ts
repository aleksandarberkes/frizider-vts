import { api } from '../api';
import { Category } from '../components/recipes/types';

export const categoriesApi = {
  list: () => api.get<Category[]>('/api/categories'),
  create: (name: string) => api.post<Category>('/api/categories', { name }),
  update: (categoryId: number, name: string) =>
    api.put<Category>(`/api/categories/${categoryId}`, { name }),
  delete: (categoryId: number) => api.delete<{ ok: boolean }>(`/api/categories/${categoryId}`),
};
