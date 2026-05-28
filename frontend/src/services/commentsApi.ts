import { api } from '../api';
import { RecipeComment } from '../components/recipes/types';

export const commentsApi = {
  list: () => api.get<RecipeComment[]>('/api/comments'),
  listForRecipe: (recipeId: number) =>
    api.get<RecipeComment[]>(`/api/comments?recipe_id=${recipeId}`),
  createForRecipe: (recipeId: number, content: string) =>
    api.post('/api/comments', {
      recipe_id: recipeId,
      content,
    }),
  updateStatus: (comment: RecipeComment, isApproved: boolean) =>
    api.put<RecipeComment>(`/api/comments/${comment.id}`, {
      content: comment.content,
      is_approved: isApproved,
    }),
  delete: (commentId: number) => api.delete<{ ok: boolean }>(`/api/comments/${commentId}`),
};
