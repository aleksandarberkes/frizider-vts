import { Link } from 'react-router-dom';

import { RatingAggregate, Recipe, RecipeIngredient } from '../types';
import { formatPrice, getRecipeVisual, RECIPE_IMAGE_PLACEHOLDER } from '../utils';
import './RecipeCard.css';

type RecipeCardProps = {
  recipe: Recipe;
  aggregate?: RatingAggregate;
  isFavorite: boolean;
  favoriteBusy: boolean;
  onToggleFavorite: (recipeId: number) => void;
  // When rendered from "Moj frizider", the ingredients the user is missing.
  missingIngredients?: RecipeIngredient[];
};

function RecipeCard({
  recipe,
  aggregate,
  isFavorite,
  favoriteBusy,
  onToggleFavorite,
  missingIngredients,
}: RecipeCardProps) {
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

        {missingIngredients ? (
          missingIngredients.length === 0 ? (
            <p className="recipe-card-missing recipe-card-missing-complete">
              Imate sve sastojke! 🎉
            </p>
          ) : (
            <div className="recipe-card-missing">
              <span className="recipe-card-missing-label">
                Nedostaje {missingIngredients.length}:
              </span>
              <ul className="recipe-card-missing-list">
                {missingIngredients.map((ingredient) => (
                  <li key={ingredient.ingredient_id} className="recipe-card-missing-item">
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : null}

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
