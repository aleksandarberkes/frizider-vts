import { Recipe, RecipeComment, RecipeFormState } from './types';

export const emptyRecipeForm = (): RecipeFormState => ({
  name: '',
  description: '',
  image_path: '',
  estimated_price: '',
  categories: [],
  ingredients: [{ ingredient_id: '', quantity: '' }],
});

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

  if (recipe.image_path && recipe.image_path.startsWith('/')) {
    return {
      imageUrl: `${process.env.PUBLIC_URL}${recipe.image_path}`,
      gradient: '',
    };
  }

  const palette = [
    ['#f97316', '#fb7185'],
    ['#22c55e', '#14b8a6'],
    ['#f59e0b', '#ef4444'],
    ['#38bdf8', '#6366f1'],
    ['#84cc16', '#10b981'],
  ];
  const seed = recipe.id % palette.length;

  return {
    imageUrl: '',
    gradient: `linear-gradient(135deg, ${palette[seed][0]} 0%, ${palette[seed][1]} 100%)`,
  };
};
