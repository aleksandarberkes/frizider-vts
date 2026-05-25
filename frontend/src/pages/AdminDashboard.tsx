import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import AdminCategoriesSection from '../components/admin/admin-categories/AdminCategoriesSection';
import AdminCommentsSection from '../components/admin/admin-comments/AdminCommentsSection';
import AdminDashboardHeader from '../components/admin/admin-header/AdminDashboardHeader';
import AdminRecipesSection from '../components/admin/admin-recipes/AdminRecipesSection';
import AdminTabs, { AdminTabId } from '../components/admin/admin-tabs/AdminTabs';
import { Category, Recipe, RecipeComment } from '../components/recipes/types';
import './AdminDashboard.css';

const isAdminTab = (value: string | null): value is AdminTabId =>
  value === 'categories' || value === 'recipes' || value === 'comments';

function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  const tabParam = searchParams.get('tab');
  const activeTab: AdminTabId = isAdminTab(tabParam) ? tabParam : 'categories';

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

  const handleTabChange = (tab: AdminTabId) => {
    setSearchParams({ tab });
  };

  const renderRefreshButton = () => {
    if (activeTab === 'categories') {
      return (
        <button
          type="button"
          className="admin-dashboard-refresh"
          onClick={() => void loadCategories()}
          disabled={loadingCategories}
        >
          Osvezi kategorije
        </button>
      );
    }

    if (activeTab === 'recipes') {
      return (
        <button
          type="button"
          className="admin-dashboard-refresh"
          onClick={() => void loadPendingRecipes()}
          disabled={loadingRecipes}
        >
          Osvezi recepte
        </button>
      );
    }

    return (
      <button
        type="button"
        className="admin-dashboard-refresh"
        onClick={() => void loadComments()}
        disabled={loadingComments}
      >
        Osvezi komentare
      </button>
    );
  };

  return (
    <section className="admin-dashboard">
      <AdminDashboardHeader refreshAction={renderRefreshButton()} />

      {error ? <p className="admin-dashboard-error">{error}</p> : null}

      <AdminTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="admin-dashboard-layout">
        {activeTab === 'categories' ? (
          <AdminCategoriesSection
            categories={categories}
            loading={loadingCategories}
            categoryName={categoryName}
            editingCategoryId={editingCategoryId}
            categorySubmitting={categorySubmitting}
            categoryDeletingId={categoryDeletingId}
            onCategoryNameChange={setCategoryName}
            onSubmit={submitCategory}
            onReset={resetCategoryForm}
            onStartEdit={startEditCategory}
            onDelete={(categoryId) => void deleteCategory(categoryId)}
          />
        ) : null}

        {activeTab === 'recipes' ? (
          <AdminRecipesSection
            pendingRecipes={pendingRecipes}
            loading={loadingRecipes}
            approvingId={approvingId}
            onApprove={(recipe) => void approveRecipe(recipe)}
          />
        ) : null}

        {activeTab === 'comments' ? (
          <AdminCommentsSection
            comments={comments}
            pendingCommentsCount={pendingComments.length}
            loading={loadingComments}
            commentBusyId={commentBusyId}
            onUpdateStatus={(comment, isApproved) => void updateCommentStatus(comment, isApproved)}
            onDelete={(commentId) => void deleteComment(commentId)}
          />
        ) : null}
      </div>
    </section>
  );
}

export default AdminDashboard;
