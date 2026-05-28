import { useCallback, useEffect, useState } from 'react';
import { Recipe } from '../../recipes/types';
import { recipesApi } from '../../../services/recipesApi';
import { mapAdminError } from './mapAdminError';

function useAdminRecipes() {
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const loadPendingRecipes = useCallback(async () => {
    setLoadingRecipes(true);

    try {
      const recipes = await recipesApi.list();
      setPendingRecipes(recipes.filter((recipe) => !recipe.is_approved));
      setRecipesError(null);
    } catch (err) {
      setRecipesError(mapAdminError(err, 'Ucitavanje recepata za objavu nije uspelo.'));
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  useEffect(() => {
    void loadPendingRecipes();
  }, [loadPendingRecipes]);

  const approveRecipe = useCallback(async (recipe: Recipe) => {
    setApprovingId(recipe.id);
    setRecipesError(null);

    try {
      await recipesApi.update(recipe.id, {
        name: recipe.name,
        description: recipe.description ?? '',
        image_path: recipe.image_path ?? '',
        estimated_price: recipe.estimated_price,
        categories: recipe.categories.map((category) => category.category_id ?? category.id).filter(Boolean),
        ingredients: recipe.ingredients.map((ingredient) => ({
          ingredient_id: ingredient.ingredient_id,
          quantity: ingredient.quantity,
        })),
        is_approved: true,
      });

      setPendingRecipes((current) => current.filter((entry) => entry.id !== recipe.id));
    } catch (err) {
      setRecipesError(mapAdminError(err, 'Odobravanje recepta nije uspelo.'));
    } finally {
      setApprovingId(null);
    }
  }, []);

  return {
    pendingRecipes,
    loadingRecipes,
    recipesError,
    approvingId,
    loadPendingRecipes,
    approveRecipe,
  };
}

export default useAdminRecipes;
