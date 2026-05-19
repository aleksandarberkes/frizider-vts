export type Category = {
  id: number;
  name: string;
};

export type IngredientOption = {
  id: number;
  name: string;
  unit: string;
};

export type RecipeIngredient = {
  ingredient_id: number;
  name: string;
  unit: string;
  quantity: number | null;
};

export type RecipeCategory = {
  category_id: number;
  name: string;
};

export type Recipe = {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
  estimated_price: number | null;
  created_by: number;
  is_approved: boolean;
  created_at: string;
  ingredients: RecipeIngredient[];
  categories: RecipeCategory[];
};

export type FavoriteRecipe = {
  recipe_id: number;
};

export type UserRating = {
  recipe_id: number;
  rating: number;
};

export type RatingAggregate = {
  recipe_id: number;
  average: number | null;
  count: number;
};

export type RecipeComment = {
  id: number;
  user_id: number;
  recipe_id: number;
  rating?: number | null;
  content: string;
  is_approved: boolean;
  created_at?: string;
  first_name?: string | null;
  last_name?: string | null;
};

export type RecipeFormIngredient = {
  ingredient_id: string;
  quantity: string;
};

export type RecipeFormState = {
  name: string;
  description: string;
  image_path: string;
  estimated_price: string;
  categories: number[];
  ingredients: RecipeFormIngredient[];
};

export type PriceFilter = 'all' | 'budget' | 'mid' | 'premium';
export type RatingFilter = 'all' | '4plus' | '45plus';
export type SortBy = 'popular' | 'newest' | 'priceAsc' | 'priceDesc' | 'name';
