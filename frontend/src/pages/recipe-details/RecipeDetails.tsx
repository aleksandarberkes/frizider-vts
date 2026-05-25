import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import RecipeCommentsSection from "../../components/recipes/RecipeCommentsSection/RecipeCommentsSection";
import RecipeFormModal from "../../components/recipes/RecipeFormModal/RecipeFormModal";
import RecipeMeta from "../../components/recipes/RecipeMeta/RecipeMeta";
import {
	Category,
	FavoriteRecipe,
	IngredientOption,
	RatingAggregate,
	Recipe,
	RecipeComment,
	RecipeFormIngredient,
	RecipeFormState,
	UserRating,
} from "../../components/recipes/types";
import {
	emptyRecipeForm,
	emptyRecipeIngredientRow,
	findIngredientByName,
	formatPrice,
	getRecipeVisual,
} from "../../components/recipes/utils";
import "./RecipeDetails.css";
import LoadingState from "../../components/feedback/LoadingState";

type FridgeIngredient = {
	ingredient_id: number;
};

function RecipeDetails() {
	const { id } = useParams();
	const recipeId = Number(id);
	const navigate = useNavigate();
	const { user } = useAuth();
	const { openLoginModal } = useAuthModal();

	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const [comments, setComments] = useState<RecipeComment[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [ingredientsCatalog, setIngredientsCatalog] = useState<
		IngredientOption[]
	>([]);
	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	const [userRatings, setUserRatings] = useState<Record<number, number>>({});
	const [ratingAggregate, setRatingAggregate] =
		useState<RatingAggregate | null>(null);
	const [fridgeIngredientIds, setFridgeIngredientIds] = useState<Set<number>>(
		new Set(),
	);
	const [loading, setLoading] = useState(true);
	const [pageError, setPageError] = useState<string | null>(null);
	const [favoriteBusy, setFavoriteBusy] = useState(false);
	const [ratingBusy, setRatingBusy] = useState(false);
	const [commentDraft, setCommentDraft] = useState("");
	const [commentSaving, setCommentSaving] = useState(false);
	const [commentNotice, setCommentNotice] = useState<string | null>(null);

	const [showRecipeForm, setShowRecipeForm] = useState(false);
	const [recipeForm, setRecipeForm] = useState<RecipeFormState>(emptyRecipeForm);
	const [recipeFormError, setRecipeFormError] = useState<string | null>(null);
	const [recipeFormSaving, setRecipeFormSaving] = useState(false);
	const [recipeDeleteBusy, setRecipeDeleteBusy] = useState(false);
	const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState("");

	const mapError = (err: unknown, fallback: string) => {
		if (err instanceof TypeError) {
			return "Backend nije dostupan na http://localhost/frizider-vts/backend.";
		}
		if (err instanceof ApiError || err instanceof Error) {
			return err.message;
		}
		return fallback;
	};

	const loadDetail = async () => {
		if (!recipeId) {
			setPageError("Neispravan recept.");
			return;
		}

		setLoading(true);
		setPageError(null);
		setCommentNotice(null);

		try {
			const [
				recipeResponse,
				commentsResponse,
				aggregateResponse,
				categoriesResponse,
				ingredientsResponse,
			] = await Promise.all([
				api.get<Recipe>(`/api/recipes/${recipeId}`),
				api.get<RecipeComment[]>(`/api/comments?recipe_id=${recipeId}`),
				api.get<RatingAggregate>(`/api/ratings/recipe/${recipeId}`),
				api.get<Category[]>("/api/categories"),
				api.get<IngredientOption[]>("/api/ingredients"),
			]);

			let favoritesResponse: FavoriteRecipe[] = [];
			let ratingsResponse: UserRating[] = [];
			let fridgeResponse: FridgeIngredient[] = [];

			if (user) {
				[favoritesResponse, ratingsResponse, fridgeResponse] =
					await Promise.all([
						api.get<FavoriteRecipe[]>("/api/favorites"),
						api.get<UserRating[]>("/api/ratings"),
						api.get<FridgeIngredient[]>("/api/fridge"),
					]);
			}

			setRecipe(recipeResponse);
			setComments(commentsResponse);
			setRatingAggregate(aggregateResponse);
			setCategories(categoriesResponse);
			setIngredientsCatalog(ingredientsResponse);
			setFavoriteIds(favoritesResponse.map((entry) => entry.recipe_id));
			setUserRatings(
				ratingsResponse.reduce<Record<number, number>>((acc, entry) => {
					acc[entry.recipe_id] = entry.rating;
					return acc;
				}, {}),
			);
			setFridgeIngredientIds(
				new Set(fridgeResponse.map((item) => item.ingredient_id)),
			);
		} catch (err) {
			setPageError(mapError(err, "Ucitavanje recepta nije uspelo."));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDetail();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [recipeId, user?.id]);

	useEffect(() => {
		if (!selectedImageFile) {
			setImagePreviewUrl(recipeForm.image_path.trim());
			return;
		}

		const objectUrl = URL.createObjectURL(selectedImageFile);
		setImagePreviewUrl(objectUrl);

		return () => {
			URL.revokeObjectURL(objectUrl);
		};
	}, [selectedImageFile, recipeForm.image_path]);

	const isFavorite = useMemo(
		() => favoriteIds.includes(recipeId),
		[favoriteIds, recipeId],
	);
	const isOwner = !!(user && recipe && recipe.created_by === user.id);

	const promptLogin = () => openLoginModal();

	const toggleFavorite = async () => {
		if (!user) {
			promptLogin();
			return;
		}

		setFavoriteBusy(true);
		try {
			if (isFavorite) {
				await api.delete<{ ok: boolean }>(`/api/favorites/${recipeId}`);
				setFavoriteIds((current) =>
					current.filter((currentId) => currentId !== recipeId),
				);
			} else {
				await api.post("/api/favorites", { recipe_id: recipeId });
				setFavoriteIds((current) => [...current, recipeId]);
			}
		} catch (err) {
			setPageError(mapError(err, "Izmena omiljenih recepata nije uspela."));
		} finally {
			setFavoriteBusy(false);
		}
	};

	const submitRating = async (rating: number) => {
		if (!user) {
			promptLogin();
			return;
		}

		setRatingBusy(true);
		try {
			await api.post("/api/ratings", {
				recipe_id: recipeId,
				rating,
			});
			setUserRatings((current) => ({
				...current,
				[recipeId]: rating,
			}));
			setRatingAggregate(
				await api.get<RatingAggregate>(`/api/ratings/recipe/${recipeId}`),
			);
		} catch (err) {
			setPageError(mapError(err, "Ocena nije sacuvana."));
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
			await api.post("/api/comments", {
				recipe_id: recipeId,
				content: commentDraft.trim(),
			});
			setCommentDraft("");
			setComments(
				await api.get<RecipeComment[]>(`/api/comments?recipe_id=${recipeId}`),
			);
			setCommentNotice("Komentar je poslat na odobravanje administratoru.");
		} catch (err) {
			setPageError(mapError(err, "Komentar nije sacuvan."));
		} finally {
			setCommentSaving(false);
		}
	};

	const openEditRecipeForm = () => {
		if (!recipe) {
			return;
		}

		setRecipeForm({
			name: recipe.name,
			description: recipe.description ?? "",
			image_path: recipe.image_path ?? "",
			estimated_price: recipe.estimated_price?.toString() ?? "",
			categories: recipe.categories
				.map((category) =>
					typeof category.category_id === "number"
						? category.category_id
						: category.id,
				)
				.filter((categoryId): categoryId is number => typeof categoryId === "number"),
			ingredients:
				recipe.ingredients.length > 0
					? recipe.ingredients.map((ingredient) => ({
							ingredient_id: ingredient.ingredient_id.toString(),
							ingredient_name: ingredient.name,
							unit: ingredient.unit,
							quantity: ingredient.quantity?.toString() ?? "",
						}))
					: [emptyRecipeIngredientRow()],
		});
		setSelectedImageFile(null);
		setImagePreviewUrl(recipe.image_path ?? "");
		setRecipeFormError(null);
		setShowRecipeForm(true);
	};

	const closeRecipeForm = () => {
		setShowRecipeForm(false);
		setSelectedImageFile(null);
		setImagePreviewUrl("");
		setRecipeFormError(null);
	};

	const updateRecipeFormField = (
		field: keyof RecipeFormState,
		value: string | number[],
	) => {
		if (field === "image_path" && selectedImageFile) {
			setSelectedImageFile(null);
		}
		setRecipeForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const updateRecipeImageFile = (file: File | null) => {
		if (!file) {
			setSelectedImageFile(null);
			return;
		}

		if (!file.type.startsWith("image/")) {
			setRecipeFormError("Mozes da dodas samo sliku za recept.");
			return;
		}

		setRecipeFormError(null);
		setRecipeForm((current) => ({
			...current,
			image_path: "",
		}));
		setSelectedImageFile(file);
	};

	const handleIngredientRowChange = (
		index: number,
		field: keyof RecipeFormIngredient,
		value: string,
	) => {
		const nextRows = recipeForm.ingredients.map((row, rowIndex) => {
			if (rowIndex !== index) {
				return row;
			}

			const nextRow = { ...row, [field]: value };
			if (field === "ingredient_name") {
				const matchedIngredient = findIngredientByName(ingredientsCatalog, value);
				nextRow.ingredient_id = matchedIngredient
					? matchedIngredient.id.toString()
					: "";
				if (matchedIngredient && nextRow.unit.trim() === "") {
					nextRow.unit = matchedIngredient.unit;
				}
			}

			return nextRow;
		});
		setRecipeForm((current) => ({
			...current,
			ingredients: nextRows,
		}));
	};

	const addIngredientRow = () => {
		setRecipeForm((current) => ({
			...current,
			ingredients: [
				...current.ingredients,
				emptyRecipeIngredientRow(),
			],
		}));
	};

	const removeIngredientRow = (index: number) => {
		const nextRows = recipeForm.ingredients.filter(
			(_, rowIndex) => rowIndex !== index,
		);
		setRecipeForm((current) => ({
			...current,
			ingredients:
				nextRows.length > 0 ? nextRows : [emptyRecipeIngredientRow()],
		}));
	};

	const toggleFormCategory = (categoryId: number) => {
		const hasCategory = recipeForm.categories.includes(categoryId);
		setRecipeForm((current) => ({
			...current,
			categories: hasCategory
				? current.categories.filter((entry) => entry !== categoryId)
				: [...current.categories, categoryId],
		}));
	};

	const submitRecipeForm = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const ingredientRows = recipeForm.ingredients.filter(
			(row) =>
				row.ingredient_name.trim() !== "" ||
				row.quantity.trim() !== "" ||
				row.unit.trim() !== "",
		);

		if (ingredientRows.length === 0) {
			setRecipeFormError("Dodaj barem jednu namirnicu za recept.");
			return;
		}

		setRecipeFormSaving(true);
		setRecipeFormError(null);

		try {
			const createdIngredients: IngredientOption[] = [];
			const cleanedIngredients = [];

			for (const row of ingredientRows) {
				const ingredientName = row.ingredient_name.trim();
				const unit = row.unit.trim();

				if (ingredientName === "") {
					setRecipeFormError("Svaka namirnica mora da ima naziv.");
					return;
				}

				if (unit === "") {
					setRecipeFormError(`Unesi jedinicu mere za "${ingredientName}".`);
					return;
				}

				const matchedIngredient = findIngredientByName(
					[...ingredientsCatalog, ...createdIngredients],
					ingredientName,
				);

				let ingredientId: number;
				if (matchedIngredient) {
					ingredientId = matchedIngredient.id;
				} else {
					const createdIngredient = await api.post<IngredientOption>(
						"/api/ingredients",
						{
							name: ingredientName,
							unit,
						},
					);
					createdIngredients.push(createdIngredient);
					ingredientId = createdIngredient.id;
				}

				cleanedIngredients.push({
					ingredient_id: ingredientId,
					quantity: row.quantity.trim() === "" ? null : Number(row.quantity),
				});
			}

			let imagePath = recipeForm.image_path.trim();
			if (selectedImageFile) {
				const formData = new FormData();
				formData.append("image", selectedImageFile);
				const uploadResponse = await api.upload<{ path: string }>(
					"/api/uploads",
					formData,
				);
				imagePath = uploadResponse.path;
			}

			await api.put<Recipe>(`/api/recipes/${recipeId}`, {
				name: recipeForm.name.trim(),
				description: recipeForm.description.trim(),
				image_path: imagePath,
				estimated_price:
					recipeForm.estimated_price.trim() === ""
						? null
						: Number(recipeForm.estimated_price),
				ingredients: cleanedIngredients,
				categories: recipeForm.categories,
			});
			if (createdIngredients.length > 0) {
				setIngredientsCatalog((current) =>
					[...current, ...createdIngredients].sort((left, right) =>
						left.name.localeCompare(right.name, "sr"),
					),
				);
			}
			closeRecipeForm();
			await loadDetail();
		} catch (err) {
			setRecipeFormError(mapError(err, "Cuvanje recepta nije uspelo."));
		} finally {
			setRecipeFormSaving(false);
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
			await api.delete<{ ok: boolean }>(`/api/recipes/${recipeId}`);
			navigate("/recipes");
		} catch (err) {
			setPageError(mapError(err, "Brisanje recepta nije uspelo."));
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
							style={
								visual.imageUrl
									? { backgroundImage: `url(${visual.imageUrl})` }
									: { backgroundImage: visual.gradient }
							}
						>
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
								onClick={toggleFavorite}
								disabled={favoriteBusy}
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
								{isOwner ? (
									<div className="recipe-details-page-owner-actions">
										<button type="button" onClick={openEditRecipeForm}>
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

							<RecipeMeta
								items={[
									{
										label: "Namirnice",
										value: `${recipe.ingredients.length}`,
										tone: "blue",
									},
									{
										label: "Kategorija",
										value: `${recipe.categories.length}`,
										category,
										tone: "category",
									},
									{
										label: "Ocena",
										value: ratingAggregate?.average
											? `${ratingAggregate.average.toFixed(1)}/5`
											: "Nema",
										tone: "yellow",
									},
									{
										label: "Cena",
										value: formatPrice(recipe.estimated_price),
										tone: "green",
									},
								]}
							/>
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
				isOpen={showRecipeForm}
				editingRecipeId={recipeId}
				recipeForm={recipeForm}
				categories={categories}
				ingredientsCatalog={ingredientsCatalog}
				recipeFormError={recipeFormError}
				recipeFormSaving={recipeFormSaving}
				imagePreviewUrl={imagePreviewUrl}
				hasSelectedImage={!!selectedImageFile || recipeForm.image_path.trim() !== ""}
				onClose={closeRecipeForm}
				onSubmit={submitRecipeForm}
				onFieldChange={updateRecipeFormField}
				onImageFileChange={updateRecipeImageFile}
				onIngredientRowChange={handleIngredientRowChange}
				onAddIngredientRow={addIngredientRow}
				onRemoveIngredientRow={removeIngredientRow}
				onToggleCategory={toggleFormCategory}
			/>
		</section>
	);
}

export default RecipeDetails;
