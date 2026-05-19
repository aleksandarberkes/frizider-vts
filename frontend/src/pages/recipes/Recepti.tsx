import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useAuthModal } from '../../auth/AuthModalContext';
import RecipeFormModal from '../../components/recipes/RecipeFormModal/RecipeFormModal';
import RecipeGrid from '../../components/recipes/RecipeGrid/RecipeGrid';
import RecipesFilters from '../../components/recipes/RecipesFilters/RecipesFilters';
import RecipesHero from '../../components/recipes/RecipesHero/RecipesHero';
import RecipesToolbar from '../../components/recipes/RecipesToolbar/RecipesToolbar';
import {
  Category,
  FavoriteRecipe,
  IngredientOption,
  PriceFilter,
  RatingAggregate,
  RatingFilter,
  Recipe,
  RecipeFormIngredient,
  RecipeFormState,
  SortBy,
} from '../../components/recipes/types';
import { emptyRecipeForm } from '../../components/recipes/utils';
import './Recepti.css';

function Recepti() {
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredientsCatalog, setIngredientsCatalog] = useState<IngredientOption[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [ratingSummary, setRatingSummary] = useState<Record<number, RatingAggregate>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [recipeForm, setRecipeForm] = useState<RecipeFormState>(emptyRecipeForm);
  const [recipeFormError, setRecipeFormError] = useState<string | null>(null);
  const [recipeFormSaving, setRecipeFormSaving] = useState(false);
  const [favoriteBusyId, setFavoriteBusyId] = useState<number | null>(null);

  const mapError = (err: unknown, fallback: string) => {
    if (err instanceof TypeError) {
      return 'Backend nije dostupan na http://localhost/frizider-vts/backend.';
    }
    if (err instanceof ApiError || err instanceof Error) {
      return err.message;
    }
    return fallback;
  };

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const loadPageData = async () => {
    setLoading(true);
    setPageError(null);

    try {
      const [recipesResponse, categoriesResponse, ingredientsResponse] = await Promise.all([
        api.get<Recipe[]>('/api/recipes'),
        api.get<Category[]>('/api/categories'),
        api.get<IngredientOption[]>('/api/ingredients'),
      ]);

      let favoritesResponse: FavoriteRecipe[] = [];
      if (user) {
        favoritesResponse = await api.get<FavoriteRecipe[]>('/api/favorites');
      }

      const ratingEntries = await Promise.all(
        recipesResponse.map(async (recipe) => {
          const aggregate = await api.get<RatingAggregate>(`/api/ratings/recipe/${recipe.id}`);
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
      setPageError(mapError(err, 'Ucitavanje recepata nije uspelo.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredRecipes = recipes
    .filter((recipe) => {
      const haystack = `${recipe.name} ${recipe.description ?? ''}`.toLowerCase();
      const query = searchTerm.trim().toLowerCase();

      if (query && !haystack.includes(query)) {
        return false;
      }

      if (
        selectedCategoryId !== 'all' &&
        !recipe.categories.some((category) => category.category_id === selectedCategoryId)
      ) {
        return false;
      }

      if (favoritesOnly && !favoriteSet.has(recipe.id)) {
        return false;
      }

      if (priceFilter === 'budget' && (recipe.estimated_price ?? Number.MAX_SAFE_INTEGER) > 400) {
        return false;
      }

      if (
        priceFilter === 'mid' &&
        ((recipe.estimated_price ?? 0) < 401 || (recipe.estimated_price ?? 0) > 800)
      ) {
        return false;
      }

      if (priceFilter === 'premium' && (recipe.estimated_price ?? 0) < 801) {
        return false;
      }

      const average = ratingSummary[recipe.id]?.average ?? 0;
      if (ratingFilter === '4plus' && average < 4) {
        return false;
      }
      if (ratingFilter === '45plus' && average < 4.5) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      if (sortBy === 'name') {
        return left.name.localeCompare(right.name, 'sr');
      }
      if (sortBy === 'priceAsc') {
        return (
          (left.estimated_price ?? Number.MAX_SAFE_INTEGER) -
          (right.estimated_price ?? Number.MAX_SAFE_INTEGER)
        );
      }
      if (sortBy === 'priceDesc') {
        return (right.estimated_price ?? 0) - (left.estimated_price ?? 0);
      }
      if (sortBy === 'newest') {
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      }

      const rightRating = ratingSummary[right.id]?.average ?? 0;
      const leftRating = ratingSummary[left.id]?.average ?? 0;
      if (rightRating !== leftRating) {
        return rightRating - leftRating;
      }
      return right.id - left.id;
    });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('all');
    setPriceFilter('all');
    setRatingFilter('all');
    setSortBy('popular');
    setFavoritesOnly(false);
  };

  const promptLogin = () => {
    openLoginModal();
  };

  const toggleFavorite = async (recipeId: number) => {
    if (!user) {
      promptLogin();
      return;
    }

    setFavoriteBusyId(recipeId);
    try {
      if (favoriteSet.has(recipeId)) {
        await api.delete<{ ok: boolean }>(`/api/favorites/${recipeId}`);
        setFavoriteIds((current) => current.filter((id) => id !== recipeId));
      } else {
        await api.post('/api/favorites', { recipe_id: recipeId });
        setFavoriteIds((current) => [...current, recipeId]);
      }
    } catch (err) {
      setPageError(mapError(err, 'Izmena omiljenih recepata nije uspela.'));
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const openCreateRecipeForm = () => {
    if (!user) {
      promptLogin();
      return;
    }

    setEditingRecipeId(null);
    setRecipeForm(emptyRecipeForm());
    setRecipeFormError(null);
    setShowRecipeForm(true);
  };

  const closeRecipeForm = () => {
    setShowRecipeForm(false);
    setEditingRecipeId(null);
    setRecipeFormError(null);
  };

  const updateRecipeFormField = (field: keyof RecipeFormState, value: string | number[]) => {
    setRecipeForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleIngredientRowChange = (
    index: number,
    field: keyof RecipeFormIngredient,
    value: string,
  ) => {
    const nextRows = recipeForm.ingredients.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    );
    setRecipeForm((current) => ({
      ...current,
      ingredients: nextRows,
    }));
  };

  const addIngredientRow = () => {
    setRecipeForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ingredient_id: '', quantity: '' }],
    }));
  };

  const removeIngredientRow = (index: number) => {
    const nextRows = recipeForm.ingredients.filter((_, rowIndex) => rowIndex !== index);
    setRecipeForm((current) => ({
      ...current,
      ingredients: nextRows.length > 0 ? nextRows : [{ ingredient_id: '', quantity: '' }],
    }));
  };

  const toggleFormCategory = (categoryId: number) => {
    const hasCategory = recipeForm.categories.includes(categoryId);
    setRecipeForm((current) => ({
      ...current,
      categories: hasCategory
        ? current.categories.filter((id) => id !== categoryId)
        : [...current.categories, categoryId],
    }));
  };

  const submitRecipeForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      promptLogin();
      return;
    }

    const cleanedIngredients = recipeForm.ingredients
      .filter((row) => row.ingredient_id.trim() !== '')
      .map((row) => ({
        ingredient_id: Number(row.ingredient_id),
        quantity: row.quantity.trim() === '' ? null : Number(row.quantity),
      }));

    if (cleanedIngredients.length === 0) {
      setRecipeFormError('Dodaj barem jednu namirnicu za recept.');
      return;
    }

    setRecipeFormSaving(true);
    setRecipeFormError(null);

    try {
      const payload = {
        name: recipeForm.name.trim(),
        description: recipeForm.description.trim(),
        image_path: recipeForm.image_path.trim(),
        estimated_price:
          recipeForm.estimated_price.trim() === '' ? null : Number(recipeForm.estimated_price),
        ingredients: cleanedIngredients,
        categories: recipeForm.categories,
      };

      if (editingRecipeId) {
        await api.put<Recipe>(`/api/recipes/${editingRecipeId}`, payload);
      } else {
        await api.post<Recipe>('/api/recipes', payload);
      }

      closeRecipeForm();
      await loadPageData();
    } catch (err) {
      setRecipeFormError(mapError(err, 'Cuvanje recepta nije uspelo.'));
    } finally {
      setRecipeFormSaving(false);
    }
  };

  return (
    <section className="recipes-page">
      <RecipesHero onCreateRecipe={openCreateRecipeForm} />

      <RecipesFilters
        categories={categories}
        searchTerm={searchTerm}
        selectedCategoryId={selectedCategoryId}
        priceFilter={priceFilter}
        ratingFilter={ratingFilter}
        favoritesOnly={favoritesOnly}
        canFilterFavorites={!!user}
        onSearchTermChange={setSearchTerm}
        onSelectedCategoryChange={setSelectedCategoryId}
        onPriceFilterChange={setPriceFilter}
        onRatingFilterChange={setRatingFilter}
        onFavoritesOnlyChange={() => setFavoritesOnly((current) => !current)}
        onReset={resetFilters}
      />

      {pageError ? <p className="recipes-page__error">{pageError}</p> : null}

      <RecipesToolbar count={filteredRecipes.length} sortBy={sortBy} onSortByChange={setSortBy} />

      {loading ? <p className="recipes-page__placeholder">Ucitavanje recepata...</p> : null}

      {!loading && filteredRecipes.length === 0 ? (
        <div className="recipes-page__empty">
          <h2>Nema rezultata za izabrane filtere</h2>
          <p>Promeni pretragu ili resetuj filtere da bi video vise recepata.</p>
        </div>
      ) : null}

      {!loading && filteredRecipes.length > 0 ? (
        <RecipeGrid
          recipes={filteredRecipes}
          ratingSummary={ratingSummary}
          favoriteIds={favoriteSet}
          favoriteBusyId={favoriteBusyId}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}

      <RecipeFormModal
        isOpen={showRecipeForm}
        editingRecipeId={editingRecipeId}
        recipeForm={recipeForm}
        categories={categories}
        ingredientsCatalog={ingredientsCatalog}
        recipeFormError={recipeFormError}
        recipeFormSaving={recipeFormSaving}
        onClose={closeRecipeForm}
        onSubmit={submitRecipeForm}
        onFieldChange={updateRecipeFormField}
        onIngredientRowChange={handleIngredientRowChange}
        onAddIngredientRow={addIngredientRow}
        onRemoveIngredientRow={removeIngredientRow}
        onToggleCategory={toggleFormCategory}
      />
    </section>
  );
}

export default Recepti;
