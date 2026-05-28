import { api } from '../api';
import { Recipe } from '../components/recipes/types';

export type RecipePayload = {
  name: string;
  description: string;
  image_path: string;
  estimated_price: number | null;
  ingredients: {
    ingredient_id: number;
    quantity: number | null;
  }[];
  categories: number[];
  is_approved?: boolean;
};

export const recipesApi = {
  list: () => api.get<Recipe[]>('/api/recipes'),
  get: (recipeId: number) => api.get<Recipe>(`/api/recipes/${recipeId}`),
  create: (payload: RecipePayload) => api.post<Recipe>('/api/recipes', payload),
  update: (recipeId: number, payload: RecipePayload) =>
    api.put<Recipe>(`/api/recipes/${recipeId}`, payload),
  delete: (recipeId: number) => api.delete<{ ok: boolean }>(`/api/recipes/${recipeId}`),
  uploadImage: (body: FormData) => api.upload<{ path: string }>('/api/uploads', body),
};
