import { Link } from 'react-router-dom';

import { RatingAggregate, Recipe } from '../types';
import { formatPrice, getRecipeVisual, RECIPE_IMAGE_PLACEHOLDER } from '../utils';
import './RecipeCard.css';

type RecipeCardProps = {
  recipe: Recipe;
  aggregate?: RatingAggregate;
  isFavorite: boolean;
  favoriteBusy: boolean;
  onToggleFavorite: (recipeId: number) => void;
};

function RecipeCard({ recipe, aggregate, isFavorite, favoriteBusy, onToggleFavorite }: RecipeCardProps) {
  const visual = getRecipeVisual(recipe);
  const category = recipe.categories[0]?.name ?? 'Recept';

  return (
    <article className="recipe-card">
      <div className="recipe-card-image">
        <img
          src={visual.imageUrl}
          alt={recipe.name}
          onError={(event) => {
            event.currentTarget.src = RECIPE_IMAGE_PLACEHOLDER;
          }}
        />
        <span className="recipe-card-tag">{category}</span>
        <button
          type="button"
          className={isFavorite ? 'recipe-card-favorite recipe-card-favorite-active' : 'recipe-card-favorite'}
          onClick={() => onToggleFavorite(recipe.id)}
          disabled={favoriteBusy}
          aria-label="Sacuvaj recept"
        >
          <img src="/icons/fav-icon.svg" alt="Add to favorites icon" className={isFavorite ? 'add-to-favorite-icon add-to-favorite-icon-active' : 'add-to-favorite-icon'} />
        </button>
      </div>

      <div className="recipe-card-body">
        <div className="recipe-card-header">
          <h2>{recipe.name}</h2>
          <p>{recipe.description ?? 'Opis recepta nije dodat.'}</p>
        </div>
        <div className="recipe-card-rating">
          {aggregate ? (
            <>
              <span className="recipe-card-rating-star">★</span>
              <span className="recipe-card-rating-average">{aggregate.average ? aggregate.average.toFixed(1) : '0.0'}</span>
             
            </>
          ) : (
            <span className="recipe-card-rating-average">Nema ocena</span>
          )}
        </div>

        <div className="recipe-card-footer">
          <strong className="recipe-card-price">{formatPrice(recipe.estimated_price)}</strong>
          <Link className="recipe-card-link" to={`/recipes/${recipe.id}`}>
            Vidi recept
          </Link>
        </div>
      </div>
    </article>
  );
}

export default RecipeCard;
