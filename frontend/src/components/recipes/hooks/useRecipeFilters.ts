import { useMemo, useState } from 'react';
import {
  Category,
  PriceFilter,
  RatingAggregate,
  RatingFilter,
  Recipe,
  SortBy,
} from '../types';
import { normalizeCatalogText } from '../utils';

type UseRecipeFiltersParams = {
  recipes: Recipe[];
  categories: Category[];
  favoriteIds: Set<number>;
  ratingSummary: Record<number, RatingAggregate>;
};

export function useRecipeFilters({
  recipes,
  categories,
  favoriteIds,
  ratingSummary,
}: UseRecipeFiltersParams) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filteredRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) => {
          const haystack = `${recipe.name} ${recipe.description ?? ''}`.toLowerCase();
          const query = searchTerm.trim().toLowerCase();

          if (query && !haystack.includes(query)) {
            return false;
          }

          if (selectedCategoryId !== 'all') {
            const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
            const selectedCategoryName = selectedCategory ? normalizeCatalogText(selectedCategory.name) : '';

            const hasSelectedCategory = recipe.categories.some((category) => {
              const categoryId =
                typeof category.category_id === 'number'
                  ? category.category_id
                  : typeof category.id === 'number'
                    ? category.id
                    : null;

              if (categoryId === selectedCategoryId) {
                return true;
              }

              return selectedCategoryName !== '' && normalizeCatalogText(category.name) === selectedCategoryName;
            });

            if (!hasSelectedCategory) {
              return false;
            }
          }

          if (favoritesOnly && !favoriteIds.has(recipe.id)) {
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
        }),
    [
      categories,
      favoriteIds,
      favoritesOnly,
      priceFilter,
      ratingFilter,
      ratingSummary,
      recipes,
      searchTerm,
      selectedCategoryId,
      sortBy,
    ],
  );

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('all');
    setPriceFilter('all');
    setRatingFilter('all');
    setSortBy('popular');
    setFavoritesOnly(false);
  };

  return {
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
  };
}
