import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../api";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import LoadingState from "../components/feedback/LoadingState";
import RecipeGrid from "../components/recipes/RecipeGrid/RecipeGrid";
import {
	RatingAggregate,
	Recipe,
} from "../components/recipes/types";
import { favoritesApi } from "../services/favoritesApi";
import { ratingsApi } from "../services/ratingsApi";
import { recipesApi } from "../services/recipesApi";

function FridgeFavorites() {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [ratingSummary, setRatingSummary] = useState<
		Record<number, RatingAggregate>
	>({});
	const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
	const [favoriteBusyId, setFavoriteBusyId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadFavorites = async () => {
			setLoading(true);
			setError(null);

			try {
				const [recipesResponse, favoritesResponse] = await Promise.all([
					recipesApi.list(),
					favoritesApi.list(),
				]);
				const nextFavoriteIds = favoritesResponse.map((entry) =>
					Number(entry.recipe_id),
				);
				const favoriteSet = new Set(nextFavoriteIds);
				const favoriteRecipes = recipesResponse.filter((recipe) =>
					favoriteSet.has(recipe.id),
				);
				const ratingResponses = await Promise.all(
					favoriteRecipes.map((recipe) =>
						ratingsApi.getRecipeAggregate(recipe.id),
					),
				);
				const nextRatingSummary = ratingResponses.reduce<
					Record<number, RatingAggregate>
				>((acc, aggregate) => {
					acc[aggregate.recipe_id] = aggregate;
					return acc;
				}, {});

				setFavoriteIds(nextFavoriteIds);
				setRecipes(favoriteRecipes);
				setRatingSummary(nextRatingSummary);
			} catch (err) {
				if (err instanceof TypeError) {
					setError(
						"Backend nije dostupan na http://localhost/frizider-vts/backend.",
					);
				} else if (err instanceof ApiError || err instanceof Error) {
					setError(err.message);
				} else {
					setError("Ucitavanje omiljenih recepata nije uspelo.");
				}
			} finally {
				setLoading(false);
			}
		};

		void loadFavorites();
	}, []);

	const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

	const toggleFavorite = async (recipeId: number) => {
		setFavoriteBusyId(recipeId);
		setError(null);

		try {
			if (favoriteSet.has(recipeId)) {
				await favoritesApi.remove(recipeId);
				setFavoriteIds((current) => current.filter((id) => id !== recipeId));
				setRatingSummary((current) => {
					const next = { ...current };
					delete next[recipeId];
					return next;
				});
				setRecipes((current) =>
					current.filter((recipe) => recipe.id !== recipeId),
				);
			} else {
				await favoritesApi.add(recipeId);
				setFavoriteIds((current) => [...current, recipeId]);
			}
		} catch (err) {
			if (err instanceof TypeError) {
				setError(
					"Backend nije dostupan na http://localhost/frizider-vts/backend.",
				);
			} else if (err instanceof ApiError || err instanceof Error) {
				setError(err.message);
			} else {
				setError("Izmena omiljenih recepata nije uspela.");
			}
		} finally {
			setFavoriteBusyId(null);
		}
	};

	return (
		<section>
			<h2>Omiljeni recepti</h2>
			<p>Ovde su recepti koje si lajkovao i sacuvao u omiljene.</p>

			{error ? <ErrorState message={error} /> : null}

			{loading ? (
				<LoadingState message="Ucitavanje omiljenih recepata..." />
			) : recipes.length === 0 ? (
				<EmptyState message="Jos uvek nemas sacuvanih omiljenih recepata." />
			) : (
				<div className="fridge-favorites-container">
					<RecipeGrid
						recipes={recipes}
						ratingSummary={ratingSummary}
						favoriteIds={favoriteSet}
						favoriteBusyId={favoriteBusyId}
						onToggleFavorite={(recipeId) => void toggleFavorite(recipeId)}
					/>
				</div>
			)}
		</section>
	);
}

export default FridgeFavorites;
