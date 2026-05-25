import EmptyState from '../../feedback/EmptyState';
import LoadingState from '../../feedback/LoadingState';
import { RecipeComment } from '../../recipes/types';
import { getCommentAuthor } from '../../recipes/utils';

type AdminCommentsSectionProps = {
  comments: RecipeComment[];
  pendingCommentsCount: number;
  loading: boolean;
  commentBusyId: number | null;
  onUpdateStatus: (comment: RecipeComment, isApproved: boolean) => void;
  onDelete: (commentId: number) => void;
};

function AdminCommentsSection({
  comments,
  pendingCommentsCount,
  loading,
  commentBusyId,
  onUpdateStatus,
  onDelete,
}: AdminCommentsSectionProps) {
  return (
    <article className="admin-dashboard-card">
      <div className="admin-dashboard-card-head">
        <div>
          <h2>Moderacija komentara</h2>
          <p>Admin moze da odobri, odbije ili obrise komentare. Trenutno ceka {pendingCommentsCount} komentara.</p>
        </div>
      </div>

      {loading ? (
        <LoadingState className="admin-dashboard-empty" message="Ucitavanje komentara..." />
      ) : comments.length === 0 ? (
        <EmptyState className="admin-dashboard-empty" message="Nema komentara za moderaciju." />
      ) : (
        <table className="admin-dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Recept</th>
              <th>Autor</th>
              <th>Status</th>
              <th>Komentar</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id}>
                <td>{comment.id}</td>
                <td>{comment.recipe_name ?? `#${comment.recipe_id}`}</td>
                <td>{getCommentAuthor(comment)}</td>
                <td>
                  <span
                    className={
                      comment.is_approved
                        ? 'admin-dashboard-status admin-dashboard-status-approved'
                        : 'admin-dashboard-status admin-dashboard-status-pending'
                    }
                  >
                    {comment.is_approved ? 'Odobren' : 'Na cekanju'}
                  </span>
                </td>
                <td className="admin-dashboard-comment-cell">{comment.content}</td>
                <td className="admin-dashboard-row-actions">
                  <button
                    type="button"
                    className="admin-dashboard-approve"
                    onClick={() => onUpdateStatus(comment, true)}
                    disabled={commentBusyId === comment.id || comment.is_approved}
                  >
                    {commentBusyId === comment.id && !comment.is_approved ? 'Radim...' : 'Odobri'}
                  </button>
                  <button
                    type="button"
                    className="admin-dashboard-secondary"
                    onClick={() => onUpdateStatus(comment, false)}
                    disabled={commentBusyId === comment.id || !comment.is_approved}
                  >
                    Odbij
                  </button>
                  <button
                    type="button"
                    className="admin-dashboard-danger"
                    onClick={() => onDelete(comment.id)}
                    disabled={commentBusyId === comment.id}
                  >
                    {commentBusyId === comment.id ? 'Brisem...' : 'Obrisi'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

export default AdminCommentsSection;
