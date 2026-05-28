import { useCallback, useEffect, useMemo, useState } from 'react';
import { RecipeComment } from '../../recipes/types';
import { commentsApi } from '../../../services/commentsApi';
import { mapAdminError } from './mapAdminError';

function useAdminComments() {
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentBusyId, setCommentBusyId] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);

    try {
      const commentsResponse = await commentsApi.list();
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
      const updatedComment = await commentsApi.updateStatus(comment, isApproved);
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
      await commentsApi.delete(commentId);
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
