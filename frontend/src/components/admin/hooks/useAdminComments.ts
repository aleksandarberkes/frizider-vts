import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../api';
import { RecipeComment } from '../../recipes/types';
import { mapAdminError } from './mapAdminError';

function useAdminComments() {
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentBusyId, setCommentBusyId] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);

    try {
      const commentsResponse = await api.get<RecipeComment[]>('/api/comments');
      setComments(commentsResponse);
      setCommentsError(null);
    } catch (err) {
      setCommentsError(mapAdminError(err, 'Ucitavanje komentara nije uspelo.'));
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const updateCommentStatus = useCallback(async (comment: RecipeComment, isApproved: boolean) => {
    setCommentBusyId(comment.id);
    setCommentsError(null);

    try {
      const updatedComment = await api.put<RecipeComment>(`/api/comments/${comment.id}`, {
        content: comment.content,
        is_approved: isApproved,
      });
      setComments((current) =>
        current.map((entry) =>
          entry.id === comment.id ? { ...entry, is_approved: updatedComment.is_approved } : entry,
        ),
      );
    } catch (err) {
      setCommentsError(mapAdminError(err, 'Izmena statusa komentara nije uspela.'));
    } finally {
      setCommentBusyId(null);
    }
  }, []);

  const deleteComment = useCallback(async (commentId: number) => {
    setCommentBusyId(commentId);
    setCommentsError(null);

    try {
      await api.delete<{ ok: boolean }>(`/api/comments/${commentId}`);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setCommentsError(mapAdminError(err, 'Brisanje komentara nije uspelo.'));
    } finally {
      setCommentBusyId(null);
    }
  }, []);

  const pendingComments = useMemo(
    () => comments.filter((comment) => !comment.is_approved),
    [comments],
  );

  return {
    comments,
    loadingComments,
    commentsError,
    commentBusyId,
    pendingComments,
    loadComments,
    updateCommentStatus,
    deleteComment,
  };
}

export default useAdminComments;
