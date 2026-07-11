import { api } from '../api';
import { FridgeRecipeMatch } from '../components/recipes/types';

export type FridgeIngredient = {
  ingredient_id: number;
  name: string;
  unit: string;
};

export const fridgeApi = {
  list: () => api.get<FridgeIngredient[]>('/api/fridge'),
  add: (ingredientId: number) =>
    api.post<{ user_id: number; ingredient_id: number }>('/api/fridge', {
      ingredient_id: ingredientId,
    }),
  remove: (ingredientId: number) =>
    api.delete<{ ok: boolean }>(`/api/fridge/${ingredientId}`),
  match: () => api.get<FridgeRecipeMatch[]>('/api/fridge/match'),
};
