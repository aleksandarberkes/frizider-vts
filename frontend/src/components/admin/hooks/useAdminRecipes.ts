import { useCallback, useEffect, useState } from 'react';
import { Recipe } from '../../recipes/types';
import { recipesApi, RecipePayload } from '../../../services/recipesApi';
import { mapAdminError } from './mapAdminError';

// Build a full update payload from an existing recipe, overriding approval bits.
const toPayload = (
  recipe: Recipe,
  overrides: Pick<RecipePayload, 'is_approved'> & { rejection_reason?: string },
): RecipePayload => ({
  name: recipe.name,
  description: recipe.description ?? '',
  image_path: recipe.image_path ?? '',
  estimated_price: recipe.estimated_price,
  categories: recipe.categories
    .map((category) => category.category_id ?? category.id)
    .filter((id): id is number => typeof id === 'number'),
  ingredients: recipe.ingredients.map((ingredient) => ({
    ingredient_id: ingredient.ingredient_id,
    quantity: ingredient.quantity,
  })),
  ...overrides,
});

function useAdminRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [recipeBusyId, setRecipeBusyId] = useState<number | null>(null);

  const loadRecipes = useCallback(async () => {
    setLoadingRecipes(true);

    try {
      // Admins receive every recipe (approved + pending) from this endpoint.
      const response = await recipesApi.list();
      setRecipes(response);
      setRecipesError(null);
    } catch (err) {
      setRecipesError(mapAdminError(err, 'Ucitavanje recepata nije uspelo.'));
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  const approveRecipe = useCallback(async (recipe: Recipe) => {
    setRecipeBusyId(recipe.id);
    setRecipesError(null);

    try {
      const updated = await recipesApi.update(recipe.id, toPayload(recipe, { is_approved: true }));
      setRecipes((current) => current.map((entry) => (entry.id === recipe.id ? updated : entry)));
    } catch (err) {
      setRecipesError(mapAdminError(err, 'Odobravanje recepta nije uspelo.'));
    } finally {
      setRecipeBusyId(null);
    }
  }, []);

  const rejectRecipe = useCallback(async (recipe: Recipe, reason: string) => {
    setRecipeBusyId(recipe.id);
    setRecipesError(null);

    try {
      const updated = await recipesApi.update(
        recipe.id,
        toPayload(recipe, { is_approved: false, rejection_reason: reason }),
      );
      setRecipes((current) => current.map((entry) => (entry.id === recipe.id ? updated : entry)));
    } catch (err) {
      setRecipesError(mapAdminError(err, 'Odbijanje recepta nije uspelo.'));
    } finally {
      setRecipeBusyId(null);
    }
  }, []);

  const deleteRecipe = useCallback(async (recipeId: number) => {
    setRecipeBusyId(recipeId);
    setRecipesError(null);

    try {
      await recipesApi.delete(recipeId);
      setRecipes((current) => current.filter((entry) => entry.id !== recipeId));
    } catch (err) {
      setRecipesError(mapAdminError(err, 'Brisanje recepta nije uspelo.'));
    } finally {
      setRecipeBusyId(null);
    }
  }, []);

  return {
    recipes,
    loadingRecipes,
    recipesError,
    recipeBusyId,
    loadRecipes,
    approveRecipe,
    rejectRecipe,
    deleteRecipe,
  };
}

export default useAdminRecipes;
