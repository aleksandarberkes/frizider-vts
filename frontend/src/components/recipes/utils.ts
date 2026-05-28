import { API_BASE_URL } from '../../api';
import { IngredientOption, Recipe, RecipeComment, RecipeFormIngredient, RecipeFormState } from './types';

const backendOrigin = new URL(API_BASE_URL).origin;

export const RECIPE_IMAGE_PLACEHOLDER = `${process.env.PUBLIC_URL}/images/image-placeholder.jpg`;

export const emptyRecipeIngredientRow = (): RecipeFormIngredient => ({
  ingredient_id: '',
  ingredient_name: '',
  unit: '',
  quantity: '',
});

export const emptyRecipeForm = (): RecipeFormState => ({
  name: '',
  description: '',
  image_path: '',
  estimated_price: '',
  categories: [],
  ingredients: [emptyRecipeIngredientRow()],
});

export const normalizeCatalogText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const findIngredientByName = (ingredientsCatalog: IngredientOption[], value: string) => {
  const normalizedValue = normalizeCatalogText(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    ingredientsCatalog.find((ingredient) => normalizeCatalogText(ingredient.name) === normalizedValue) ??
    null
  );
};

export const formatPrice = (value: number | null) => {
  if (value === null) {
    return 'Cena nije uneta';
  }

  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (value?: string) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

export const getCommentAuthor = (comment: RecipeComment) => {
  const fullName = [comment.first_name, comment.last_name].filter(Boolean).join(' ').trim();
  return fullName || 'Korisnik';
};

export const getRecipeVisual = (recipe: Recipe) => {
  if (recipe.image_path && /^https?:\/\//i.test(recipe.image_path)) {
    return {
      imageUrl: recipe.image_path,
      gradient: '',
    };
  }

  if (
    recipe.image_path &&
    (recipe.image_path.startsWith('/frizider-vts/backend/uploads/') ||
      recipe.image_path.startsWith('/backend/uploads/'))
  ) {
    return {
      imageUrl: `${backendOrigin}${recipe.image_path}`,
      gradient: '',
    };
  }

  if (recipe.image_path && recipe.image_path.startsWith('/')) {
    return {
      imageUrl: `${process.env.PUBLIC_URL}${recipe.image_path}`,
      gradient: '',
    };
  }

  return {
    imageUrl: RECIPE_IMAGE_PLACEHOLDER,
    gradient: '',
  };
};
