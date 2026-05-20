import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { Recipe } from '../components/recipes/types';
import './AdminDashboard.css';

function AdminDashboard() {
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const mapError = (err: unknown, fallback: string) => {
    if (err instanceof TypeError) {
      return 'Backend nije dostupan na http://localhost/frizider-vts/backend.';
    }
    if (err instanceof ApiError || err instanceof Error) {
      return err.message;
    }
    return fallback;
  };

  const loadPendingRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      const recipes = await api.get<Recipe[]>('/api/recipes');
      setPendingRecipes(recipes.filter((recipe) => !recipe.is_approved));
    } catch (err) {
      setError(mapError(err, 'Ucitavanje recepata za objavu nije uspelo.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveRecipe = async (recipe: Recipe) => {
    setApprovingId(recipe.id);
    setError(null);

    try {
      await api.put<Recipe>(`/api/recipes/${recipe.id}`, {
        name: recipe.name,
        description: recipe.description ?? '',
        image_path: recipe.image_path ?? '',
        estimated_price: recipe.estimated_price,
        categories: recipe.categories.map((category) => category.category_id ?? category.id).filter(Boolean),
        ingredients: recipe.ingredients.map((ingredient) => ({
          ingredient_id: ingredient.ingredient_id,
          quantity: ingredient.quantity,
        })),
        is_approved: true,
      });

      setPendingRecipes((current) => current.filter((entry) => entry.id !== recipe.id));
    } catch (err) {
      setError(mapError(err, 'Odobravanje recepta nije uspelo.'));
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h1>Objava recepata</h1>
          <p>Admin ovde odobrava recepte. Tek nakon potvrde gost moze da ih vidi.</p>
        </div>
        <button type="button" className="admin-dashboard-refresh" onClick={loadPendingRecipes} disabled={loading}>
          Osvezi
        </button>
      </div>

      {error ? <p className="admin-dashboard-error">{error}</p> : null}

      <div className="admin-dashboard-card">
        {loading ? (
          <p className="admin-dashboard-empty">Ucitavanje recepata...</p>
        ) : pendingRecipes.length === 0 ? (
          <p className="admin-dashboard-empty">Nema recepata koji cekaju objavu.</p>
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
                      onClick={() => approveRecipe(recipe)}
                      disabled={approvingId === recipe.id}
                    >
                      {approvingId === recipe.id ? 'Potvrdjujem...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;
