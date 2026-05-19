import RecipeCard from '../RecipeCard/RecipeCard';
import { RatingAggregate, Recipe } from '../types';
import './RecipeGrid.css';

type RecipeGridProps = {
  recipes: Recipe[];
  ratingSummary: Record<number, RatingAggregate>;
  favoriteIds: Set<number>;
  favoriteBusyId: number | null;
  onToggleFavorite: (recipeId: number) => void;
};

function RecipeGrid({
  recipes,
  ratingSummary,
  favoriteIds,
  favoriteBusyId,
  onToggleFavorite,
}: RecipeGridProps) {
  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          aggregate={ratingSummary[recipe.id]}
          isFavorite={favoriteIds.has(recipe.id)}
          favoriteBusy={favoriteBusyId === recipe.id}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

export default RecipeGrid;
