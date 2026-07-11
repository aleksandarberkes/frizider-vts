import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import LoadingState from "../../components/feedback/LoadingState";
import RecipeCommentsSection from "../../components/recipes/RecipeCommentsSection/RecipeCommentsSection";
import RecipeFormModal from "../../components/recipes/RecipeFormModal/RecipeFormModal";
import { useRecipeDetailsData } from "../../components/recipes/hooks/useRecipeDetailsData";
import { useRecipeFavorites } from "../../components/recipes/hooks/useRecipeFavorites";
import { useRecipeForm } from "../../components/recipes/hooks/useRecipeForm";
import { commentsApi } from "../../services/commentsApi";
import { ratingsApi } from "../../services/ratingsApi";
import { RecipePayload, recipesApi } from "../../services/recipesApi";
import { mapApiError } from "../../utils/mapApiError";
import {
	formatPrice,
	getRecipeVisual,
	RECIPE_IMAGE_PLACEHOLDER,
} from "../../components/recipes/utils";
import "./RecipeDetails.css";

function RecipeDetails() {
	const { id } = useParams();
	const recipeId = Number(id);
	const navigate = useNavigate();
	const { user } = useAuth();
	const { openLoginModal } = useAuthModal();
	const {
		recipe,
		comments,
		categories,
		ingredientsCatalog,
		favoriteIds,
		userRatings,
		ratingAggregate,
		fridgeIngredientIds,
		loading,
		pageError,
		setComments,
		setIngredientsCatalog,
		setFavoriteIds,
		setUserRatings,
		setRatingAggregate,
		setPageError,
		loadDetail,
	} = useRecipeDetailsData(recipeId, user?.id);

	const [ratingBusy, setRatingBusy] = useState(false);
	const [commentDraft, setCommentDraft] = useState("");
	const [commentSaving, setCommentSaving] = useState(false);
	const [commentNotice, setCommentNotice] = useState<string | null>(null);
	const [recipeDeleteBusy, setRecipeDeleteBusy] = useState(false);

	const promptLogin = () => openLoginModal();

	const { favoriteSet, favoriteBusyId, toggleFavorite } = useRecipeFavorites({
		favoriteIds,
		setFavoriteIds,
		isLoggedIn: !!user,
		onLoginRequired: promptLogin,
		onError: setPageError,
	});

	const saveRecipe = async (payload: RecipePayload) => {
		await recipesApi.update(recipeId, payload);
	};

	const recipeForm = useRecipeForm({
		user,
		ingredientsCatalog,
		onIngredientsCreated: (createdIngredients) => {
			setIngredientsCatalog((current) =>
				[...current, ...createdIngredients].sort((left, right) =>
					left.name.localeCompare(right.name, "sr"),
				),
			);
		},
		onSaved: loadDetail,
		onLoginRequired: promptLogin,
		saveRecipe,
	});

	const submitRating = async (rating: number) => {
		if (!user) {
			promptLogin();
			return;
		}

		setRatingBusy(true);
		try {
			await ratingsApi.rateRecipe(recipeId, rating);
			setUserRatings((current) => ({
				...current,
				[recipeId]: rating,
			}));
			setRatingAggregate(await ratingsApi.getRecipeAggregate(recipeId));
		} catch (err) {
			setPageError(mapApiError(err, "Ocena nije sacuvana."));
		} finally {
			setRatingBusy(false);
		}
	};

	const submitComment = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!user) {
			promptLogin();
			return;
		}

		setCommentSaving(true);
		setCommentNotice(null);
		try {
			await commentsApi.createForRecipe(recipeId, commentDraft.trim());
			setCommentDraft("");
			setComments(await commentsApi.listForRecipe(recipeId));
			setCommentNotice("Komentar je poslat na odobravanje administratoru.");
		} catch (err) {
			setPageError(mapApiError(err, "Komentar nije sacuvan."));
		} finally {
			setCommentSaving(false);
		}
	};

	const deleteRecipe = async () => {
		if (
			!recipe ||
			!window.confirm(`Da li sigurno zelis da obrises recept "${recipe.name}"?`)
		) {
			return;
		}

		setRecipeDeleteBusy(true);
		try {
			await recipesApi.delete(recipeId);
			navigate("/recipes");
		} catch (err) {
			setPageError(mapApiError(err, "Brisanje recepta nije uspelo."));
		} finally {
			setRecipeDeleteBusy(false);
		}
	};

	if (loading) {
		return (
			<LoadingState message="Ucitavanje recepta..." className="recipe-details-page-loading" />
		);
	}

	if (pageError || !recipe) {
		return (
			<section className="recipe-details-page">
				<div className="recipe-details-page-error">
					<p>{pageError ?? "Recept nije pronadjen."}</p>
					<Link to="/recipes">Nazad na recepte</Link>
				</div>
			</section>
		);
	}

	const visual = getRecipeVisual(recipe);
	const category = recipe.categories[0]?.name ?? "Recept";
	const isFavorite = favoriteSet.has(recipeId);
	const isOwner = !!(user && recipe.created_by === user.id);
	const isAdmin = user?.role_name === "admin";
	const canManage = isOwner || isAdmin;
	// One comment per recipe: the list includes the caller's own (even pending) one.
	const alreadyCommented = !!(user && comments.some((comment) => comment.user_id === user.id));

	return (
		<section className="recipe-details-page">
			<Link className="recipe-details-page-back" to="/recipes">
				← Nazad na Recepte
			</Link>

			<div className="recipe-details-page-layout">
				<div className="recipe-details-page-main">
					<article className="recipe-details-page-hero-card">
						<div
							className="recipe-details-page-image"
						>
							<img
								src={visual.imageUrl}
								alt={recipe.name}
								onError={(event) => {
									event.currentTarget.src = RECIPE_IMAGE_PLACEHOLDER;
								}}
							/>
							<span className="recipe-details-page-tag">
								{recipe.categories[0]?.name ?? "Recept"}
							</span>
							<button
								type="button"
								className={
									isFavorite
										? "recipe-details-page-favorite recipe-details-page-favorite-active"
										: "recipe-details-page-favorite"
								}
								onClick={() => void toggleFavorite(recipeId)}
								disabled={favoriteBusyId === recipeId}
							>
								♡
							</button>
						</div>

						<div className="recipe-details-page-content">
							<div className="recipe-details-page-title-row">
								<div>
									<h1>{recipe.name}</h1>
									<p>{recipe.description ?? "Opis recepta nije dodat."}</p>
								</div>
								{canManage ? (
									<div className="recipe-details-page-owner-actions">
										<button
											type="button"
											onClick={() => recipeForm.openEditRecipeForm(recipe)}
										>
											Izmeni recept
										</button>
										<button
											type="button"
											onClick={deleteRecipe}
											disabled={recipeDeleteBusy}
										>
											Obrisi recept
										</button>
									</div>
								) : null}
							</div>

							{canManage && !recipe.is_approved && recipe.rejection_reason ? (
								<p className="recipe-details-page-rejection">
									Recept je odbijen. Razlog: {recipe.rejection_reason}
								</p>
							) : null}

							<div className="recipe-details-page-meta">
								<div className="recipe-details-page-meta-item recipe-details-page-meta-blue">
									<span>Namirnice</span>
									<strong>{recipe.ingredients.length}</strong>
								</div>
								<div className="recipe-details-page-meta-item recipe-details-page-meta-category">
									<span>Kategorija</span>
									<strong>{recipe.categories.length}</strong>
									<small>{category}</small>
								</div>
								<div className="recipe-details-page-meta-item recipe-details-page-meta-yellow">
									<span>Ocena</span>
									<strong>
										{ratingAggregate?.average ? `${ratingAggregate.average.toFixed(1)}/5` : "Nema"}
									</strong>
								</div>
								<div className="recipe-details-page-meta-item recipe-details-page-meta-green">
									<span>Cena</span>
									<strong>{formatPrice(recipe.estimated_price)}</strong>
								</div>
							</div>
						</div>
					</article>

					<RecipeCommentsSection
						comments={comments}
						commentDraft={commentDraft}
						commentSaving={commentSaving}
						commentNotice={commentNotice}
						currentUserRating={userRatings[recipeId]}
						ratingBusy={ratingBusy}
						isLoggedIn={!!user}
						alreadyCommented={alreadyCommented}
						onCommentDraftChange={setCommentDraft}
						onSubmitComment={submitComment}
						onPromptLogin={promptLogin}
						onRateRecipe={submitRating}
					/>
				</div>

				<aside className="recipe-details-page-sidebar">
					<section className="recipe-details-page-sidebar-card">
						<div className="recipe-details-page-sidebar-head">
							<h2>Namirnice</h2>
							<span>{recipe.ingredients.length}</span>
						</div>

						{recipe.ingredients.length > 0 ? (
							<ul className="recipe-details-page-ingredients-list">
								{recipe.ingredients.map((ingredient) => {
									const quantity =
										ingredient.quantity !== null
											? `${ingredient.quantity} ${ingredient.unit}`.trim()
											: ingredient.unit;

									return (
										<li
											key={ingredient.ingredient_id}
											className="recipe-details-page-ingredient-item"
										>
											<div>
												<strong>{ingredient.name}</strong>
												<p>{quantity || "Kolicina nije uneta"}</p>
											</div>
											{fridgeIngredientIds.has(ingredient.ingredient_id) ? (
												<span className="recipe-details-page-ingredient-status">
													U frizideru
												</span>
											) : null}
										</li>
									);
								})}
							</ul>
						) : (
							<p className="recipe-details-page-sidebar-empty">
								Nema dodatih namirnica za ovaj recept.
							</p>
						)}
					</section>
				</aside>
			</div>

			<RecipeFormModal
				isOpen={recipeForm.showRecipeForm}
				editingRecipeId={recipeForm.editingRecipeId}
				recipeForm={recipeForm.recipeForm}
				categories={categories}
				ingredientsCatalog={ingredientsCatalog}
				recipeFormError={recipeForm.recipeFormError}
				recipeFormSaving={recipeForm.recipeFormSaving}
				imagePreviewUrl={recipeForm.imagePreviewUrl}
				hasSelectedImage={recipeForm.hasSelectedImage}
				onClose={recipeForm.closeRecipeForm}
				onSubmit={recipeForm.submitRecipeForm}
				onFieldChange={recipeForm.updateRecipeFormField}
				onImageFileChange={recipeForm.updateRecipeImageFile}
				onIngredientRowChange={recipeForm.handleIngredientRowChange}
				onAddIngredientRow={recipeForm.addIngredientRow}
				onRemoveIngredientRow={recipeForm.removeIngredientRow}
				onToggleCategory={recipeForm.toggleFormCategory}
			/>
		</section>
	);
}

export default RecipeDetails;
