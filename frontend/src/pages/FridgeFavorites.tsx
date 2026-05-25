import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api";
import RecipeGrid from "../components/recipes/RecipeGrid/RecipeGrid";
import { FavoriteRecipe, Recipe } from "../components/recipes/types";

function FridgeFavorites() {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
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
					api.get<Recipe[]>("/api/recipes"),
					api.get<FavoriteRecipe[]>("/api/favorites"),
				]);
				const nextFavoriteIds = favoritesResponse.map((entry) =>
					Number(entry.recipe_id),
				);
				const favoriteSet = new Set(nextFavoriteIds);

				setFavoriteIds(nextFavoriteIds);
				setRecipes(
					recipesResponse.filter((recipe) => favoriteSet.has(recipe.id)),
				);
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
				await api.delete<{ ok: boolean }>(`/api/favorites/${recipeId}`);
				setFavoriteIds((current) => current.filter((id) => id !== recipeId));
				setRecipes((current) =>
					current.filter((recipe) => recipe.id !== recipeId),
				);
			} else {
				await api.post("/api/favorites", { recipe_id: recipeId });
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

			{error ? <p>{error}</p> : null}

			{loading ? (
				<p>Ucitavanje omiljenih recepata...</p>
			) : recipes.length === 0 ? (
				<p>Jos uvek nemas sacuvanih omiljenih recepata.</p>
			) : (
				<div className="fridge-favorites-container">
					<RecipeGrid
						recipes={recipes}
						ratingSummary={{}}
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
