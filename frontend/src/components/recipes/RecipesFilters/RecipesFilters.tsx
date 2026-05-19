import { Category, PriceFilter, RatingFilter } from '../types';
import './RecipesFilters.css';

type RecipesFiltersProps = {
  categories: Category[];
  searchTerm: string;
  selectedCategoryId: number | 'all';
  priceFilter: PriceFilter;
  ratingFilter: RatingFilter;
  favoritesOnly: boolean;
  canFilterFavorites: boolean;
  onSearchTermChange: (value: string) => void;
  onSelectedCategoryChange: (value: number | 'all') => void;
  onPriceFilterChange: (value: PriceFilter) => void;
  onRatingFilterChange: (value: RatingFilter) => void;
  onFavoritesOnlyChange: () => void;
  onReset: () => void;
};

function RecipesFilters({
  categories,
  searchTerm,
  selectedCategoryId,
  priceFilter,
  ratingFilter,
  favoritesOnly,
  canFilterFavorites,
  onSearchTermChange,
  onSelectedCategoryChange,
  onPriceFilterChange,
  onRatingFilterChange,
  onFavoritesOnlyChange,
  onReset,
}: RecipesFiltersProps) {
  return (
    <section className="recipes-filters">
      <label className="recipes-filters__search">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Pretrazite recepte po nazivu ili opisu..."
        />
      </label>

      <div className="recipes-filters__categories">
        <div className="recipes-filters__header">
          <h2>Kategorije</h2>
          {canFilterFavorites ? (
            <button
              type="button"
              className={
                favoritesOnly
                  ? 'recipes-filters__chip recipes-filters__chip--active'
                  : 'recipes-filters__chip'
              }
              onClick={onFavoritesOnlyChange}
            >
              Moji omiljeni
            </button>
          ) : null}
        </div>

        <div className="recipes-filters__chips">
          <button
            type="button"
            className={
              selectedCategoryId === 'all'
                ? 'recipes-filters__chip recipes-filters__chip--active'
                : 'recipes-filters__chip'
            }
            onClick={() => onSelectedCategoryChange('all')}
          >
            Svi recepti
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={
                selectedCategoryId === category.id
                  ? 'recipes-filters__chip recipes-filters__chip--active'
                  : 'recipes-filters__chip'
              }
              onClick={() => onSelectedCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="recipes-filters__controls">
        <label className="recipes-filters__field">
          <span>Cena</span>
          <select
            value={priceFilter}
            onChange={(event) => onPriceFilterChange(event.target.value as PriceFilter)}
          >
            <option value="all">Sve cene</option>
            <option value="budget">Do 400 RSD</option>
            <option value="mid">401-800 RSD</option>
            <option value="premium">Preko 800 RSD</option>
          </select>
        </label>

        <label className="recipes-filters__field">
          <span>Ocena</span>
          <select
            value={ratingFilter}
            onChange={(event) => onRatingFilterChange(event.target.value as RatingFilter)}
          >
            <option value="all">Sve ocene</option>
            <option value="4plus">4.0 i vise</option>
            <option value="45plus">4.5 i vise</option>
          </select>
        </label>

        <button type="button" className="recipes-filters__reset" onClick={onReset}>
          Resetuj filtere
        </button>
      </div>
    </section>
  );
}

export default RecipesFilters;
