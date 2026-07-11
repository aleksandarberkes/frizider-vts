import { api } from '../api';
import { IngredientOption } from '../components/recipes/types';

export const ingredientsApi = {
  list: () => api.get<IngredientOption[]>('/api/ingredients'),
  create: (name: string, unit: string) =>
    api.post<IngredientOption>('/api/ingredients', {
      name,
      unit,
    }),
  update: (id: number, name: string, unit: string) =>
    api.put<IngredientOption>(`/api/ingredients/${id}`, { name, unit }),
  remove: (id: number) => api.delete<{ ok: boolean }>(`/api/ingredients/${id}`),
};
