import { useSearchParams } from 'react-router-dom';
import AdminCategoriesSection from '../components/admin/admin-categories/AdminCategoriesSection';
import AdminCommentsSection from '../components/admin/admin-comments/AdminCommentsSection';
import AdminDashboardHeader from '../components/admin/admin-header/AdminDashboardHeader';
import AdminRecipesSection from '../components/admin/admin-recipes/AdminRecipesSection';
import AdminTabs, { AdminTabId } from '../components/admin/admin-tabs/AdminTabs';
import ErrorState from '../components/feedback/ErrorState';
import useAdminCategories from '../components/admin/hooks/useAdminCategories';
import useAdminComments from '../components/admin/hooks/useAdminComments';
import useAdminRecipes from '../components/admin/hooks/useAdminRecipes';
import './AdminDashboard.css';

const isAdminTab = (value: string | null): value is AdminTabId =>
  value === 'categories' || value === 'recipes' || value === 'comments';

function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: AdminTabId = isAdminTab(tabParam) ? tabParam : 'categories';
  const {
    categories,
    loadingCategories,
    categoriesError,
    categoryName,
    editingCategoryId,
    categorySubmitting,
    categoryDeletingId,
    setCategoryName,
    loadCategories,
    submitCategory,
    resetCategoryForm,
    startEditCategory,
    deleteCategory,
  } = useAdminCategories();
  const {
    pendingRecipes,
    loadingRecipes,
    recipesError,
    approvingId,
    loadPendingRecipes,
    approveRecipe,
  } = useAdminRecipes();
  const {
    comments,
    loadingComments,
    commentsError,
    commentBusyId,
    pendingComments,
    loadComments,
    updateCommentStatus,
    deleteComment,
  } = useAdminComments();

  const handleTabChange = (tab: AdminTabId) => {
    setSearchParams({ tab });
  };

  const error =
    activeTab === 'categories'
      ? categoriesError
      : activeTab === 'recipes'
        ? recipesError
        : commentsError;

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

      {error ? <ErrorState className="admin-dashboard-error" message={error} /> : null}

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
