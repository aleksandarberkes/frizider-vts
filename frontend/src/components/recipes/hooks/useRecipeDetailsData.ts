import { useCallback, useEffect, useState } from 'react';
import { categoriesApi } from '../../../services/categoriesApi';
import { commentsApi } from '../../../services/commentsApi';
import { favoritesApi } from '../../../services/favoritesApi';
import { fridgeApi, FridgeIngredient } from '../../../services/fridgeApi';
import { ingredientsApi } from '../../../services/ingredientsApi';
import { ratingsApi } from '../../../services/ratingsApi';
import { recipesApi } from '../../../services/recipesApi';
import { mapApiError } from '../../../utils/mapApiError';
import {
  Category,
  FavoriteRecipe,
  IngredientOption,
  RatingAggregate,
  Recipe,
  RecipeComment,
  UserRating,
} from '../types';

export function useRecipeDetailsData(recipeId: number, userId?: number) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredientsCatalog, setIngredientsCatalog] = useState<IngredientOption[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const [ratingAggregate, setRatingAggregate] = useState<RatingAggregate | null>(null);
  const [fridgeIngredientIds, setFridgeIngredientIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!recipeId) {
      setPageError('Neispravan recept.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const [
        recipeResponse,
        commentsResponse,
        aggregateResponse,
        categoriesResponse,
        ingredientsResponse,
      ] = await Promise.all([
        recipesApi.get(recipeId),
        commentsApi.listForRecipe(recipeId),
        ratingsApi.getRecipeAggregate(recipeId),
        categoriesApi.list(),
        ingredientsApi.list(),
      ]);

      let favoritesResponse: FavoriteRecipe[] = [];
      let ratingsResponse: UserRating[] = [];
      let fridgeResponse: FridgeIngredient[] = [];

      if (userId) {
        [favoritesResponse, ratingsResponse, fridgeResponse] = await Promise.all([
          favoritesApi.list(),
          ratingsApi.listMine(),
          fridgeApi.list(),
        ]);
      }

      setRecipe(recipeResponse);
      setComments(commentsResponse);
      setRatingAggregate(aggregateResponse);
      setCategories(categoriesResponse);
      setIngredientsCatalog(ingredientsResponse);
      setFavoriteIds(favoritesResponse.map((entry) => entry.recipe_id));
      setUserRatings(
        ratingsResponse.reduce<Record<number, number>>((acc, entry) => {
          acc[entry.recipe_id] = entry.rating;
          return acc;
        }, {}),
      );
      setFridgeIngredientIds(new Set(fridgeResponse.map((item) => item.ingredient_id)));
    } catch (err) {
      setPageError(mapApiError(err, 'Ucitavanje recepta nije uspelo.'));
    } finally {
      setLoading(false);
    }
  }, [recipeId, userId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  return {
    recipe,
    comments,
    categories,
    ingredientsCatalog,
    favoriteIds,
    userRatings,
    ratingAggregate,
    fridgeIngredientIds,
    loading,
    pageError,
    setComments,
    setIngredientsCatalog,
    setFavoriteIds,
    setUserRatings,
    setRatingAggregate,
    setPageError,
    loadDetail,
  };
}
