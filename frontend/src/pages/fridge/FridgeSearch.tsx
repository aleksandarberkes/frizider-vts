import { useCallback, useEffect, useMemo, useState } from 'react';

import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';
import LoadingState from '../../components/feedback/LoadingState';
import RecipeCard from '../../components/recipes/RecipeCard/RecipeCard';
import { useRecipeFavorites } from '../../components/recipes/hooks/useRecipeFavorites';
import { FridgeRecipeMatch, IngredientOption } from '../../components/recipes/types';
import { favoritesApi } from '../../services/favoritesApi';
import { fridgeApi, FridgeIngredient } from '../../services/fridgeApi';
import { ingredientsApi } from '../../services/ingredientsApi';
import { mapApiError } from '../../utils/mapApiError';
import './FridgeSearch.css';

function FridgeSearch() {
  const [catalog, setCatalog] = useState<IngredientOption[]>([]);
  const [fridge, setFridge] = useState<FridgeIngredient[]>([]);
  const [matches, setMatches] = useState<FridgeRecipeMatch[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ingredient ids already in the fridge, to avoid duplicate adds.
  const fridgeIds = useMemo(
    () => new Set(fridge.map((item) => item.ingredient_id)),
    [fridge],
  );

  const loadFridgeAndMatches = useCallback(async () => {
    const [fridgeResponse, matchResponse] = await Promise.all([
      fridgeApi.list(),
      fridgeApi.match(),
    ]);
    setFridge(fridgeResponse);
    setMatches(matchResponse);
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const [catalogResponse, favoritesResponse] = await Promise.all([
          ingredientsApi.list(),
          favoritesApi.list(),
        ]);
        setCatalog(catalogResponse);
        setFavoriteIds(favoritesResponse.map((entry) => Number(entry.recipe_id)));
        await loadFridgeAndMatches();
      } catch (err) {
        setError(mapApiError(err, 'Ucitavanje frizidera nije uspelo.'));
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [loadFridgeAndMatches]);

  const { favoriteSet, favoriteBusyId, toggleFavorite } = useRecipeFavorites({
    favoriteIds,
    setFavoriteIds,
    isLoggedIn: true,
    onLoginRequired: () => {},
    onError: setError,
  });

  const addIngredient = async () => {
    const name = inputValue.trim();
    if (name === '') {
      return;
    }

    // The fridge only holds ingredients that already exist in the catalog; the
    // <datalist> suggests them by name, so match case-insensitively.
    const match = catalog.find(
      (ingredient) => ingredient.name.toLowerCase() === name.toLowerCase(),
    );
    if (!match) {
      setError(`Sastojak "${name}" ne postoji. Izaberite ponudeni sastojak iz liste.`);
      return;
    }
    if (fridgeIds.has(match.id)) {
      setInputValue('');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await fridgeApi.add(match.id);
      setInputValue('');
      await loadFridgeAndMatches();
    } catch (err) {
      setError(mapApiError(err, 'Dodavanje sastojka nije uspelo.'));
    } finally {
      setBusy(false);
    }
  };

  const removeIngredient = async (ingredientId: number) => {
    setBusy(true);
    setError(null);
    try {
      await fridgeApi.remove(ingredientId);
      await loadFridgeAndMatches();
    } catch (err) {
      setError(mapApiError(err, 'Uklanjanje sastojka nije uspelo.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="fridge-search">
      <header className="fridge-search-intro">
        <h2>Moj frizider</h2>
        <p>
          Dodajte sastojke koje imate kod kuce i pronadjite recepte koji koriste
          vase namirnice, a nedostaju im najvise 2 sastojka.
        </p>
      </header>

      {error ? <ErrorState message={error} /> : null}

      {loading ? (
        <LoadingState message="Ucitavanje frizidera..." />
      ) : (
        <div className="fridge-search-layout">
          <aside className="fridge-search-panel">
            <h3>Sastojci u frizideru</h3>

            <form
              className="fridge-search-add"
              onSubmit={(event) => {
                event.preventDefault();
                void addIngredient();
              }}
            >
              <input
                type="text"
                list="fridge-ingredient-suggestions"
                placeholder="npr. Piletina"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={busy}
              />
              <datalist id="fridge-ingredient-suggestions">
                {catalog.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.name}>
                    {ingredient.unit}
                  </option>
                ))}
              </datalist>
              <button type="submit" disabled={busy || inputValue.trim() === ''}>
                Dodaj
              </button>
            </form>

            {fridge.length === 0 ? (
              <EmptyState message="Frizider je prazan. Dodajte sastojke da vidite predloge." />
            ) : (
              <ul className="fridge-search-chips">
                {fridge.map((item) => (
                  <li key={item.ingredient_id} className="fridge-search-chip">
                    <span>{item.name}</span>
                    <button
                      type="button"
                      aria-label={`Ukloni ${item.name}`}
                      onClick={() => void removeIngredient(item.ingredient_id)}
                      disabled={busy}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="fridge-search-results">
            <h3>Predlozeni recepti</h3>
            {fridge.length === 0 ? (
              <EmptyState message="Dodajte bar jedan sastojak da biste videli recepte." />
            ) : matches.length === 0 ? (
              <EmptyState message="Nema recepata koji koriste vase namirnice i kojima nedostaju najvise 2 sastojka." />
            ) : (
              <div className="recipe-grid">
                {matches.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={favoriteSet.has(recipe.id)}
                    favoriteBusy={favoriteBusyId === recipe.id}
                    onToggleFavorite={(recipeId) => void toggleFavorite(recipeId)}
                    missingIngredients={recipe.missing_ingredients}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default FridgeSearch;
