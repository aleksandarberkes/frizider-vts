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
  category_id?: number;
  id?: number;
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
  rejection_reason: string | null;
  created_at: string;
  ingredients: RecipeIngredient[];
  categories: RecipeCategory[];
};

// A recipe returned by the "Moj frizider" match endpoint: a normal recipe plus
// the ingredients the caller is missing (at most 2) relative to their fridge.
export type FridgeRecipeMatch = Recipe & {
  missing_ingredients: RecipeIngredient[];
  missing_count: number;
  matched_count: number;
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
  recipe_name?: string | null;
  rating?: number | null;
  content: string;
  is_approved: boolean;
  rejection_reason?: string | null;
  created_at?: string;
  first_name?: string | null;
  last_name?: string | null;
};

export type RecipeFormIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
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
