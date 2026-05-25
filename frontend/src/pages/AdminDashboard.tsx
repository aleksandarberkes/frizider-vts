import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { Category, Recipe, RecipeComment } from '../components/recipes/types';
import { getCommentAuthor } from '../components/recipes/utils';
import './AdminDashboard.css';

function AdminDashboard() {
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [commentBusyId, setCommentBusyId] = useState<number | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState<number | null>(null);

  const mapError = (err: unknown, fallback: string) => {
    if (err instanceof TypeError) {
      return 'Backend nije dostupan na http://localhost/frizider-vts/backend.';
    }
    if (err instanceof ApiError || err instanceof Error) {
      return err.message;
    }
    return fallback;
  };

  const loadPendingRecipes = useCallback(async () => {
    setLoadingRecipes(true);

    try {
      const recipes = await api.get<Recipe[]>('/api/recipes');
      setPendingRecipes(recipes.filter((recipe) => !recipe.is_approved));
    } catch (err) {
      setError(mapError(err, 'Ucitavanje recepata za objavu nije uspelo.'));
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);

    try {
      const categoriesResponse = await api.get<Category[]>('/api/categories');
      setCategories(categoriesResponse);
    } catch (err) {
      setError(mapError(err, 'Ucitavanje kategorija nije uspelo.'));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);

    try {
      const commentsResponse = await api.get<RecipeComment[]>('/api/comments');
      setComments(commentsResponse);
    } catch (err) {
      setError(mapError(err, 'Ucitavanje komentara nije uspelo.'));
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    setError(null);
    void loadPendingRecipes();
    void loadCategories();
    void loadComments();
  }, [loadCategories, loadComments, loadPendingRecipes]);

  const resetCategoryForm = () => {
    setCategoryName('');
    setEditingCategoryId(null);
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setError('Naziv kategorije je obavezan.');
      return;
    }

    setCategorySubmitting(true);
    setError(null);

    try {
      if (editingCategoryId) {
        const updatedCategory = await api.put<Category>(`/api/categories/${editingCategoryId}`, {
          name: trimmedName,
        });
        setCategories((current) =>
          current
            .map((category) => (category.id === editingCategoryId ? updatedCategory : category))
            .sort((left, right) => left.name.localeCompare(right.name, 'sr')),
        );
      } else {
        const createdCategory = await api.post<Category>('/api/categories', { name: trimmedName });
        setCategories((current) =>
          [...current, createdCategory].sort((left, right) => left.name.localeCompare(right.name, 'sr')),
        );
      }

      resetCategoryForm();
    } catch (err) {
      setError(
        mapError(
          err,
          editingCategoryId ? 'Izmena kategorije nije uspela.' : 'Dodavanje kategorije nije uspelo.',
        ),
      );
    } finally {
      setCategorySubmitting(false);
    }
  };

  const startEditCategory = (category: Category) => {
    setCategoryName(category.name);
    setEditingCategoryId(category.id);
    setError(null);
  };

  const deleteCategory = async (categoryId: number) => {
    setCategoryDeletingId(categoryId);
    setError(null);

    try {
      await api.delete<{ ok: boolean }>(`/api/categories/${categoryId}`);
      setCategories((current) => current.filter((category) => category.id !== categoryId));

      if (editingCategoryId === categoryId) {
        resetCategoryForm();
      }
    } catch (err) {
      setError(mapError(err, 'Brisanje kategorije nije uspelo.'));
    } finally {
      setCategoryDeletingId(null);
    }
  };

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

  const updateCommentStatus = async (comment: RecipeComment, isApproved: boolean) => {
    setCommentBusyId(comment.id);
    setError(null);

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
      setError(mapError(err, 'Izmena statusa komentara nije uspela.'));
    } finally {
      setCommentBusyId(null);
    }
  };

  const deleteComment = async (commentId: number) => {
    setCommentBusyId(commentId);
    setError(null);

    try {
      await api.delete<{ ok: boolean }>(`/api/comments/${commentId}`);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError(mapError(err, 'Brisanje komentara nije uspelo.'));
    } finally {
      setCommentBusyId(null);
    }
  };

  const pendingComments = comments.filter((comment) => !comment.is_approved);

  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <p className="admin-dashboard-eyebrow">Administracija</p>
          <h1>Admin kontrolna tabla</h1>
          <p>Dashboard sada pokriva kategorije, odobravanje recepata i moderaciju komentara.</p>
        </div>
        <div className="admin-dashboard-actions">
          <button
            type="button"
            className="admin-dashboard-refresh"
            onClick={() => void loadCategories()}
            disabled={loadingCategories}
          >
            Osvezi kategorije
          </button>
          <button
            type="button"
            className="admin-dashboard-refresh"
            onClick={() => void loadPendingRecipes()}
            disabled={loadingRecipes}
          >
            Osvezi recepte
          </button>
          <button
            type="button"
            className="admin-dashboard-refresh"
            onClick={() => void loadComments()}
            disabled={loadingComments}
          >
            Osvezi komentare
          </button>
        </div>
      </div>

      {error ? <p className="admin-dashboard-error">{error}</p> : null}

      <div className="admin-dashboard-layout">
        <article className="admin-dashboard-card">
          <div className="admin-dashboard-card-head">
            <div>
              <h2>Kategorije recepata</h2>
              <p>Dodavanje, izmena i brisanje kategorija koje koriste recepti i filteri.</p>
            </div>
          </div>

          <form className="admin-dashboard-form" onSubmit={submitCategory}>
            <label className="admin-dashboard-field">
              <span>Naziv kategorije</span>
              <input
                type="text"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="npr. Dorucak"
                disabled={categorySubmitting}
              />
            </label>

            <div className="admin-dashboard-form-actions">
              <button
                type="submit"
                className="admin-dashboard-primary"
                disabled={categorySubmitting}
              >
                {categorySubmitting
                  ? editingCategoryId
                    ? 'Cuvanje...'
                    : 'Dodavanje...'
                  : editingCategoryId
                    ? 'Sacuvaj izmenu'
                    : 'Dodaj kategoriju'}
              </button>
              {editingCategoryId ? (
                <button
                  type="button"
                  className="admin-dashboard-secondary"
                  onClick={resetCategoryForm}
                  disabled={categorySubmitting}
                >
                  Odustani
                </button>
              ) : null}
            </div>
          </form>

          {loadingCategories ? (
            <p className="admin-dashboard-empty">Ucitavanje kategorija...</p>
          ) : categories.length === 0 ? (
            <p className="admin-dashboard-empty">Nema unetih kategorija.</p>
          ) : (
            <table className="admin-dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Naziv</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td className="admin-dashboard-row-actions">
                      <button
                        type="button"
                        className="admin-dashboard-secondary"
                        onClick={() => startEditCategory(category)}
                        disabled={categorySubmitting || categoryDeletingId === category.id}
                      >
                        Izmeni
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard-danger"
                        onClick={() => void deleteCategory(category.id)}
                        disabled={categoryDeletingId === category.id}
                      >
                        {categoryDeletingId === category.id ? 'Brisem...' : 'Obrisi'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="admin-dashboard-card">
          <div className="admin-dashboard-card-head">
            <div>
              <h2>Objava recepata</h2>
              <p>Admin ovde odobrava recepte. Tek nakon potvrde gost moze da ih vidi.</p>
            </div>
          </div>

          {loadingRecipes ? (
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
                        onClick={() => void approveRecipe(recipe)}
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

        <article className="admin-dashboard-card">
          <div className="admin-dashboard-card-head">
            <div>
              <h2>Moderacija komentara</h2>
              <p>
                Admin moze da odobri, odbije ili obrise komentare. Trenutno ceka {pendingComments.length}{' '}
                komentara.
              </p>
            </div>
          </div>

          {loadingComments ? (
            <p className="admin-dashboard-empty">Ucitavanje komentara...</p>
          ) : comments.length === 0 ? (
            <p className="admin-dashboard-empty">Nema komentara za moderaciju.</p>
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
                        onClick={() => void updateCommentStatus(comment, true)}
                        disabled={commentBusyId === comment.id || comment.is_approved}
                      >
                        {commentBusyId === comment.id && !comment.is_approved ? 'Radim...' : 'Odobri'}
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard-secondary"
                        onClick={() => void updateCommentStatus(comment, false)}
                        disabled={commentBusyId === comment.id || !comment.is_approved}
                      >
                        Odbij
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard-danger"
                        onClick={() => void deleteComment(comment.id)}
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
      </div>
    </section>
  );
}

export default AdminDashboard;
