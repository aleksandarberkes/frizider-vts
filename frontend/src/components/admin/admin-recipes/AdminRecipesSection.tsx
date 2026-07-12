import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../feedback/EmptyState';
import LoadingState from '../../feedback/LoadingState';
import { Recipe } from '../../recipes/types';

type AdminRecipesSectionProps = {
  recipes: Recipe[];
  loading: boolean;
  recipeBusyId: number | null;
  onApprove: (recipe: Recipe) => void;
  onReject: (recipe: Recipe, reason: string) => void;
  onDelete: (recipeId: number) => void;
};

function AdminRecipesSection({
  recipes,
  loading,
  recipeBusyId,
  onApprove,
  onReject,
  onDelete,
}: AdminRecipesSectionProps) {
  const [rejectingRecipe, setRejectingRecipe] = useState<Recipe | null>(null);
  const [viewingReasonRecipe, setViewingReasonRecipe] = useState<Recipe | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = (recipe: Recipe) => {
    setRejectingRecipe(recipe);
    setRejectionReason(recipe.rejection_reason ?? '');
  };

  const closeRejectDialog = () => {
    setRejectingRecipe(null);
    setRejectionReason('');
  };

  const submitReject = () => {
    if (!rejectingRecipe) {
      return;
    }

    const reason = rejectionReason.trim();
    if (reason === '') {
      return;
    }

    onReject(rejectingRecipe, reason);
    closeRejectDialog();
  };

  const handleDelete = (recipe: Recipe) => {
    if (window.confirm(`Obrisati recept "${recipe.name}"?`)) {
      onDelete(recipe.id);
    }
  };

  const pendingCount = recipes.filter((recipe) => !recipe.is_approved).length;

  return (
    <article className="admin-dashboard-card">
      <div className="admin-dashboard-card-head">
        <div>
          <h2>Recepti</h2>
          <p>
            Svi recepti na sajtu. Odobri/odbij, izmeni ili obrisi bilo koji recept.
            Na cekanju: {pendingCount}.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState className="admin-dashboard-empty" message="Ucitavanje recepata..." />
      ) : recipes.length === 0 ? (
        <EmptyState className="admin-dashboard-empty" message="Nema recepata." />
      ) : (
        <table className="admin-dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Naziv</th>
              <th>Autor</th>
              <th>Status</th>
              <th>Razlog odbijanja</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe) => {
              const busy = recipeBusyId === recipe.id;
              return (
                <tr key={recipe.id}>
                  <td>{recipe.id}</td>
                  <td>
                    <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                  </td>
                  <td>#{recipe.created_by}</td>
                  <td>
                    <span
                      className={
                        recipe.is_approved
                          ? 'admin-dashboard-status admin-dashboard-status-approved'
                          : 'admin-dashboard-status admin-dashboard-status-pending'
                      }
                    >
                      {recipe.is_approved ? 'Odobren' : 'Na cekanju'}
                    </span>
                  </td>
                  <td className="admin-dashboard-reason-cell">
                    {!recipe.is_approved && recipe.rejection_reason ? (
                      <button
                        type="button"
                        className="admin-dashboard-reason-preview"
                        onClick={() => setViewingReasonRecipe(recipe)}
                      >
                        {recipe.rejection_reason}
                      </button>
                    ) : (
                      <span className="admin-dashboard-muted">-</span>
                    )}
                  </td>
                  <td className="admin-dashboard-row-actions">
                    <button
                      type="button"
                      className="admin-dashboard-approve"
                      onClick={() => onApprove(recipe)}
                      disabled={busy || recipe.is_approved}
                    >
                      {busy ? 'Radim...' : 'Odobri'}
                    </button>
                    <button
                      type="button"
                      className="admin-dashboard-secondary"
                      onClick={() => handleReject(recipe)}
                      disabled={busy}
                    >
                      Odbij
                    </button>
                    <Link className="admin-dashboard-secondary admin-dashboard-link-button" to={`/recipes/${recipe.id}`}>
                      Otvori / izmeni
                    </Link>
                    <button
                      type="button"
                      className="admin-dashboard-danger"
                      onClick={() => handleDelete(recipe)}
                      disabled={busy}
                    >
                      Obrisi
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {rejectingRecipe ? (
        <div className="admin-dashboard-modal-backdrop" role="presentation">
          <div
            className="admin-dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reject-title"
          >
            <div className="admin-dashboard-modal-head">
              <h3 id="admin-reject-title">Odbij recept</h3>
              <button
                type="button"
                className="admin-dashboard-modal-close"
                onClick={closeRejectDialog}
                aria-label="Zatvori"
              >
                x
              </button>
            </div>

            <p className="admin-dashboard-modal-copy">
              Razlog odbijanja za "{rejectingRecipe.name}" bice poslat autoru e-mailom.
            </p>

            <label className="admin-dashboard-field">
              <span>Razlog odbijanja</span>
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={6}
                autoFocus
              />
            </label>

            <div className="admin-dashboard-form-actions">
              <button
                type="button"
                className="admin-dashboard-secondary"
                onClick={closeRejectDialog}
              >
                Odustani
              </button>
              <button
                type="button"
                className="admin-dashboard-danger"
                onClick={submitReject}
                disabled={rejectionReason.trim() === ''}
              >
                Potvrdi odbijanje
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewingReasonRecipe ? (
        <div className="admin-dashboard-modal-backdrop" role="presentation">
          <div
            className="admin-dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reason-title"
          >
            <div className="admin-dashboard-modal-head">
              <h3 id="admin-reason-title">Razlog odbijanja</h3>
              <button
                type="button"
                className="admin-dashboard-modal-close"
                onClick={() => setViewingReasonRecipe(null)}
                aria-label="Zatvori"
              >
                x
              </button>
            </div>

            <p className="admin-dashboard-modal-copy">
              Recept: "{viewingReasonRecipe.name}"
            </p>

            <label className="admin-dashboard-field">
              <span>Ceo razlog</span>
              <textarea
                value={viewingReasonRecipe.rejection_reason ?? ''}
                rows={8}
                readOnly
              />
            </label>

            <div className="admin-dashboard-form-actions">
              <button
                type="button"
                className="admin-dashboard-secondary"
                onClick={() => setViewingReasonRecipe(null)}
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default AdminRecipesSection;
