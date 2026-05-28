import { api } from '../api';
import { FavoriteRecipe } from '../components/recipes/types';

export const favoritesApi = {
  list: () => api.get<FavoriteRecipe[]>('/api/favorites'),
  add: (recipeId: number) => api.post('/api/favorites', { recipe_id: recipeId }),
  remove: (recipeId: number) => api.delete<{ ok: boolean }>(`/api/favorites/${recipeId}`),
};
