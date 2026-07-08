import { api } from '../api';

export type WeeklyMenuSummary = {
  id: number;
  user_id: number;
  name: string;
  recipe_count: number;
  created_at: string;
  updated_at: string;
};

export type WeeklyMenuRecipe = {
  item_id: number;
  recipe_id: number;
  position: number;
  recipe: {
    id: number;
    name: string;
    description: string | null;
    image_path: string | null;
    estimated_price: number | null;
    created_by: number;
    is_approved: boolean;
    created_at: string;
  };
};

export type WeeklyMenuDay = {
  day_of_week: number;
  day_name: string;
  recipes: WeeklyMenuRecipe[];
};

export type WeeklyMenu = {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  days: WeeklyMenuDay[];
};

export type WeeklyMenuItemPayload = {
  day_of_week: number;
  recipe_id: number;
};

export type WeeklyMenuPayload = {
  name: string;
  items: WeeklyMenuItemPayload[];
};

export const mealPlansApi = {
  list: () => api.get<WeeklyMenuSummary[]>('/api/meal-plans'),
  get: (menuId: number) => api.get<WeeklyMenu>(`/api/meal-plans/${menuId}`),
  create: (payload: WeeklyMenuPayload) => api.post<WeeklyMenu>('/api/meal-plans', payload),
  update: (menuId: number, payload: WeeklyMenuPayload) =>
    api.put<WeeklyMenu>(`/api/meal-plans/${menuId}`, payload),
  delete: (menuId: number) => api.delete<{ ok: boolean }>(`/api/meal-plans/${menuId}`),
};
