import { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { favoritesApi } from '../../../services/favoritesApi';
import { mapApiError } from '../../../utils/mapApiError';

type UseRecipeFavoritesParams = {
  favoriteIds: number[];
  setFavoriteIds: Dispatch<SetStateAction<number[]>>;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onError: (message: string) => void;
};

export function useRecipeFavorites({
  favoriteIds,
  setFavoriteIds,
  isLoggedIn,
  onLoginRequired,
  onError,
}: UseRecipeFavoritesParams) {
  const [favoriteBusyId, setFavoriteBusyId] = useState<number | null>(null);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = async (recipeId: number) => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    setFavoriteBusyId(recipeId);
    try {
      if (favoriteSet.has(recipeId)) {
        await favoritesApi.remove(recipeId);
        setFavoriteIds((current) => current.filter((id) => id !== recipeId));
      } else {
        await favoritesApi.add(recipeId);
        setFavoriteIds((current) => [...current, recipeId]);
      }
    } catch (err) {
      onError(mapApiError(err, 'Izmena omiljenih recepata nije uspela.'));
    } finally {
      setFavoriteBusyId(null);
    }
  };

  return {
    favoriteSet,
    favoriteBusyId,
    toggleFavorite,
  };
}
