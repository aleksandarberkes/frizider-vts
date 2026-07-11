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
  const handleReject = (recipe: Recipe) => {
    const reason = window.prompt(
      `Razlog odbijanja recepta "${recipe.name}" (bice poslat autoru e-mailom):`,
    );
    if (reason && reason.trim() !== '') {
      onReject(recipe, reason.trim());
    }
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
                    {!recipe.is_approved && recipe.rejection_reason ? (
                      <p className="admin-dashboard-reason">Razlog: {recipe.rejection_reason}</p>
                    ) : null}
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
    </article>
  );
}

export default AdminRecipesSection;
