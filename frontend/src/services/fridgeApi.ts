import { api } from '../api';

export type FridgeIngredient = {
  ingredient_id: number;
};

export const fridgeApi = {
  list: () => api.get<FridgeIngredient[]>('/api/fridge'),
};
