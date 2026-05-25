import EmptyState from '../../feedback/EmptyState';
import LoadingState from '../../feedback/LoadingState';
import { Recipe } from '../../recipes/types';

type AdminRecipesSectionProps = {
  pendingRecipes: Recipe[];
  loading: boolean;
  approvingId: number | null;
  onApprove: (recipe: Recipe) => void;
};

function AdminRecipesSection({
  pendingRecipes,
  loading,
  approvingId,
  onApprove,
}: AdminRecipesSectionProps) {
  return (
    <article className="admin-dashboard-card">
      <div className="admin-dashboard-card-head">
        <div>
          <h2>Objava recepata</h2>
          <p>Admin ovde odobrava recepte. Tek nakon potvrde gost moze da ih vidi.</p>
        </div>
      </div>

      {loading ? (
        <LoadingState className="admin-dashboard-empty" message="Ucitavanje recepata..." />
      ) : pendingRecipes.length === 0 ? (
        <EmptyState className="admin-dashboard-empty" message="Nema recepata koji cekaju objavu." />
      ) : (
        <table className="admin-dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Naziv</th>
              <th>Autor</th>
              <th>Cena</th>
              <th>Datum</th>
              <th>Akcija</th>
            </tr>
          </thead>
          <tbody>
            {pendingRecipes.map((recipe) => (
              <tr key={recipe.id}>
                <td>{recipe.id}</td>
                <td>{recipe.name}</td>
                <td>#{recipe.created_by}</td>
                <td>{recipe.estimated_price ? `${recipe.estimated_price} RSD` : '-'}</td>
                <td>{new Date(recipe.created_at).toLocaleDateString('sr-RS')}</td>
                <td>
                  <button
                    type="button"
                    className="admin-dashboard-approve"
                    onClick={() => onApprove(recipe)}
                    disabled={approvingId === recipe.id}
                  >
                    {approvingId === recipe.id ? 'Potvrdjujem...' : 'Odobri'}
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

export default AdminRecipesSection;
