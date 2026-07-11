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
  updateStatus: (comment: RecipeComment, isApproved: boolean, rejectionReason?: string) =>
    api.put<RecipeComment>(`/api/comments/${comment.id}`, {
      content: comment.content,
      is_approved: isApproved,
      // Only meaningful on rejection; the author is e-mailed the reason.
      rejection_reason: rejectionReason,
    }),
  delete: (commentId: number) => api.delete<{ ok: boolean }>(`/api/comments/${commentId}`),
};
