import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AdminCategoriesSection from '../components/admin/admin-categories/AdminCategoriesSection';
import AdminCommentsSection from '../components/admin/admin-comments/AdminCommentsSection';
import AdminDashboardHeader from '../components/admin/admin-header/AdminDashboardHeader';
import AdminIngredientsSection from '../components/admin/admin-ingredients/AdminIngredientsSection';
import AdminRecipesSection from '../components/admin/admin-recipes/AdminRecipesSection';
import AdminUsersSection from '../components/admin/admin-users/AdminUsersSection';
import AdminTabs, { AdminTabId } from '../components/admin/admin-tabs/AdminTabs';
import ErrorState from '../components/feedback/ErrorState';
import useAdminCategories from '../components/admin/hooks/useAdminCategories';
import useAdminComments from '../components/admin/hooks/useAdminComments';
import useAdminIngredients from '../components/admin/hooks/useAdminIngredients';
import useAdminRecipes from '../components/admin/hooks/useAdminRecipes';
import useAdminUsers from '../components/admin/hooks/useAdminUsers';
import './AdminDashboard.css';

const isAdminTab = (value: string | null): value is AdminTabId =>
  value === 'categories' ||
  value === 'ingredients' ||
  value === 'recipes' ||
  value === 'comments' ||
  value === 'users';

function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
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
    ingredients,
    loadingIngredients,
    ingredientsError,
    ingredientName,
    ingredientUnit,
    editingIngredientId,
    ingredientSubmitting,
    ingredientDeletingId,
    setIngredientName,
    setIngredientUnit,
    loadIngredients,
    submitIngredient,
    resetIngredientForm,
    startEditIngredient,
    deleteIngredient,
  } = useAdminIngredients();

  const {
    recipes,
    loadingRecipes,
    recipesError,
    recipeBusyId,
    loadRecipes,
    approveRecipe,
    rejectRecipe,
    deleteRecipe,
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

  const {
    users,
    loadingUsers,
    usersError,
    userBusyId,
    loadUsers,
    toggleActive,
    changeRole,
    deleteUser,
  } = useAdminUsers();

  const handleTabChange = (tab: AdminTabId) => {
    setSearchParams({ tab });
  };

  const error =
    activeTab === 'categories'
      ? categoriesError
      : activeTab === 'ingredients'
        ? ingredientsError
        : activeTab === 'recipes'
          ? recipesError
          : activeTab === 'comments'
            ? commentsError
            : usersError;

  const refreshConfig: Record<AdminTabId, { label: string; action: () => void; disabled: boolean }> = {
    categories: { label: 'Osvezi kategorije', action: () => void loadCategories(), disabled: loadingCategories },
    ingredients: { label: 'Osvezi namirnice', action: () => void loadIngredients(), disabled: loadingIngredients },
    recipes: { label: 'Osvezi recepte', action: () => void loadRecipes(), disabled: loadingRecipes },
    comments: { label: 'Osvezi komentare', action: () => void loadComments(), disabled: loadingComments },
    users: { label: 'Osvezi korisnike', action: () => void loadUsers(), disabled: loadingUsers },
  };

  const renderRefreshButton = () => {
    const config = refreshConfig[activeTab];
    return (
      <button
        type="button"
        className="admin-dashboard-refresh"
        onClick={config.action}
        disabled={config.disabled}
      >
        {config.label}
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

        {activeTab === 'ingredients' ? (
          <AdminIngredientsSection
            ingredients={ingredients}
            loading={loadingIngredients}
            ingredientName={ingredientName}
            ingredientUnit={ingredientUnit}
            editingIngredientId={editingIngredientId}
            ingredientSubmitting={ingredientSubmitting}
            ingredientDeletingId={ingredientDeletingId}
            onNameChange={setIngredientName}
            onUnitChange={setIngredientUnit}
            onSubmit={submitIngredient}
            onReset={resetIngredientForm}
            onStartEdit={startEditIngredient}
            onDelete={(ingredientId) => void deleteIngredient(ingredientId)}
          />
        ) : null}

        {activeTab === 'recipes' ? (
          <AdminRecipesSection
            recipes={recipes}
            loading={loadingRecipes}
            recipeBusyId={recipeBusyId}
            onApprove={(recipe) => void approveRecipe(recipe)}
            onReject={(recipe, reason) => void rejectRecipe(recipe, reason)}
            onDelete={(recipeId) => void deleteRecipe(recipeId)}
          />
        ) : null}

        {activeTab === 'comments' ? (
          <AdminCommentsSection
            comments={comments}
            pendingCommentsCount={pendingComments.length}
            loading={loadingComments}
            commentBusyId={commentBusyId}
            onUpdateStatus={(comment, isApproved, rejectionReason) =>
              void updateCommentStatus(comment, isApproved, rejectionReason)
            }
            onDelete={(commentId) => void deleteComment(commentId)}
          />
        ) : null}

        {activeTab === 'users' ? (
          <AdminUsersSection
            users={users}
            loading={loadingUsers}
            userBusyId={userBusyId}
            currentUserId={user?.id}
            onToggleActive={(target) => void toggleActive(target)}
            onChangeRole={(target, roleId) => void changeRole(target, roleId)}
            onDelete={(userId) => void deleteUser(userId)}
          />
        ) : null}
      </div>
    </section>
  );
}

export default AdminDashboard;
