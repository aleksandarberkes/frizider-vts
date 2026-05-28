import { useAuth } from '../../auth/AuthContext';
import { useAuthModal } from '../../auth/AuthModalContext';
import RecipeFormModal from '../../components/recipes/RecipeFormModal/RecipeFormModal';
import RecipeGrid from '../../components/recipes/RecipeGrid/RecipeGrid';
import RecipesFilters from '../../components/recipes/RecipesFilters/RecipesFilters';
import RecipesHero from '../../components/recipes/RecipesHero/RecipesHero';
import RecipesToolbar from '../../components/recipes/RecipesToolbar/RecipesToolbar';
import { useRecipeFavorites } from '../../components/recipes/hooks/useRecipeFavorites';
import { useRecipeFilters } from '../../components/recipes/hooks/useRecipeFilters';
import { useRecipeForm } from '../../components/recipes/hooks/useRecipeForm';
import { useRecipesPageData } from '../../components/recipes/hooks/useRecipesPageData';
import { RecipePayload, recipesApi } from '../../services/recipesApi';
import './Recepti.css';

function Recepti() {
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const {
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
  } = useRecipesPageData(user?.id);

  const promptLogin = () => {
    openLoginModal();
  };

  const { favoriteSet, favoriteBusyId, toggleFavorite } = useRecipeFavorites({
    favoriteIds,
    setFavoriteIds,
    isLoggedIn: !!user,
    onLoginRequired: promptLogin,
    onError: setPageError,
  });

  const {
    searchTerm,
    selectedCategoryId,
    priceFilter,
    ratingFilter,
    sortBy,
    favoritesOnly,
    filteredRecipes,
    setSearchTerm,
    setSelectedCategoryId,
    setPriceFilter,
    setRatingFilter,
    setSortBy,
    setFavoritesOnly,
    resetFilters,
  } = useRecipeFilters({
    recipes,
    categories,
    favoriteIds: favoriteSet,
    ratingSummary,
  });

  const saveRecipe = async (payload: RecipePayload, editingRecipeId: number | null) => {
    if (editingRecipeId) {
      await recipesApi.update(editingRecipeId, payload);
      return;
    }

    await recipesApi.create(payload);
  };

  const recipeForm = useRecipeForm({
    user,
    ingredientsCatalog,
    onIngredientsCreated: (createdIngredients) => {
      setIngredientsCatalog((current) =>
        [...current, ...createdIngredients].sort((left, right) =>
          left.name.localeCompare(right.name, 'sr'),
        ),
      );
    },
    onSaved: loadPageData,
    onLoginRequired: promptLogin,
    saveRecipe,
  });

  return (
    <section className="recipes-page">
      <RecipesHero onCreateRecipe={recipeForm.openCreateRecipeForm} />

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

      {pageError ? <p className="recipes-page-error">{pageError}</p> : null}

      <RecipesToolbar count={filteredRecipes.length} sortBy={sortBy} onSortByChange={setSortBy} />

      {loading ? <p className="recipes-page-placeholder">Ucitavanje recepata...</p> : null}

      {!loading && filteredRecipes.length === 0 ? (
        <div className="recipes-page-empty">
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
        isOpen={recipeForm.showRecipeForm}
        editingRecipeId={recipeForm.editingRecipeId}
        recipeForm={recipeForm.recipeForm}
        categories={categories}
        ingredientsCatalog={ingredientsCatalog}
        recipeFormError={recipeForm.recipeFormError}
        recipeFormSaving={recipeForm.recipeFormSaving}
        imagePreviewUrl={recipeForm.imagePreviewUrl}
        hasSelectedImage={recipeForm.hasSelectedImage}
        onClose={recipeForm.closeRecipeForm}
        onSubmit={recipeForm.submitRecipeForm}
        onFieldChange={recipeForm.updateRecipeFormField}
        onImageFileChange={recipeForm.updateRecipeImageFile}
        onIngredientRowChange={recipeForm.handleIngredientRowChange}
        onAddIngredientRow={recipeForm.addIngredientRow}
        onRemoveIngredientRow={recipeForm.removeIngredientRow}
        onToggleCategory={recipeForm.toggleFormCategory}
      />
    </section>
  );
}

export default Recepti;
