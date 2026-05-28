import { api } from '../api';
import { RatingAggregate, UserRating } from '../components/recipes/types';

export const ratingsApi = {
  listMine: () => api.get<UserRating[]>('/api/ratings'),
  getRecipeAggregate: (recipeId: number) =>
    api.get<RatingAggregate>(`/api/ratings/recipe/${recipeId}`),
  rateRecipe: (recipeId: number, rating: number) =>
    api.post('/api/ratings', {
      recipe_id: recipeId,
      rating,
    }),
};
