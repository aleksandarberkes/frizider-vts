import { api } from '../api';
import { IngredientOption } from '../components/recipes/types';

export const ingredientsApi = {
  list: () => api.get<IngredientOption[]>('/api/ingredients'),
  create: (name: string, unit: string) =>
    api.post<IngredientOption>('/api/ingredients', {
      name,
      unit,
    }),
};
