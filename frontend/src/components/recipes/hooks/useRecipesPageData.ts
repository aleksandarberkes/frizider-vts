import { useCallback, useEffect, useState } from 'react';
import { Category, FavoriteRecipe, IngredientOption, RatingAggregate, Recipe } from '../types';
import { categoriesApi } from '../../../services/categoriesApi';
import { favoritesApi } from '../../../services/favoritesApi';
import { ingredientsApi } from '../../../services/ingredientsApi';
import { ratingsApi } from '../../../services/ratingsApi';
import { recipesApi } from '../../../services/recipesApi';
import { mapApiError } from '../../../utils/mapApiError';

export function useRecipesPageData(userId?: number) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredientsCatalog, setIngredientsCatalog] = useState<IngredientOption[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [ratingSummary, setRatingSummary] = useState<Record<number, RatingAggregate>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setPageError(null);

    try {
      const [recipesResponse, categoriesResponse, ingredientsResponse] = await Promise.all([
        recipesApi.list(),
        categoriesApi.list(),
        ingredientsApi.list(),
      ]);

      let favoritesResponse: FavoriteRecipe[] = [];
      if (userId) {
        favoritesResponse = await favoritesApi.list();
      }

      const ratingEntries = await Promise.all(
        recipesResponse.map(async (recipe) => {
          const aggregate = await ratingsApi.getRecipeAggregate(recipe.id);
          return [recipe.id, aggregate] as const;
        }),
      );

      setRecipes(recipesResponse);
      setCategories(categoriesResponse);
      setIngredientsCatalog(ingredientsResponse);
      setFavoriteIds(favoritesResponse.map((entry) => entry.recipe_id));
      setRatingSummary(
        ratingEntries.reduce<Record<number, RatingAggregate>>((acc, [recipeId, aggregate]) => {
          acc[recipeId] = aggregate;
          return acc;
        }, {}),
      );
    } catch (err) {
      setPageError(mapApiError(err, 'Ucitavanje recepata nije uspelo.'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  return {
    recipes,
    categories,
    ingredientsCatalog,
    favoriteIds,
    ratingSummary,
    loading,
    pageError,
    setIngredientsCatalog,
    setFavoriteIds,
    setPageError,
    loadPageData,
  };
}
