import { Link } from 'react-router-dom';
import RecipeMeta from '../RecipeMeta/RecipeMeta';
import { RatingAggregate, Recipe } from '../types';
import { formatPrice, getRecipeVisual } from '../utils';
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
      <div
        className="recipe-card__image"
        style={
          visual.imageUrl
            ? { backgroundImage: `url(${visual.imageUrl})` }
            : { backgroundImage: visual.gradient }
        }
      >
        <span className="recipe-card__tag">{category}</span>
        <button
          type="button"
          className={isFavorite ? 'recipe-card__favorite recipe-card__favorite--active' : 'recipe-card__favorite'}
          onClick={() => onToggleFavorite(recipe.id)}
          disabled={favoriteBusy}
          aria-label="Sacuvaj recept"
        >
          <img src="/icons/fav-icon.svg" alt="Add to favorites icon" className={isFavorite ? 'add-to-favorite-icon add-to-favorite-icon--active' : 'add-to-favorite-icon'} />
        </button>
      </div>

      <div className="recipe-card__body">
        <div className="recipe-card__copy">
          <h2>{recipe.name}</h2>
          <p>{recipe.description ?? 'Opis recepta nije dodat.'}</p>
        </div>

        <RecipeMeta
          items={[
            { label: 'Namirnice', value: `${recipe.ingredients.length}`, tone: 'blue' },
            { label: 'Kategorije', value: `${recipe.categories.length}`, tone: 'purple' },
            {
              label: 'Ocena',
              value: aggregate?.average ? `${aggregate.average.toFixed(1)}` : 'Nema',
              tone: 'yellow',
            },
          ]}
        />

        <div className="recipe-card__footer">
          <strong className="recipe-card__price">{formatPrice(recipe.estimated_price)}</strong>
          <Link className="recipe-card__link" to={`/recipes/${recipe.id}`}>
            Vidi recept
          </Link>
        </div>
      </div>
    </article>
  );
}

export default RecipeCard;
